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

  /** Línea fija real de la oficina. */
  phone: '+54 11 4706-2034',
  phoneHref: 'tel:+541147062034',
  /** Celular real (formato local 15-6023-7430) → wa.me: país 54 + 9 (móvil AR) + área 11 + número. */
  whatsapp: '5491160237430',
  whatsappMessage:
    'Hola, vengo desde la web de Consultora Internacional y me gustaría recibir información sobre una propiedad.',

  // TODO(01-sep-2026): reemplazar por contacto@cini.com.ar una vez que el
  // cliente confirme que esa casilla existe y está monitoreada — hasta
  // entonces, dejar el placeholder es menos riesgoso que publicar un email
  // real que todavía nadie lee. Ver auditoría: el placeholder .example
  // rompía el mailto: y el canonical/OG a la vez; esto solo arregla lo
  // segundo.
  email: 'hola@consultora-internacional.example',
  /** Dirección real de la oficina (PB = planta baja). */
  address: 'Blanco Encalada 1583, PB, Belgrano, CABA',
  city: 'Buenos Aires',
  schedule: 'Lun a Vie · 9:00 – 18:30',

  /** Dominio canónico real. Sin www — ver redirect 301 en netlify.toml. */
  url: 'https://cini.com.ar',

  /** Centro por defecto del mapa: oficina real en Blanco Encalada 1583, Belgrano (geocodificado). */
  mapCenter: { lat: -34.5543833, lng: -58.4511371 },

  social: {
    instagram: 'https://instagram.com/',
    linkedin: 'https://linkedin.com/',
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
