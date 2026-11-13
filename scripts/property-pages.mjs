#!/usr/bin/env node
/**
 * Una página estática por propiedad: dist/propiedades/<slug>/index.html, más
 * el índice dist/propiedades/index.html, y las suma a dist/sitemap.xml.
 *
 * Por qué: la cartera vivía solo en un modal de la home, invisible para Google
 * y sin link propio para compartir. Cada ficha ahora tiene URL, título y
 * descripción propios, datos estructurados (schema.org) y una imagen JPG
 * 1200x630 para la vista previa de WhatsApp/Instagram/Facebook.
 *
 * Mismo patrón que /tasacion-de-propiedades/ (HTML estático + legal.css) y
 * mismos datos que la home (src/data/properties.mock.ts vía Vite SSR).
 * Se corre después de `vite build` (script `build` de package.json). Si no
 * hay propiedades o algo falla, el build falla: mejor eso que publicar fichas rotas.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createServer } from 'vite';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
const ORIGIN = 'https://cini.com.ar';
const TODAY = new Date().toISOString().slice(0, 10);
const CLARITY_ID = 'zcu0ax8u4u';

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** JSON dentro de <script>: escapar "<" evita cerrar la etiqueta desde los datos. */
const jsonLd = (obj) => JSON.stringify(obj, null, 2).replace(/</g, '\\u003c');

const vite = await createServer({ root, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });

