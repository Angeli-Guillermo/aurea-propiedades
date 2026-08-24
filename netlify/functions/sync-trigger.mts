import type { Config } from '@netlify/functions';

/**
 * Cron nativo de Netlify: cada 6hs dispara un rebuild del sitio pegándole
 * a su propio Build Hook. El build (ver netlify.toml) corre
 * `scripts/sync-properties.mjs` antes de compilar, así que cada rebuild
 * trae la cartera actualizada desde Zonaprop.
 *
 * Requiere la env var `NETLIFY_BUILD_HOOK_URL` seteada en el dashboard
 * del sitio (Site configuration → Environment variables) con la URL del
 * Build Hook (Site configuration → Build & deploy → Build hooks).
 */
export default async () => {
  const hookUrl = process.env.NETLIFY_BUILD_HOOK_URL;

  if (!hookUrl) {
    console.error(
      'NETLIFY_BUILD_HOOK_URL no está seteada — no se puede disparar el sync.',
    );
    return;
  }

  const response = await fetch(hookUrl, { method: 'POST' });

  if (!response.ok) {
    console.error(`Build hook respondió ${response.status} — rebuild no disparado.`);
    return;
  }

  console.log('Rebuild disparado correctamente vía build hook.');
};

export const config: Config = {
  schedule: '0 */6 * * *',
};
