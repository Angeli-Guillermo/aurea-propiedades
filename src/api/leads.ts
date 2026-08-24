import { z } from 'zod';

import { submitToNetlifyForms } from '@/lib/netlifyForms';

/**
 * Formulario de contacto / valoración.
 *
 * El esquema vive junto al cliente HTTP porque describe exactamente
 * el payload que viaja al backend: una sola definición para validar
 * en el formulario y para tipar el POST.
 */

export const LEAD_INTENTS = ['vender', 'valorar', 'comprar'] as const;
export type LeadIntent = (typeof LEAD_INTENTS)[number];

export const LEAD_INTENT_LABELS: Record<LeadIntent, string> = {
  vender: 'Quiero vender',
  valorar: 'Quiero una tasación',
  comprar: 'Busco comprar',
};

/** Acepta formatos internacionales y españoles con espacios o guiones. */
const PHONE_PATTERN = /^[+]?[\d][\d\s().-]{7,18}$/;

export const leadSchema = z.object({
  name: z.string().trim().min(2, 'Necesitamos tu nombre para poder llamarte.'),
  email: z.email('Revisá el email: no parece una dirección válida.'),
  phone: z
    .string()
    .trim()
    .regex(PHONE_PATTERN, 'Introducí un teléfono válido (mínimo 9 dígitos).'),
  intent: z.enum(LEAD_INTENTS, { message: 'Elegí qué querés hacer.' }),
  location: z.string().trim().min(3, 'Indicanos la zona, la calle o el barrio.'),
  message: z.string().trim().max(600, 'El mensaje no puede superar los 600 caracteres.').optional(),
  // `boolean().refine(...)` en vez de `literal(true)`: así el tipo de entrada
  // sigue siendo `boolean` y el checkbox puede arrancar desmarcado.
  consent: z.boolean().refine((accepted) => accepted, {
    message: 'Necesitamos tu consentimiento para poder contactarte.',
  }),
});

/** Lo que el formulario maneja mientras se rellena (campos opcionales vacíos). */
export type LeadFormInput = z.input<typeof leadSchema>;
/** Lo que sale ya validado del resolver y viaja al backend. */
export type LeadPayload = z.output<typeof leadSchema>;

const LEADS_URL = import.meta.env.VITE_LEADS_API_URL;

export class LeadSubmitError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'LeadSubmitError';
  }
}

/**
 * Envía el lead.
 *
 * Con `VITE_LEADS_API_URL` configurada, postea JSON a ese backend propio.
 * Sin ella (caso por defecto), usa Netlify Forms — no hace falta backend:
 * las respuestas quedan en el panel de Netlify (Forms) y desde ahí se pueden
 * configurar notificaciones por email sin tocar código. Requiere el
 * formulario espejo declarado en `index.html`.
 */
export async function submitLead(payload: LeadPayload): Promise<void> {
  let response: Response;
  try {
    response = LEADS_URL
      ? await fetch(LEADS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ ...payload, source: 'landing', submittedAt: new Date().toISOString() }),
        })
      : await submitToNetlifyForms('contacto', {
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          intent: payload.intent,
          location: payload.location,
          message: payload.message ?? '',
          consent: String(payload.consent),
        });
  } catch (cause) {
    throw new LeadSubmitError(
      'No hemos podido conectar con el servidor. Probá de nuevo o escribinos por WhatsApp.',
      { cause },
    );
  }

  if (!response.ok) {
    throw new LeadSubmitError(
      `No hemos podido registrar tu solicitud (error ${response.status}). Volvé a intentarlo en unos minutos.`,
    );
  }
}
