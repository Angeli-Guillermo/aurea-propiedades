#!/usr/bin/env node
/**
 * Re-scrapea la ficha pública de la inmobiliaria en Zonaprop y regenera
 * `src/data/properties.mock.ts` con la cartera real actualizada.
 *
 * Uso:
 *   node scripts/sync-properties.mjs
 *
 * Qué hace:
 *   1. Descarga la página de listado de la inmobiliaria en Zonaprop.
 *   2. Extrae el link de cada aviso individual.
 *   3. Entra a cada aviso y saca precio, dirección, m² (cubierta y total),
 *      ambientes, dormitorios, baños, cocheras, antigüedad, expensas,
 *      destacados (disposición/orientación/luminosidad/apto crédito) y la
 *      galería de fotos COMPLETA (no sólo las miniaturas que se ven en el
 *      HTML — Zonaprop guarda el resto en un JSON embebido) — todo tal cual
 *      lo publica la inmobiliaria, sin completar nada a mano.
 *   4. Geocodifica cada dirección real con OpenStreetMap/Nominatim
 *      (1 request/segundo, respetando su política de uso).
 *   5. Escribe `src/data/properties.mock.ts` de nuevo, con el mismo
 *      formato que ya usa el sitio.
 *
 * Si un aviso se cae de Zonaprop (se vendió, se despublicó) o cambia el
 * precio, este script lo refleja automáticamente la próxima vez que se
 * corra. No hace falta pedirle a Claude que scrapee a mano de nuevo.
 *
 * Requiere Node 18+ (usa `fetch` global).
 */

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = resolve(__dirname, '../src/data/properties.mock.ts');

const AGENCY_LISTING_URL =
  'https://www.zonaprop.com.ar/inmobiliarias/consultora-internacional-de-negocios-inmobiliarios_17119153-inmuebles.html';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Categoría de Zonaprop (breadcrumb) → tipo interno del sitio. */
const TYPE_MAP = {
  departamento: 'piso',
  ph: 'ph',
  casa: 'casa',
  terreno: 'terreno',
  terrenos: 'terreno',
  'oficina comercial': 'oficina',
  'local comercial': 'local',
  cochera: 'cochera',
  duplex: 'duplex',
  dúplex: 'duplex',
};

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8',
      Referer: 'https://www.zonaprop.com.ar/',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} en ${url}`);
  return res.text();
}

/** Encuentra los links a avisos individuales en la página de listado de la inmobiliaria. */
function extractListingUrls(html) {
  const matches = [
    ...html.matchAll(/href="(\/propiedades\/clasificado\/[^"]+\.html)[^"]*"/g),
  ];
  const unique = [...new Set(matches.map((m) => `https://www.zonaprop.com.ar${m[1]}`))];
  return unique;
}

/** Extrae el substring de un array balanceado "[ ... ]" a partir del índice del "[" de apertura. */
function extractBalancedArray(str, openBracketIdx) {
  let depth = 0;
  for (let i = openBracketIdx; i < str.length; i++) {
    if (str[i] === '[') depth++;
    else if (str[i] === ']') {
      depth--;
      if (depth === 0) return str.slice(openBracketIdx, i + 1);
    }
  }
  return null;
}

/**
 * Galería completa del aviso: Zonaprop sólo renderiza como <img> unas pocas
 * miniaturas — el resto (hasta 14+ fotos reales) vive en un array JSON
 * `'pictures': [...]` embebido en la página, con orden y URL en 1200x1200.
 * Si sólo mirás los <img> del HTML, te quedan afuera la mayoría de las fotos.
 */
