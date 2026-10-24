#!/usr/bin/env node
/**
 * Baja la portada de cada propiedad desde el CDN de Zonaprop, la guarda en
 * `public/properties/<slug>.webp` y reescribe `image:` en
 * `src/data/properties.mock.ts` para que apunte al propio dominio.
 *
 * Por qué: las portadas se cargan en la home al entrar (las ve todo visitante),
 * y el CDN de Zonaprop deja una cookie de terceros (`__cf_bm`) que baja el
 * puntaje de Buenas prácticas de Lighthouse, además de que si Zonaprop cambia
 * o bloquea la URL, la foto desaparece del sitio. Solo se aloja la portada:
 * la galería del modal sigue remota porque solo carga al abrir una propiedad.
 *
 * Uso:   node scripts/localize-covers.mjs
 * También lo llama `sync-properties.mjs` al terminar (con try/catch: si algo
 * falla, la portada queda con la URL remota y el sitio sigue funcionando).
 *
 * Idempotente: una portada que ya es local (`/properties/...`) se saltea.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = resolve(__dirname, '../src/data/properties.mock.ts');
const OUT_DIR = resolve(__dirname, '../public/properties');

/** Ancho máximo: la card muestra ~411 px, así que 960 cubre pantallas 2x con margen. */
const MAX_WIDTH = 960;
const WEBP_QUALITY = 80;

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36';

/** slug → portada remota, en el orden del archivo. */
const ENTRY = /slug:\s*['"]([^'"]+)['"][\s\S]*?\n\s*image:\s*"(https:\/\/[^"]+)"/g;

async function downloadAsWebp(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Referer: 'https://www.zonaprop.com.ar/' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} en ${url}`);
  const input = Buffer.from(await res.arrayBuffer());
  return sharp(input).resize({ width: MAX_WIDTH, withoutEnlargement: true }).webp({ quality: WEBP_QUALITY }).toBuffer();
}

export async function localizeCovers({ dataPath = DATA_PATH, outDir = OUT_DIR } = {}) {
  let source = await readFile(dataPath, 'utf8');
  const entries = [...source.matchAll(ENTRY)].map(([, slug, url]) => ({ slug, url }));
  await mkdir(outDir, { recursive: true });

  let done = 0;
  const failed = [];
  for (const { slug, url } of entries) {
    try {
      const webp = await downloadAsWebp(url);
      await writeFile(resolve(outDir, `${slug}.webp`), webp);
      source = source.replace(`image: "${url}"`, `image: "/properties/${slug}.webp"`);
      done += 1;
    } catch (err) {
      failed.push(`${slug}: ${err.message}`);
    }
  }

  await writeFile(dataPath, source, 'utf8');
  return { total: entries.length, done, failed };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { total, done, failed } = await localizeCovers();
  console.log(`✅ ${done}/${total} portadas guardadas en public/properties/`);
  if (failed.length > 0) {
    console.log(`⚠️  ${failed.length} no se pudieron bajar (quedan con la URL remota):`);
    failed.forEach((f) => console.log(`   - ${f}`));
    process.exitCode = 1;
  }
}
