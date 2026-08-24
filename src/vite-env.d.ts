/// <reference types="vite/client" />

/** Variables de entorno expuestas al cliente (prefijo VITE_). */
interface ImportMetaEnv {
  /** Google Maps JavaScript API Key. */
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  /** Map ID opcional (estilo gestionado en Google Cloud). */
  readonly VITE_GOOGLE_MAPS_MAP_ID?: string;
  /** Base URL de la API real de propiedades. */
  readonly VITE_PROPERTIES_API_URL?: string;
  /** Endpoint que recibe los leads del formulario. */
  readonly VITE_LEADS_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