function parseGallery(html) {
  const marker = "'pictures': [";
  const idx = html.indexOf(marker);
  if (idx === -1) return [];
  const arrStr = extractBalancedArray(html, idx + marker.length - 1);
  if (!arrStr) return [];

  const matches = [...arrStr.matchAll(/"order":(\d+)[^}]*?"resizeUrl1200x1200":"([^"]+)"/g)];
  return matches
    .map((m) => ({ order: Number(m[1]), url: m[2].replace(/\\\//g, '/').split('?')[0] }))
    .sort((a, b) => a.order - b.order)
    .map((p) => p.url);
}

/** Expensas mensuales en ARS (no todos los avisos las declaran). */
function parseExpenses(html) {
  const m = html.match(/class="price-expenses">\s*Expensas\s*\$\s*([\d.,]+)/i);
  return m ? Number(m[1].replace(/[.,]/g, '')) : undefined;
}

/**
 * Destacados cualitativos (disposición, orientación, luminosidad, etc.) +
 * el badge "Apto crédito" / "Financiación bancaria" si el aviso lo declara.
 * `mainFeatures` embebido en la página trae tanto datos numéricos (m²,
 * ambientes, baños...) como estos cualitativos — nos quedamos sólo con
 * los que NO son un número, porque los numéricos ya se extraen aparte.
 */
function parseFeatures(html) {
  const features = [];

  const mfIdx = html.indexOf('mainFeatures');
  const braceIdx = html.indexOf('{', mfIdx);
  if (mfIdx !== -1 && braceIdx !== -1) {
    let depth = 0;
    let end = -1;
    for (let i = braceIdx; i < html.length; i++) {
      if (html[i] === '{') depth++;
      else if (html[i] === '}') {
        depth--;
        if (depth === 0) {
          end = i + 1;
          break;
        }
      }
    }
    if (end !== -1) {
      try {
        const parsed = JSON.parse(html.slice(braceIdx, end));
        for (const entry of Object.values(parsed)) {
          if (entry?.value && Number.isNaN(Number(entry.value))) {
            features.push(entry.label ? `${entry.label} ${entry.value}` : entry.value);
          }
        }
      } catch {
        // Si el JSON embebido cambia de forma, seguimos sin destacados cualitativos
        // en vez de romper todo el sync.
      }
    }
  }

  const complianceMatch = html.match(
    /feature-info">\s*<p>\s*[^<]*cumple con:\s*<b>([^<.]+)/i,
  );
  if (complianceMatch) features.push(complianceMatch[1].trim());

  return features;
}

/** "EXCELENTE DEPARTAMENTO..." → "Excelente departamento..." (conserva siglas/números). */
function toSentenceCase(text) {
  return text
    .toLowerCase()
    .replace(/(^\s*\w|[.!?]\s+\w)/g, (m) => m.toUpperCase())
    .replace(/\bph\b/gi, 'PH')
    .replace(/\bicba\b/gi, 'ICBA')
    .replace(/\bfleni\b/gi, 'FLENI');
}

/** Extrae los campos de un aviso individual desde su HTML crudo. */
function parseListing(html, url) {
  const keywords = (html.match(/name="keywords" content="([^"]+)"/i) || [])[1] || '';
  const title = (html.match(/<title>([^<]+)<\/title>/i) || [])[1]?.split(',')[0]?.trim() || '';

  // El párrafo de descripción real vive en <div class="section-description">.
  const descMatch = html.match(/class="section-description">\s*([^<]{20,3000}?)\s*<\/div>/);
  const description = descMatch ? toSentenceCase(descMatch[1].trim()) : title;

  const num = (label) => {
    const m = keywords.match(new RegExp(`${label}\\s+(\\d+)`, 'i'));
    return m ? Number(m[1]) : undefined;
  };

  const usdMatch = html.match(/USD\s?([\d.,]+)/);
  const price = usdMatch ? Number(usdMatch[1].replace(/[.,]/g, '')) : undefined;
  const opType = /alquiler\s+USD/i.test(html) ? 'alquiler' : 'venta';

  // "..., Capital Federal Zonaprop,{Categoría},{Comprar|Alquilar},Capital Federal,{barrios...}"
  // — un único patrón cubre venta y alquiler, a diferencia de buscar solo ",Comprar,".
  const catMatch = keywords.match(/Capital Federal Zonaprop,([^,]+),(Comprar|Alquilar),/i);
  const categoria = catMatch ? catMatch[1].trim().toLowerCase() : '';
  const type = TYPE_MAP[categoria] ?? 'piso';

  // La dirección completa vive en un único <h4>: "Calle Número,  Barrio, Ciudad/Barrio padre".
  const h4Match = html.match(/<h4[^>]*>([^<]{5,150})<\/h4>/);
  const addrParts = h4Match ? h4Match[1].split(',').map((s) => s.trim()).filter(Boolean) : [];
  const streetAddr = addrParts[0];
  const neighborhood = addrParts[1] ?? 'CABA';

  const gallery = parseGallery(html);
  const expenses = parseExpenses(html);
  const features = parseFeatures(html);

  const areaTot = num('Superficie total');
  const areaCub = num('Superficie cubierta');
  const antiguedad = num('Antigüedad');
  // Para un terreno, la superficie que importa es la del lote (total), no la
  // de una eventual casa vieja adentro (cubierta) — al revés que en el resto.
  const area = type === 'terreno' ? (areaTot ?? areaCub) : (areaCub ?? areaTot);
  // Superficie total sólo se guarda aparte cuando aporta un dato adicional
  // real (distinto de la cubierta que ya va en `area`).
  const areaTotal = type !== 'terreno' && areaTot && areaTot !== area ? areaTot : undefined;

  return {
    url,
    title,
    description,
    price,
    status: opType,
    type,
    neighborhood,
    address: streetAddr,
    bedrooms: num('Dormitorios') ?? 0,
    bathrooms: num('Baños') ?? num('Baño') ?? 0,
    rooms: num('Ambientes'),
    area,
    areaTotal,
    parking: num('Cochera') ?? 0,
    year: antiguedad ? new Date().getFullYear() - antiguedad : undefined,
    expenses,
    features,
    image: gallery[0],
    gallery,
  };
}

async function geocodeQuery(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'consultora-internacional-site-sync/1.0' },
  });
  const data = await res.json();
  await sleep(1100); // Nominatim: máx. 1 request/segundo
  return data[0] ? { lat: Number(data[0].lat), lng: Number(data[0].lon) } : null;
}

