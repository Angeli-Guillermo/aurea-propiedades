#!/usr/bin/env node
/**
 * Genera un video vertical (1080x1920, para Reels/Stories/WhatsApp) por cada
 * propiedad de la cartera, a partir de las fotos reales del aviso.
 *
 * Uso:
 *   node scripts/generate-videos.mjs                  → todas las propiedades
 *   node scripts/generate-videos.mjs p-005 p-008       → solo esos ids
 *   node scripts/generate-videos.mjs --slug belgrano-exc-depto-3-amb-balcon-corrido-frente
 *
 * Qué hace por cada propiedad:
 *   1. Descarga hasta MAX_PHOTOS fotos de su galería (`gallery` en properties.mock.ts).
 *   2. A cada foto le aplica un zoom lento (Ken Burns), la recorta a 1080x1920
 *      y le superpone barrio/tipo, dirección, precio y specs (dorm/baños/m²).
 *   3. Le agrega un cierre de marca fijo: el isologo real (`public/brand/logo-mark.png`,
 *      el mismo círculo dorado de favicon.svg / Instagram), nombre y la web bien grande.
 *   4. Concatena todo (sin recodificar) en `dist/videos/<slug>.mp4`.
 *
 * Requiere `ffmpeg` en el PATH y conexión a internet (a los CDN de las fotos
 * y, la primera vez, para bajar la tipografía). No corre en el sandbox de
 * Claude porque ahí el acceso a esos dominios está bloqueado por política de
 * red — pensado para correrlo en tu máquina o en CI.
 */

import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT_DIR = join(ROOT, 'dist', 'videos');
const LOGO_PATH = join(ROOT, 'public', 'brand', 'logo-mark.png');
const FONT_CACHE = join(ROOT, 'dist', '.cache', 'Inter.ttf');
const FONT_URL =
  'https://raw.githubusercontent.com/google/fonts/main/ofl/inter/Inter%5Bopsz,wght%5D.ttf';

const MAX_PHOTOS = 6;
const PHOTO_SECONDS = 2.6;
const OUTRO_SECONDS = 3;
const FPS = 30;
const WIDTH = 1080;
const HEIGHT = 1920;

const TYPE_LABELS = {
  piso: 'Departamento',
  ph: 'PH',
  atico: 'Penthouse',
  duplex: 'Dúplex',
  casa: 'Casa',
  terreno: 'Terreno',
  oficina: 'Oficina',
  local: 'Local comercial',
  cochera: 'Cochera',
};

function run(cmd, args) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(cmd, args, { cwd: ROOT, stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (d) => (stderr += d));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`${cmd} salió con código ${code}\n${stderr.slice(-2000)}`));
    });
  });
}

async function checkFfmpeg() {
  try {
    await run('ffmpeg', ['-version']);
  } catch {
    console.error(
      '❌ No se encontró `ffmpeg` en el PATH. Instalalo (macOS: `brew install ffmpeg`, ' +
        'Ubuntu/Debian: `sudo apt install ffmpeg`, Windows: https://ffmpeg.org/download.html) y volvé a correr este script.',
    );
    process.exit(1);
  }
}

