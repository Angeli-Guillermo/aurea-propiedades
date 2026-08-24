/**
 * Configuración compartida entre `PropertiesMap` (mapa general) y
 * `PropertyLocationMap` (mini-mapa dentro de la ficha de una propiedad).
 *
 * El `id` de `useJsApiLoader` es lo importante acá: al ser el mismo string
 * en ambos componentes, el SDK de Google se carga una sola vez aunque el
 * usuario abra el mini-mapa antes de llegar a la sección de mapa general.
 */
export const GOOGLE_MAPS_LOADER_ID = 'aurea-google-maps';

export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';
export const GOOGLE_MAPS_MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;

/** Pin de gota, más estilizado que el marcador por defecto de Google. */
export const MAP_PIN_PATH =
  'M12 0C5.373 0 0 5.373 0 12c0 8.4 10.05 22.2 11.13 23.64a1.08 1.08 0 0 0 1.74 0C13.95 34.2 24 20.4 24 12 24 5.373 18.627 0 12 0Z';

export const MAP_COLORS = {
  ink: '#0F1C2E',
  gold: '#B08D57',
  sand: '#FBFAF7',
} as const;
