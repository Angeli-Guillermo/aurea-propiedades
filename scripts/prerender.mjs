#!/usr/bin/env node
/**
 * Pre-render de la home: renderiza la app con React en el servidor y deja el
 * HTML resultante adentro de `<div id="root">` en `dist/index.html`.
 *
 * Por qué: la home es una SPA, así que el HTML que recibe un buscador (o un
 * buscador de IA, que muchas veces no ejecuta JavaScript) traía 32 palabras y
 * el texto recién aparecía cuando cargaba el bundle (LCP ~3 s por demora de
 * render). Con esto el contenido viene en el HTML; al cargar el JS, React lo
 * "hidrata" (main.tsx) sin repintar.
 *
 * Se corre después de `vite build` (ver el script `build` de package.json).
 * No necesita navegador: usa el modo SSR de Vite, así que funciona igual en
 * Vercel.
 *
 * Uso:
 *   node scripts/prerender.mjs          # escribe dist/index.html
 *   node scripts/prerender.mjs --dry    # solo muestra estadísticas, no escribe
 *
 * Si el render falla, el script sale con error: es preferible que el build
 * falle a que se publique una home sin pre-render sin que nadie se entere.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createServer } from 'vite';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distHtml = resolve(root, 'dist/index.html');
const isDry = process.argv.includes('--dry');

const ROOT_PLACEHOLDER = '<div id="root"></div>';

function visibleText(html) {
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const vite = await createServer({
  root,
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
});

try {
  const { render } = await vite.ssrLoadModule('/src/entry-server.tsx');
  const appHtml = await render();

  const words = visibleText(appHtml).split(' ').length;
  const h1 = (appHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) ?? [])[1];
  console.log(`Pre-render: ${Math.round(appHtml.length / 1024)} KB de HTML, ${words} palabras visibles.`);
  console.log(`  H1: ${h1 ? visibleText(h1) : 'NO ENCONTRADO'}`);

  if (!h1 || words < 150) {
    throw new Error('El render no produjo el contenido esperado (sin H1 o con menos de 150 palabras).');
  }
  if (isDry) process.exit(0);

  const template = await readFile(distHtml, 'utf8');
  if (!template.includes(ROOT_PLACEHOLDER)) {
    throw new Error(`No se encontró ${ROOT_PLACEHOLDER} en dist/index.html (¿ya estaba pre-renderizado?).`);
  }
  await writeFile(distHtml, template.replace(ROOT_PLACEHOLDER, `<div id="root">${appHtml}</div>`), 'utf8');
  console.log('  dist/index.html actualizado.');
} catch (err) {
  console.error('Pre-render falló:', err.message);
  process.exitCode = 1;
} finally {
  await vite.close();
}