async function ensureFont() {
  if (existsSync(FONT_CACHE)) return FONT_CACHE;
  console.log('   Descargando tipografía (Inter, una sola vez)…');
  await mkdir(dirname(FONT_CACHE), { recursive: true });
  const res = await fetch(FONT_URL);
  if (!res.ok) throw new Error(`No se pudo descargar la fuente (HTTP ${res.status})`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(FONT_CACHE, buf);
  return FONT_CACHE;
}

/** `properties.mock.ts` es TS (tiene `import type` y una anotación `: Property[]`).
 *  El resto del archivo es un literal de JS válido, así que alcanza con pelarle
 *  esas dos líneas para poder importarlo como .mjs normal — no vale la pena
 *  sumar un parser TS a un script de una sola vez. */
async function loadProperties() {
  const srcPath = join(ROOT, 'src', 'data', 'properties.mock.ts');
  const raw = await readFile(srcPath, 'utf8');
  const js = raw
    .replace(/^import type .+\r?\n/m, '')
    .replace(/:\s*Property\[\]/, '');
  const tmpFile = join(tmpdir(), `properties.mock.${Date.now()}.mjs`);
  await writeFile(tmpFile, js, 'utf8');
  try {
    const mod = await import(pathToFileURL(tmpFile).href);
    return mod.MOCK_PROPERTIES;
  } finally {
    await rm(tmpFile, { force: true });
  }
}

/** Convierte una ruta absoluta en relativa a ROOT para usarla dentro de un
 *  filtro de ffmpeg (p.ej. `fontfile=...`). En Windows los dos puntos de la
 *  unidad (`C:`) chocan con el separador de opciones del filtro sin importar
 *  cómo se los escape, así que evitamos el problema de raíz: rutas relativas
 *  (sin unidad) resueltas contra el `cwd: ROOT` que le pasamos a `run()`. */
function escFilterPath(absPath) {
  return relative(ROOT, absPath).replace(/\\/g, '/');
}

/** Escapa texto para usarlo dentro de `drawtext=text='...'` de ffmpeg. */
function escText(s) {
  return String(s)
    .replace(/\\/g, '\\\\\\\\')
    .replace(/:/g, '\\:')
    .replace(/'/g, "'\\\\\\''")
    .replace(/%/g, '\\%');
}

function formatPrice(p) {
  const symbol = p.currency === 'USD' ? 'USD' : '$';
  const amount = Number(p.price ?? 0).toLocaleString('es-AR');
  const suffix = p.status === 'alquiler' ? ' /mes' : '';
  return `${symbol} ${amount}${suffix}`;
}

function specsLine(p) {
  const parts = [];
  if (p.rooms) parts.push(`${p.rooms} amb.`);
  if (p.bedrooms) parts.push(`${p.bedrooms} dorm`);
  if (p.bathrooms) parts.push(`${p.bathrooms} baño${p.bathrooms > 1 ? 's' : ''}`);
  if (p.area) parts.push(`${p.area} m²`);
  if (p.parking) parts.push(`${p.parking} cochera${p.parking > 1 ? 's' : ''}`);
  return parts.join('  ·  ');
}

/** Algunas fichas de ZonaProp repiten el mismo archivo de foto dos veces en
 *  la galería (visto en la práctica, no es solo teórico). Recorre TODA la
 *  galería —no solo los primeros MAX_PHOTOS— y descarta por hash de
 *  contenido cualquier descarga idéntica a una ya guardada, así los
 *  MAX_PHOTOS que terminan en el video son todos distintos entre sí. */
async function downloadPhotos(property, dir) {
  const urls = property.gallery ?? [];
  const paths = [];
  const seenHashes = new Set();
  for (let i = 0; i < urls.length && paths.length < MAX_PHOTOS; i++) {
    const url = urls[i];
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      const hash = createHash('sha1').update(buf).digest('hex');
      if (seenHashes.has(hash)) {
        console.warn(`   ⚠️  Foto ${i + 1} es idéntica a otra ya descargada — se omite.`);
        continue;
      }
      seenHashes.add(hash);
      const path = join(dir, `${String(paths.length).padStart(2, '0')}.jpg`);
      await writeFile(path, buf);
      paths.push(path);
    } catch (err) {
      console.warn(`   ⚠️  No se pudo bajar la foto ${i + 1} (${url}): ${err.message}`);
    }
  }
  return paths;
}

/**
 * La mayoría de las fotos de ZonaProp son horizontales (o casi cuadradas) y
 * el video es vertical 9:16. Recortar directo al centro (como se hacía antes)
 * blanqueaba el contexto de la foto —a veces dejaba solo una esquina de piso
 * y pared, borrosa por el estirado— y de paso hacía que fotos distintas
 * terminaran pareciendo la misma habitación genérica una y otra vez.
 * Ahora se ve la foto COMPLETA (sin recortar) centrada sobre un fondo de la
 * misma foto, desenfocado y oscurecido, que rellena el resto del cuadro.
 */
function buildPhotoFilter({ font: rawFont, badge, address, price, specs }) {
  const font = escFilterPath(rawFont);
  const frames = Math.round(PHOTO_SECONDS * FPS);
  const box = (color) => `box=1:boxcolor=${color}:boxborderw=16`;
  const texts = [
    `drawtext=fontfile=${font}:text='${escText(badge)}':fontcolor=white:fontsize=32:x=48:y=90:box=1:boxcolor=black@0.35:boxborderw=14`,
    `drawtext=fontfile=${font}:text='${escText(address)}':fontcolor=white:fontsize=38:x=48:y=h-266:${box('0x0f1c2e@0.6')}`,
    `drawtext=fontfile=${font}:text='${escText(price)}':fontcolor=0xdcc493:fontsize=54:x=48:y=h-200:${box('0x0f1c2e@0.6')}`,
    specs
      ? `drawtext=fontfile=${font}:text='${escText(specs)}':fontcolor=white:fontsize=28:x=48:y=h-118:${box('0x0f1c2e@0.6')}`
      : null,
  ]
    .filter(Boolean)
    .join(',');
  return (
    `[0:v]split=2[bg][fg];` +
    `[bg]scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase,crop=${WIDTH}:${HEIGHT},gblur=sigma=40,eq=brightness=-0.08[bg2];` +
    `[fg]scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=decrease[fg2];` +
    `[bg2][fg2]overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2,` +
    `zoompan=z='min(zoom+0.0008,1.15)':d=${frames}:s=${WIDTH}x${HEIGHT}:fps=${FPS},` +
    texts
  );
}

async function buildPhotoClip(photoPath, outPath, texts, font) {
  await run('ffmpeg', [
    '-y',
    '-loop', '1',
    '-i', photoPath,
    '-t', String(PHOTO_SECONDS),
    '-filter_complex', buildPhotoFilter({ font, ...texts }),
    '-r', String(FPS),
    '-pix_fmt', 'yuv420p',
    '-an',
    outPath,
  ]);
}

/**
 * Placa de cierre fija, igual en los ocho videos: el isologo real del sitio
 * (favicon.svg / foto de perfil de Instagram), nombre, y la web como el dato
 * más grande de la placa — es lo único que alguien necesita recordar.
 */
async function buildOutroClip(outPath, rawFont, logo) {
  const font = escFilterPath(rawFont);
  const logoSize = 260;
  const logoY = 620;
  const filter = [
    `[1:v]scale=${logoSize}:${logoSize}[logo]`,
    `[0:v][logo]overlay=(main_w-overlay_w)/2:${logoY}`,
    `drawtext=fontfile=${font}:text='Consultora Internacional':fontcolor=0xf5f2ec:fontsize=50:x=(w-text_w)/2:y=${logoY + logoSize + 40}`,
    `drawtext=fontfile=${font}:text='Negocios inmobiliarios y financieros':fontcolor=0xb3c3d3:fontsize=26:x=(w-text_w)/2:y=${logoY + logoSize + 106}`,
    `drawtext=fontfile=${font}:text='cini.com.ar':fontcolor=0xdcc493:fontsize=64:x=(w-text_w)/2:y=${logoY + logoSize + 172}`,
    `drawtext=fontfile=${font}:text='+54 11 6023-7430':fontcolor=0x7d97b3:fontsize=28:x=(w-text_w)/2:y=${logoY + logoSize + 258}`,
  ].join(',');
  await run('ffmpeg', [
    '-y',
    '-f', 'lavfi',
    '-i', `color=c=0x0f1c2e:s=${WIDTH}x${HEIGHT}:d=${OUTRO_SECONDS}`,
    '-i', logo,
    '-filter_complex', filter,
    '-r', String(FPS),
    '-pix_fmt', 'yuv420p',
    '-an',
    outPath,
  ]);
}

async function concatClips(clipPaths, outPath, workDir) {
  const listPath = join(workDir, 'list.txt');
  const listContent = clipPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join('\n');
  await writeFile(listPath, listContent, 'utf8');
  await run('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', listPath, '-c', 'copy', outPath]);
}

