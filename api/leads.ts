/**
 * Recibe los leads del formulario de tasación (ValuationForm.tsx) y los manda
 * por email vía Resend.
 *
 * Reemplaza a Netlify Forms (lib/netlifyForms.ts): ese mecanismo dependía de
 * que Netlify sirviera el sitio y parseara un <form> estático en index.html —
 * desde la migración a Vercel, el POST a "/" que hacía devolvía 405 siempre,
 * así que el 100% de los envíos fallaban en silencio para el usuario (veía
 * el mensaje de error, pero nadie del lado de CINI se enteraba de que había
 * un lead esperando). Ver auditoría 02-sep-2026.
 *
 * Función serverless "plana" (sin @vercel/node) — Vercel detecta cualquier
 * archivo bajo /api como función Node y parsea el body JSON solo si el
 * Content-Type es application/json, que es lo que manda leads.ts del front.
 */

// Runtime Edge explícito: usa la firma Request/Response estándar de fetch.
// El runtime Node "clásico" de Vercel espera (req, res) al estilo Express, y
// mezclar las dos convenciones es un error común en proyectos que no son
// Next.js (donde Next decide esto por vos).
export const config = { runtime: 'edge' };

interface LeadRequestBody {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  intent?: unknown;
  location?: unknown;
  message?: unknown;
  consent?: unknown;
  source?: unknown;
  submittedAt?: unknown;
}

const INTENT_LABELS: Record<string, string> = {
  vender: 'Quiero vender',
  valorar: 'Quiero una tasación',
  comprar: 'Busco comprar',
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.LEADS_NOTIFY_EMAIL;
  if (!apiKey || !notifyEmail) {
    console.error('[api/leads] Falta RESEND_API_KEY o LEADS_NOTIFY_EMAIL en las env vars de Vercel');
    return new Response(JSON.stringify({ error: 'Servidor no configurado' }), { status: 500 });
  }

  let body: LeadRequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Body inválido' }), { status: 400 });
  }

  const name = asString(body.name);
  const email = asString(body.email);
  const phone = asString(body.phone);
  const intentRaw = asString(body.intent);
  const location = asString(body.location);
  const message = asString(body.message);
  const isNewsletter = intentRaw === 'newsletter';

  // Validación mínima defensiva: el formulario real ya valida con Zod/regex
  // del lado del cliente (ValuationForm o NewsletterSignup), esto es solo
  // para no mandar un mail vacío si alguien pega un POST directo. El
  // newsletter manda un payload mucho más chico (solo email) que el
  // formulario de tasación — no exigirle los mismos campos.
  if (!email || (!isNewsletter && (!name || !phone || !location))) {
    return new Response(JSON.stringify({ error: 'Faltan campos obligatorios' }), { status: 400 });
  }

  const intentLabel = isNewsletter ? 'Alta newsletter' : (INTENT_LABELS[intentRaw] ?? intentRaw ?? '(no especificado)');

  const html = isNewsletter
    ? `
      <h2>Nueva alta de newsletter — Consultora Internacional</h2>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <hr />
      <p style="color:#888;font-size:12px">Enviado desde cini.com.ar el ${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}</p>
    `
    : `
      <h2>Nuevo lead — Consultora Internacional</h2>
      <p><strong>Intención:</strong> ${escapeHtml(intentLabel)}</p>
      <p><strong>Nombre:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Teléfono:</strong> ${escapeHtml(phone)}</p>
      <p><strong>Zona/dirección:</strong> ${escapeHtml(location)}</p>
      ${message ? `<p><strong>Mensaje:</strong> ${escapeHtml(message)}</p>` : ''}
      <hr />
      <p style="color:#888;font-size:12px">Enviado desde cini.com.ar el ${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}</p>
    `;

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Consultora Internacional <notificaciones@cini.com.ar>',
      to: [notifyEmail],
      reply_to: email,
      subject: isNewsletter ? `Nueva alta de newsletter — ${email}` : `Nuevo lead: ${intentLabel} — ${name}`,
      html,
    }),
  });

  if (!resendRes.ok) {
    const errText = await resendRes.text().catch(() => '');
    console.error('[api/leads] Resend devolvió error:', resendRes.status, errText);
    return new Response(JSON.stringify({ error: 'No se pudo enviar el email' }), { status: 502 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