try {
  const { MOCK_PROPERTIES: props } = await vite.ssrLoadModule('/src/data/properties.mock.ts');
  const { SITE, whatsappUrl } = await vite.ssrLoadModule('/src/data/site.ts');
  const { formatPrice, formatArea, cleanScrapedDescription } = await vite.ssrLoadModule('/src/lib/format.ts');
  const { PROPERTY_TYPE_LABELS } = await vite.ssrLoadModule('/src/types/property.ts');
  if (!props?.length) throw new Error('No hay propiedades para generar fichas.');

  const shared = (title, description, url, image) => `<!doctype html>
<html lang="es-AR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#0F1C2E" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <link rel="canonical" href="${url}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Consultora Internacional de Negocios Inmobiliarios" />
  <meta property="og:locale" content="es_AR" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="${image}" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=Inter:wght@300..600&display=swap" />
  <link rel="stylesheet" href="/legal.css" />
  <style>
    .lead { font-size: 1.125rem; color: var(--ink-900); }
    .price { font-family: 'Fraunces', ui-serif, Georgia, serif; font-size: 2rem; color: var(--ink-900); margin: 0.5rem 0 0; }
    .cover { width: 100%; height: auto; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 0.75rem; margin: 1.5rem 0 0; background: var(--sand-200); }
    .specs { display: grid; grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr)); gap: 0.75rem; margin: 1.5rem 0 0; padding: 0; list-style: none; }
    .specs li { border: 1px solid var(--sand-200); border-radius: 0.5rem; padding: 0.75rem 1rem; margin: 0; }
    .specs strong { display: block; color: var(--ink-900); font-size: 1.0625rem; }
    .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr)); gap: 0.5rem; margin: 1rem 0 0; }
    .gallery img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 0.5rem; background: var(--sand-200); }
    .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr)); gap: 1rem; margin: 1.5rem 0 0; padding: 0; list-style: none; }
    .cards li { margin: 0; }
    .cards a { display: block; text-decoration: none; color: inherit; border: 1px solid var(--sand-200); border-radius: 0.75rem; overflow: hidden; }
    .cards a:hover { border-color: var(--gold-500); }
    .cards img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; display: block; }
    .cards span { display: block; padding: 0.75rem 1rem; }
    .actions { display: flex; flex-wrap: wrap; gap: 0.75rem; margin: 1.75rem 0 0; }
    .btn { display: inline-block; padding: 0.8rem 1.4rem; border-radius: 0.25rem; font-weight: 500; font-size: 0.9375rem; text-decoration: none; border: 1px solid var(--ink-900); }
    .btn-primary { background: var(--ink-900); color: var(--sand-50); }
    .btn-primary:hover { background: var(--ink-700); }
    .btn-secondary { background: transparent; color: var(--ink-900); }
    .btn-secondary:hover { background: var(--sand-200); }
    .btn:focus-visible, .cards a:focus-visible { outline: 3px solid var(--gold-500); outline-offset: 2px; }
  </style>`;

  const headerFooter = (main) => `
<!-- Microsoft Clarity (sin cookies, configurado desde su consola) -->
<script type="text/javascript">(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "${CLARITY_ID}");</script>
<script>document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('a[href*="wa.me/"]'))window.clarity('event','contacto_whatsapp')});</script>
</head>
<body>
  <header class="legal-header">
    <a class="brand" href="/">
      <svg viewBox="0 0 100 100" class="mark" aria-hidden="true">
        <circle cx="50" cy="50" r="46" stroke="#0F1C2E" stroke-width="3" fill="none" />
        <path d="M50 24 L76 47 L69 47 L69 76 L31 76 L31 47 L24 47 Z" fill="#0F1C2E" />
        <rect x="41" y="56" width="7" height="20" fill="#FBFAF7" />
        <rect x="52" y="56" width="7" height="20" fill="#FBFAF7" />
      </svg>
      <span>
        <strong>Consultora Internacional</strong>
        <small>Negocios Inmobiliarios y Financieros</small>
      </span>
    </a>
    <a class="back" href="/propiedades/">← Todas las propiedades</a>
  </header>
  <main class="legal-content">
${main}
    <p class="see-also">Ver también: <a href="/">Inicio</a> · <a href="/propiedades/">Propiedades</a> · <a href="/tasacion-de-propiedades/">Tasación gratuita</a> · <a href="/privacidad.html">Privacidad</a></p>
  </main>
  <footer class="legal-footer">
    <p>© ${TODAY.slice(0, 4)} Consultora Internacional de Negocios Inmobiliarios. Todos los derechos reservados.</p>
  </footer>
</body>
</html>
`;

  const operacion = (p) => (p.status === 'alquiler' ? 'alquiler' : 'venta');
  const heading = (p) => `${PROPERTY_TYPE_LABELS[p.type]} en ${operacion(p)} en ${p.neighborhood}`;
  const absImg = (src) => (src.startsWith('/') ? ORIGIN + src : src);

  async function ogImage(p, outDir) {
    const src = p.image.startsWith('/')
      ? await readFile(resolve(root, 'public', p.image.slice(1)))
      : Buffer.from(await (await fetch(p.image)).arrayBuffer());
    await sharp(src).resize(1200, 630, { fit: 'cover' }).jpeg({ quality: 82 }).toFile(resolve(outDir, 'og.jpg'));
  }

  for (const p of props) {
    const url = `${ORIGIN}/propiedades/${p.slug}/`;
    const outDir = resolve(dist, 'propiedades', p.slug);
    await mkdir(outDir, { recursive: true });
    await ogImage(p, outDir);

    const specs = [
      p.rooms && ['Ambientes', p.rooms],
      p.bedrooms > 0 && ['Dormitorios', p.bedrooms],
      p.bathrooms > 0 && ['Baños', p.bathrooms],
      ['Sup. cubierta', formatArea(p.area)],
      p.areaTotal && ['Sup. total', formatArea(p.areaTotal)],
      p.parking > 0 && ['Cocheras', p.parking],
      p.year && ['Año', p.year],
      p.expenses && ['Expensas', formatPrice(p.expenses, 'ARS')],
    ].filter(Boolean);
    const precio = formatPrice(p.price, p.currency);
    const resumen = [p.rooms && `${p.rooms} amb.`, formatArea(p.area)].filter(Boolean).join(' · ');
    const title = `${heading(p)} · ${resumen} · ${precio} | CINI`;
    // El título ya dice tipo, barrio, ambientes, m² y precio: la descripción suma
    // lo que no está (dormitorios, baños) y quién atiende, sin repetirlo.
    const detalle = [p.bedrooms > 0 && `${p.bedrooms} dormitorio${p.bedrooms > 1 ? 's' : ''}`, p.bathrooms > 0 && `${p.bathrooms} baño${p.bathrooms > 1 ? 's' : ''}`, p.parking > 0 && `${p.parking} cochera${p.parking > 1 ? 's' : ''}`].filter(Boolean).join(', ');
    const description = `${detalle ? detalle[0].toUpperCase() + detalle.slice(1) + '. ' : ''}Consultá por WhatsApp con Mauro Otranto, corredor inmobiliario (CUCICBA Mat. 5846).`;
    const fotos = [...new Set(p.gallery)].filter((g) => g !== p.image);
    const listing = {
      '@context': 'https://schema.org',
      '@type': 'RealEstateListing',
      name: p.title,
      url,
      image: [absImg(p.image), ...fotos.slice(0, 5)],
      description: cleanScrapedDescription(p.description).slice(0, 500),
      offers: { '@type': 'Offer', price: p.price, priceCurrency: p.currency, businessFunction: p.status === 'alquiler' ? 'http://purl.org/goodrelations/v1#LeaseOut' : 'http://purl.org/goodrelations/v1#Sell' },
      contentLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', streetAddress: p.address, addressLocality: p.neighborhood, addressRegion: p.city, addressCountry: 'AR' }, geo: { '@type': 'GeoCoordinates', latitude: p.lat, longitude: p.lng } },
      provider: { '@type': 'RealEstateAgent', name: 'Consultora Internacional de Negocios Inmobiliarios', url: `${ORIGIN}/`, telephone: SITE.mauroPhone },
    };

    const main = `    <p class="eyebrow">${esc(p.neighborhood)} · ${esc(operacion(p))}</p>
    <h1>${esc(heading(p))}</h1>
    <p class="lead">${esc(p.title)}</p>
    <p class="price">${esc(precio)}</p>
    <img class="cover" src="${esc(p.image)}" alt="${esc(`${p.title}, ${p.neighborhood}`)}" width="1200" height="900" />
    <ul class="specs">
${specs.map(([k, v]) => `      <li><strong>${esc(v)}</strong>${esc(k)}</li>`).join('\n')}
    </ul>
    <div class="actions">
      <a class="btn btn-primary" href="${esc(whatsappUrl(`Hola, me interesa la propiedad "${p.title}" (${p.neighborhood}). ¿Podemos hablar? ${url}`))}" rel="noopener">Consultar por WhatsApp</a>
      <a class="btn btn-secondary" href="/#contacto">Dejar mis datos</a>
    </div>
    <section>
      <h2>Descripción</h2>
      <p>${esc(cleanScrapedDescription(p.description))}</p>
${p.features.length ? `      <ul>\n${p.features.map((f) => `        <li>${esc(f)}</li>`).join('\n')}\n      </ul>` : ''}
      <p>Ubicación: ${esc(p.address)}, ${esc(p.neighborhood)}, ${esc(p.city)}.</p>
    </section>
${fotos.length ? `    <section>\n      <h2>Fotos</h2>\n      <div class="gallery">\n${fotos.map((g, i) => `        <img src="${esc(g)}" alt="${esc(`${p.title}, foto ${i + 2}`)}" loading="lazy" width="800" height="600" />`).join('\n')}\n      </div>\n    </section>` : ''}`;

    const html = shared(title, description, url, `${url}og.jpg`) +
      `\n  <script type="application/ld+json">\n${jsonLd(listing)}\n  </script>` + headerFooter(main);
    await writeFile(resolve(outDir, 'index.html'), html, 'utf8');
  }

  // Índice: también es el camino por el que Google descubre las fichas.
  const indexUrl = `${ORIGIN}/propiedades/`;
  const indexMain = `    <p class="eyebrow">Cartera actual</p>
    <h1>Propiedades en venta y alquiler en la Ciudad de Buenos Aires</h1>
    <p class="lead">${props.length} propiedades publicadas por Consultora Internacional. Tocá una para ver fotos, superficie y precio.</p>
    <ul class="cards">
${props.map((p) => `      <li><a href="/propiedades/${p.slug}/"><img src="${esc(p.image)}" alt="" loading="lazy" width="800" height="600" /><span><strong>${esc(heading(p))}</strong><br />${esc(formatPrice(p.price, p.currency))} · ${esc(formatArea(p.area))}</span></a></li>`).join('\n')}
    </ul>`;
  await mkdir(resolve(dist, 'propiedades'), { recursive: true });
  await writeFile(
    resolve(dist, 'propiedades/index.html'),
    shared('Propiedades en venta y alquiler en CABA | CINI', `Cartera actual de Consultora Internacional: ${props.length} propiedades en la Ciudad de Buenos Aires.`, indexUrl, `${ORIGIN}/brand/og-cini.jpg`) +
      headerFooter(indexMain).replace('<a class="back" href="/propiedades/">← Todas las propiedades</a>', '<a class="back" href="/">← Volver al sitio</a>'),
    'utf8',
  );

  const sitemapPath = resolve(dist, 'sitemap.xml');
  const urls = [indexUrl, ...props.map((p) => `${ORIGIN}/propiedades/${p.slug}/`)]
    .map((u) => `  <url>\n    <loc>${u}</loc>\n    <lastmod>${TODAY}</lastmod>\n  </url>`)
    .join('\n');
  const sitemap = await readFile(sitemapPath, 'utf8');
  await writeFile(sitemapPath, sitemap.replace('</urlset>', `${urls}\n</urlset>`), 'utf8');

  console.log(`Fichas: ${props.length} propiedades + índice en dist/propiedades/, sitemap actualizado.`);
} catch (err) {
  console.error('Fichas de propiedades fallaron:', err.message);
  process.exitCode = 1;
} finally {
  await vite.close();
}