async function generateOne(property, font, logo) {
  const label = property.slug ?? property.id;
  console.log(`\n🎬 ${property.title} (${label})`);

  if (!property.gallery || property.gallery.length === 0) {
    console.warn('   ⚠️  Sin fotos en la galería — se salta.');
    return;
  }

  const workDir = await mkdtemp(join(tmpdir(), 'cini-video-'));
  try {
    const photos = await downloadPhotos(property, workDir);
    if (photos.length === 0) {
      console.warn('   ⚠️  No se pudo descargar ninguna foto — se salta.');
      return;
    }

    const texts = {
      badge: `${property.neighborhood} · ${TYPE_LABELS[property.type] ?? property.type}`.toUpperCase(),
      address: property.address || property.title,
      price: formatPrice(property),
      specs: specsLine(property),
    };

    const clipPaths = [];
    for (let i = 0; i < photos.length; i++) {
      const clipPath = join(workDir, `clip-${String(i).padStart(2, '0')}.mp4`);
      await buildPhotoClip(photos[i], clipPath, texts, font);
      clipPaths.push(clipPath);
    }

    const outroPath = join(workDir, 'outro.mp4');
    await buildOutroClip(outroPath, font, logo);
    clipPaths.push(outroPath);

    await mkdir(OUT_DIR, { recursive: true });
    const finalPath = join(OUT_DIR, `${label}.mp4`);
    await concatClips(clipPaths, finalPath, workDir);

    const seconds = photos.length * PHOTO_SECONDS + OUTRO_SECONDS;
    console.log(`   ✅ ${finalPath} (${photos.length} fotos, ~${Math.round(seconds)}s)`);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

async function main() {
  await checkFfmpeg();
  if (!existsSync(LOGO_PATH)) {
    console.error(`❌ No se encontró el isologo en ${LOGO_PATH}.`);
    process.exit(1);
  }
  const font = await ensureFont();
  const all = await loadProperties();

  const args = process.argv.slice(2);
  const filtered = args.length
    ? all.filter((p) => args.includes(p.id) || args.includes(p.slug))
    : all;

  if (filtered.length === 0) {
    console.error('No hay propiedades que coincidan con esos ids/slugs.');
    process.exit(1);
  }

  console.log(`Generando ${filtered.length} video(s) en ${OUT_DIR}…`);
  for (const property of filtered) {
    await generateOne(property, font, LOGO_PATH);
  }
  console.log('\n✅ Listo.');
}

main().catch((err) => {
  console.error('❌ Error generando los videos:', err);
  process.exit(1);
});
