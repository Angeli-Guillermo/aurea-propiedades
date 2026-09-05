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

/** Máximo de fotos por carrusel que acepta Instagram. */
const IG_CAROUSEL_LIMIT = 10;

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

async function watermarkOne(url: string, outPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo descargar ${url} (HTTP ${res.status})`);
  const original = Buffer.from(await res.arrayBuffer());
  const meta = await sharp(original).metadata();
  const width = meta.width ?? 1200;
  const height = meta.height ?? 1200;
  const overlay = buildWatermarkSvg(width, height);

  await sharp(original)
    .composite([{ input: overlay, top: 0, left: 0 }])
    .jpeg({ quality: 90 })
    .toFile(outPath);
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
    const dir = join(outDir, prop.id);
    await mkdir(dir, { recursive: true });
    const images = prop.gallery.slice(0, IG_CAROUSEL_LIMIT);
    console.log(`\n${prop.id} — ${prop.title} (${images.length} foto${images.length === 1 ? '' : 's'})`);
    for (let i = 0; i < images.length; i++) {
      const outPath = join(dir, `${String(i + 1).padStart(2, '0')}.jpg`);
      await watermarkOne(images[i], outPath);
      console.log(`  ✓ ${outPath}`);
    }
  }
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