/**
 * Geocodifica con el barrio específico primero (ej. "Belgrano R", "Barrio Chino").
 * Esos nombres no siempre existen en OpenStreetMap como zona reconocida, así que
 * si no hay resultado reintenta con "CABA" a secas antes de rendirse.
 */
async function geocode(address, neighborhood) {
  const specific = await geocodeQuery(
    `${address}, ${neighborhood}, Ciudad Autónoma de Buenos Aires, Argentina`,
  );
  if (specific) return specific;
  return geocodeQuery(`${address}, Ciudad Autónoma de Buenos Aires, Argentina`);
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function toFileContent(properties) {
  const items = properties
    .map((p, i) => {
      const id = `p-${String(i + 1).padStart(3, '0')}`;
      const fields = [
        `id: '${id}'`,
        `slug: '${slugify(p.title)}'`,
        `title: ${JSON.stringify(p.title)}`,
        `description: ${JSON.stringify(p.description)}`,
        `price: ${p.price ?? 0}`,
        `currency: 'USD'`,
        `status: '${p.status}'`,
        `type: '${p.type}'`,
        `neighborhood: ${JSON.stringify(p.neighborhood)}`,
        `city: 'CABA'`,
        `address: ${JSON.stringify(p.address ?? '')}`,
        `bedrooms: ${p.bedrooms}`,
        `bathrooms: ${p.bathrooms}`,
        p.rooms ? `rooms: ${p.rooms}` : null,
        `area: ${p.area ?? 0}`,
        p.areaTotal ? `areaTotal: ${p.areaTotal}` : null,
        `parking: ${p.parking}`,
        p.year ? `year: ${p.year}` : null,
        p.expenses ? `expenses: ${p.expenses}` : null,
        `featured: ${i < 5}`,
        `image: ${JSON.stringify(p.image ?? '')}`,
        `gallery: ${JSON.stringify(p.gallery ?? [])}`,
        `features: ${JSON.stringify(p.features ?? [])}`,
        `lat: ${p.lat ?? 0}`,
        `lng: ${p.lng ?? 0}`,
      ].filter(Boolean);

      return `  {\n${fields.map((f) => `    ${f},`).join('\n')}\n  }`;
    })
    .join(',\n');

  return `import type { Property } from '@/types/property';

/**
 * Cartera REAL de Consultora Internacional de Negocios Inmobiliarios,
 * generada automáticamente por \`scripts/sync-properties.mjs\` a partir de
 * su ficha pública en Zonaprop: ${AGENCY_LISTING_URL}
 *
 * ⚠️ NO EDITAR A MANO — los cambios se pierden en el próximo sync.
 * Para actualizar la cartera: \`node scripts/sync-properties.mjs\`.
 * Última sincronización: ${new Date().toISOString().slice(0, 10)}
 *
 * Las descripciones son el texto real del aviso (pasado a minúsculas con
 * mayúscula inicial), no un resumen escrito a mano — pueden sonar un poco
 * telegráficas. Si les das una pasada de estilo a mano, guardá esos cambios
 * en otro lado antes de volver a correr el script, porque los pisa.
 */

export const MOCK_PROPERTIES: Property[] = [
${items}
];
`;
}

async function main() {
  console.log('🔎 Descargando listado de la inmobiliaria...');
  const listingHtml = await fetchHtml(AGENCY_LISTING_URL);
  const urls = extractListingUrls(listingHtml);
  console.log(`   ${urls.length} avisos encontrados.`);

  const properties = [];
  const warnings = [];
  for (const url of urls) {
    console.log(`   → ${url}`);
    const html = await fetchHtml(url);
    const parsed = parseListing(html, url);

    if (!parsed.address) {
      warnings.push(`Sin dirección: "${parsed.title}" (${url}) — revisar a mano.`);
    } else {
      const coords = await geocode(parsed.address, parsed.neighborhood);
      if (coords) {
        Object.assign(parsed, coords);
      } else {
        warnings.push(
          `No se pudo geocodificar "${parsed.address}, ${parsed.neighborhood}" (${parsed.title}) — quedó en 0,0, hay que poner las coordenadas a mano.`,
        );
      }
    }
    properties.push(parsed);
    await sleep(300);
  }

  const content = toFileContent(properties);
  await writeFile(OUTPUT_PATH, content, 'utf8');
  console.log(`✅ ${properties.length} propiedades escritas en ${OUTPUT_PATH}`);
  console.log('   Dale una revisada rápida — las descripciones son el texto real del aviso, sin pulir.');

  if (warnings.length > 0) {
    console.log(`\n⚠️  ${warnings.length} aviso(s) necesitan revisión manual:`);
    warnings.forEach((w) => console.log(`   - ${w}`));
  }
}

main().catch((err) => {
  console.error('❌ Error corriendo el sync:', err);
  process.exit(1);
});
