#!/usr/bin/env -S npx tsx
/**
 * Descarga las fotos de una (o todas las) propiedad(es), les superpone el
 * isologo real de la marca (casa dentro de un aro, ver HouseMark.tsx) en
 * mosaico diagonal repetido, y las deja listas en disco para publicar en
 * Instagram vía Upload-Post.
 *
 * Sólo se usa para el contenido que se postea en redes — las fotos que
 * muestra el sitio (cini.com.ar) siguen sin marca, tal cual vienen de
 * Zonaprop (decisión explícita: alcance acotado a redes sociales).
 *
 * Uso:
 *   npx tsx scripts/watermark-for-instagram.ts p-004        # una propiedad
 *   npx tsx scripts/watermark-for-instagram.ts all           # las 8
 *
 * Salida: $WATERMARK_OUT_DIR/<property-id>/01.jpg, 02.jpg, ...
 * (WATERMARK_OUT_DIR es obligatoria — pensada para apuntar a una carpeta
 * temporal, no al repo, porque estas imágenes son sólo para subir a redes).
 */

import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

import { MOCK_PROPERTIES } from '../src/data/properties.mock';
import { PROPERTY_TYPE_LABELS, type Property } from '../src/types/property';
import { formatPrice } from '../src/lib/format';

/** Máximo de fotos por carrusel que acepta Instagram (incluye la carátula). */
const IG_CAROUSEL_LIMIT = 10;

const NAVY = '#0F1C2E';
const GOLD = '#C6A667';
const CREAM = '#FBFAF7';

function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** "Departamento · 3 amb · 74 m²" / "Lote · 147 m²" — según los datos que tenga la ficha. */
function coverSubtitle(prop: Property): string {
  const parts = [PROPERTY_TYPE_LABELS[prop.type]];
  if (prop.rooms) parts.push(`${prop.rooms} amb`);
  if (prop.area) parts.push(`${prop.area} m²`);
  return parts.join(' · ');
}

/**
 * Isologo real de la marca (casa dentro de un aro), calcado del `viewBox`
 * de `src/components/ui/HouseMark.tsx` — mismo trazo, en blanco semi-
 * transparente para que se lea sobre cualquier foto.
 */
function houseMarkGlyph(): string {
  return `
    <circle cx="50" cy="50" r="46" stroke="#ffffff" stroke-opacity="0.28" stroke-width="3" fill="none" />
    <path d="M50 24 L76 47 L69 47 L69 76 L31 76 L31 47 L24 47 Z" fill="#ffffff" fill-opacity="0.2" />
    <rect x="41" y="56" width="7" height="20" fill="#000000" fill-opacity="0.16" />
    <rect x="52" y="56" width="7" height="20" fill="#000000" fill-opacity="0.16" />
  `;
}

/** Isologo sólido (aro dorado, casa color crema) para la carátula — variante `dark` de HouseMark.tsx. */
function houseMarkGlyphSolid(): string {
  return `
    <circle cx="50" cy="50" r="46" stroke="${GOLD}" stroke-width="2.5" fill="none" />
    <path d="M50 24 L76 47 L69 47 L69 76 L31 76 L31 47 L24 47 Z" fill="${CREAM}" />
    <rect x="41" y="56" width="7" height="20" fill="${NAVY}" />
    <rect x="52" y="56" width="7" height="20" fill="${NAVY}" />
  `;
}

/**
 * Carátula del carrusel: fondo navy sólido, isologo dorado, y los datos
 * clave de la propiedad (estado, zona, tipo/m², precio, dirección) — el
 * "hook" visual que se ve primero en el feed, antes de las fotos reales.
 */
function buildCoverSvg(prop: Property, width: number, height: number): Buffer {
  const cx = width / 2;
  const markSize = 190;
  const neighborhood = escapeXml(prop.neighborhood.toUpperCase());
  const neighborhoodSize = neighborhood.length > 16 ? 50 : 66;
  const eyebrow = prop.status === 'alquiler' ? 'EN ALQUILER' : 'EN VENTA';
  const subtitle = escapeXml(coverSubtitle(prop));
  const price = escapeXml(
    prop.price > 0
      ? formatPrice(prop.price, prop.currency) + (prop.status === 'alquiler' ? '/mes' : '')
      : 'Consultar precio',
  );
  const address = escapeXml(prop.address);

  // Bloque central compuesto de arriba hacia abajo con gaps fijos entre
  // líneas, y luego centrado verticalmente como un todo (en vez de anclar
  // el precio al piso, que dejaba un hueco vacío en medianas propiedades).
  const markY = 0;
  const eyebrowY = markY + markSize + 78;
  const neighborhoodY = eyebrowY + neighborhoodSize + 14;
  const subtitleY = neighborhoodY + 52;
  const lineY = subtitleY + 100;
  const priceY = lineY + 90;
  const addressY = priceY + 60;
  const blockHeight = addressY - markY;
  const offsetY = (height - blockHeight) / 2 - 40;

  const svg = `
  <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="${NAVY}" />
    <g transform="translate(0, ${offsetY})">
      <g transform="translate(${cx - markSize / 2}, ${markY}) scale(${markSize / 100})">
        ${houseMarkGlyphSolid()}
      </g>
      <text x="${cx}" y="${eyebrowY}" text-anchor="middle" fill="${GOLD}"
        font-family="Arial, Helvetica, sans-serif" font-size="30" letter-spacing="6" font-weight="700">${eyebrow}</text>
      <text x="${cx}" y="${neighborhoodY}" text-anchor="middle" fill="${CREAM}"
        font-family="Arial, Helvetica, sans-serif" font-size="${neighborhoodSize}" font-weight="700">${neighborhood}</text>
      <text x="${cx}" y="${subtitleY}" text-anchor="middle" fill="${CREAM}"
        font-family="Arial, Helvetica, sans-serif" font-size="32" opacity="0.85">${subtitle}</text>
      <line x1="${cx - 150}" y1="${lineY}" x2="${cx + 150}" y2="${lineY}" stroke="${GOLD}" stroke-width="1" opacity="0.5" />
      <text x="${cx}" y="${priceY}" text-anchor="middle" fill="${GOLD}"
        font-family="Arial, Helvetica, sans-serif" font-size="72" font-weight="700">${price}</text>
      <text x="${cx}" y="${addressY}" text-anchor="middle" fill="${CREAM}"
        font-family="Arial, Helvetica, sans-serif" font-size="28" opacity="0.75">${address}</text>
    </g>
    <text x="${cx}" y="${height - 90}" text-anchor="middle" fill="${CREAM}"
      font-family="Arial, Helvetica, sans-serif" font-size="26" letter-spacing="2" opacity="0.6">CINI.COM.AR</text>
  </svg>`;
  return Buffer.from(svg);
}

