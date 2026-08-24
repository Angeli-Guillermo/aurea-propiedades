import { queryOptions } from '@tanstack/react-query';
import { z } from 'zod';

import { MOCK_PROPERTIES } from '@/data/properties.mock';
import { propertySchema, type Property } from '@/types/property';

/**
 * Cliente de la API de propiedades.
 *
 * ─── Cómo conectar una API real ───────────────────────────────────────────
 * 1. Definí `VITE_PROPERTIES_API_URL` en `.env.local`.
 * 2. Si tu endpoint no es `GET {BASE}/properties`, cambiá `PROPERTIES_ENDPOINT`.
 * 3. Si el JSON no coincide con `propertySchema`, adaptá `normalize()`.
 * Nada más: el resto de la app consume siempre `Property[]`.
 * ──────────────────────────────────────────────────────────────────────────
 */

const API_BASE = import.meta.env.VITE_PROPERTIES_API_URL?.replace(/\/$/, '');
const PROPERTIES_ENDPOINT = '/properties';

/** Latencia simulada del mock para que se vean los skeleton loaders. */
const MOCK_LATENCY_MS = 650;

/** Error de dominio con contexto suficiente para mostrarlo en la UI. */
export class PropertiesApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number, options?: ErrorOptions) {
    super(message, options);
    this.name = 'PropertiesApiError';
    this.status = status;
  }
}

/**
 * Envelope tolerante: acepta tanto `[...]` como `{ data: [...] }`
 * o `{ results: [...] }`, que son los tres formatos más habituales.
 */
const responseSchema = z.union([
  z.array(z.unknown()),
  z.object({ data: z.array(z.unknown()) }),
  z.object({ results: z.array(z.unknown()) }),
]);

function extractItems(payload: unknown): unknown[] {
  const parsed = responseSchema.safeParse(payload);
  if (!parsed.success) {
    throw new PropertiesApiError(
      'La respuesta de la API no tiene el formato esperado (array de propiedades).',
    );
  }
  const value = parsed.data;
  if (Array.isArray(value)) return value;
  return 'data' in value ? value.data : value.results;
}

/**
 * Punto único de adaptación entre el JSON de tu backend y el modelo interno.
 *
 * Ejemplo si tu API usa otros nombres de campo:
 *   const raw = item as Record<string, unknown>;
 *   return propertySchema.parse({
 *     ...raw,
 *     area: raw.built_area,
 *     bedrooms: raw.rooms,
 *     lat: (raw.location as { lat: number }).lat,
 *   });
 */
function normalize(item: unknown): Property {
  return propertySchema.parse(item);
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Descarga (o simula) el listado completo de propiedades. */
export async function getProperties(signal?: AbortSignal): Promise<Property[]> {
  // Modo demo: sin API configurada devolvemos el dataset local.
  if (!API_BASE) {
    await sleep(MOCK_LATENCY_MS);
    return MOCK_PROPERTIES;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${PROPERTIES_ENDPOINT}`, {
      signal,
      headers: { Accept: 'application/json' },
    });
  } catch (cause) {
    // Aborto legítimo de TanStack Query: se propaga tal cual.
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause;
    // Errores de red / CORS / DNS: no hay `status`.
    throw new PropertiesApiError(
      'No hemos podido conectar con el servidor de propiedades.',
      undefined,
      { cause },
    );
  }

  if (!response.ok) {
    throw new PropertiesApiError(
      `El servidor respondió con un error (${response.status}).`,
      response.status,
    );
  }

  const payload: unknown = await response.json();
  return extractItems(payload).map(normalize);
}

/** Query key raíz — útil para invalidaciones desde otros módulos. */
export const propertiesQueryKey = ['properties'] as const;

/**
 * Opciones reutilizables de TanStack Query.
 * Las consumen tanto "Propiedades destacadas" como la sección de mapa,
 * de modo que ambas comparten una única petición y una única caché.
 */
export const propertiesQueryOptions = queryOptions({
  queryKey: propertiesQueryKey,
  queryFn: ({ signal }) => getProperties(signal),
  staleTime: 5 * 60 * 1000,
});
