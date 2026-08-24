/**
 * Envío a Netlify Forms.
 *
 * Sin backend propio, Netlify puede recibir formularios enviados desde el
 * cliente vía POST a "/" con `Content-Type: application/x-www-form-urlencoded`
 * y `form-name` en el body — siempre que el formulario esté declarado también
 * de forma estática en `index.html` (Netlify lo detecta ahí en el build, no
 * en lo que React renderiza). Las respuestas quedan en el panel de Netlify
 * (Forms) y pueden configurarse notificaciones por email desde ahí, sin tocar
 * código.
 */

function encodeFormData(fields: Record<string, string>): string {
  return Object.entries(fields)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

export async function submitToNetlifyForms(
  formName: string,
  fields: Record<string, string>,
): Promise<Response> {
  return fetch('/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    // El honeypot va siempre vacío: si un bot lo completa, Netlify descarta
    // el envío como spam antes de que llegue a la bandeja.
    body: encodeFormData({ 'form-name': formName, 'bot-field': '', ...fields }),
  });
}