async function renderCoverSlide(prop: Property, outPath: string): Promise<void> {
  const svg = buildCoverSvg(prop, CANVAS_WIDTH, CANVAS_HEIGHT);
  await sharp(svg).jpeg({ quality: 92 }).toFile(outPath);
}

function buildWatermarkSvg(width: number, height: number): Buffer {
  const tile = 420;
  const glyphSize = 70;
  const scale = glyphSize / 100;
  const svg = `
  <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="wm" width="${tile}" height="${tile}" patternUnits="userSpaceOnUse" patternTransform="rotate(-25)">
        <g transform="translate(${(tile - glyphSize) / 2}, ${(tile - glyphSize) / 2}) scale(${scale})">
          ${houseMarkGlyph()}
        </g>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#wm)" />
  </svg>`;
  return Buffer.from(svg);
}

/**
 * Instagram exige una relación de aspecto entre 4:5 y 1.91:1. Las fotos de
 * Zonaprop vienen con relaciones variadas (verticales de celular incluidas),
 * así que se recortan a un lienzo 4:5 fijo (cover, centrado) — la foto ocupa
 * el 100% del cuadro, sin franjas de color; a cambio se pierde el sobrante
 * de los bordes en fotos con una relación de aspecto muy distinta.
 */
const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1350;

async function watermarkOne(url: string, outPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo descargar ${url} (HTTP ${res.status})`);
  const original = Buffer.from(await res.arrayBuffer());

  const framed = await sharp(original)
    .resize(CANVAS_WIDTH, CANVAS_HEIGHT, { fit: 'cover', position: 'centre' })
    .toBuffer();

  const overlay = buildWatermarkSvg(CANVAS_WIDTH, CANVAS_HEIGHT);

  await sharp(framed)
    .composite([{ input: overlay, top: 0, left: 0 }])
    .jpeg({ quality: 90 })
    .toFile(outPath);
}

/**
 * Índices de galería a excluir por dirección (no por `id`, que se
 * renumera en cada `sync-properties.mjs`) — fotos que no son del inmueble,
 * detectadas a mano al revisar el mosaico (ej. capturas de Google Street
 * View que algunos avisos incluyen como referencia de ubicación).
 */
const EXCLUDE_GALLERY_INDEX: Record<string, number[]> = {
  'Jose Pedro Varela 5883': [0],
};

async function processProperty(prop: Property, outDir: string): Promise<void> {
  const dir = join(outDir, prop.id);
  await mkdir(dir, { recursive: true });

  const excluded = new Set(EXCLUDE_GALLERY_INDEX[prop.address] ?? []);
  const photos = prop.gallery.filter((_, i) => !excluded.has(i)).slice(0, IG_CAROUSEL_LIMIT - 1);

  console.log(`\n${prop.id} — ${prop.title} (carátula + ${photos.length} foto${photos.length === 1 ? '' : 's'})`);

  const coverPath = join(dir, '00-caratula.jpg');
  await renderCoverSlide(prop, coverPath);
  console.log(`  ✓ ${coverPath}`);

  for (let i = 0; i < photos.length; i++) {
    const outPath = join(dir, `${String(i + 1).padStart(2, '0')}.jpg`);
    await watermarkOne(photos[i], outPath);
    console.log(`  ✓ ${outPath}`);
  }
}

async function main(): Promise<void> {
  const arg = process.argv[2];
  const outDir = process.env.WATERMARK_OUT_DIR;

  if (!arg) {
    console.error('Uso: npx tsx scripts/watermark-for-instagram.ts <property-id | all>');
    process.exit(1);
  }
  if (!outDir) {
    console.error('Falta la variable de entorno WATERMARK_OUT_DIR (carpeta de salida).');
    process.exit(1);
  }

  const targets = arg === 'all' ? MOCK_PROPERTIES : MOCK_PROPERTIES.filter((p) => p.id === arg);
  if (targets.length === 0) {
    console.error(`No se encontró ninguna propiedad con id "${arg}".`);
    process.exit(1);
  }

  for (const prop of targets) {
    await processProperty(prop, outDir);
  }
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
