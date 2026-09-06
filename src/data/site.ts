/**
 * Configuración de marca.
 *
 * Para rebrandear la one-page completa sólo hace falta editar este archivo:
 * ningún componente hardcodea el nombre, el teléfono ni las URLs.
 */
export const SITE = {
  /** Nombre corto para el header/logo. El nombre legal completo va en `legalName`. */
  name: 'Consultora Internacional',
  legalName: 'Consultora Internacional de Negocios Inmobiliarios',
  /** Baja de marca, tal como figura en el isologo real. */
  tagline: 'Negocios Inmobiliarios y Financieros',
  claim: 'Vendemos casas que no se anuncian en portales.',

  /** Celular real (formato local 15-6023-7430) → wa.me: país 54 + 9 (móvil AR) + área 11 + número. */
  whatsapp: '5491160237430',
  whatsappMessage:
    'Hola, vengo desde la web de Consultora Internacional y me gustaría recibir información sobre una propiedad.',

  email: 'contactos@cini.com.ar',
  /** Contacto directo de Mauro Otranto, además de la casilla institucional. */
  mauroEmail: 'maurootranto@yahoo.com.ar',
  mauroPhone: '+54 11 6023-7430',
  mauroPhoneHref: 'tel:+541160237430',
  city: 'Buenos Aires',
  schedule: 'Lun a Vie · 9:00 – 18:30',

  /** Dominio canónico real. Sin www — ver redirect 301 en vercel.json. */
  url: 'https://cini.com.ar',

  /** Centro por defecto del mapa cuando todavía no hay propiedades cargadas (punto de referencia en CABA, ya no ligado a una oficina real). */
  mapCenter: { lat: -34.5543833, lng: -58.4511371 },

  social: {
    instagram: 'https://instagram.com/cini.propiedades',
  },

  /** 60 años de trayectoria real de Mauro Otranto — año de inicio calculado desde ahí. */
  foundedYear: 1966,

  /**
   * Zonas donde operamos — señal de cobertura en el footer.
   * A propósito amplio (no por barrio): listar barrios puntuales da la
   * impresión de una cobertura más chica de la real.
   */
  coverageAreas: ['Ciudad Autónoma de Buenos Aires'],
} as const;

/** URL de WhatsApp con mensaje pre-cargado. */
export function whatsappUrl(message: string = SITE.whatsappMessage): string {
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(message)}`;
}

/** Enlaces de navegación del header (el `id` debe existir como section id). */
export const NAV_LINKS = [
  { id: 'propiedades', label: 'Propiedades' },
  { id: 'servicios', label: 'Servicios' },
  { id: 'nosotros', label: 'Nosotros' },
  { id: 'opiniones', label: 'Opiniones' },
  { id: 'mapa', label: 'Mapa' },
] as const;
