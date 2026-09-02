/**
 * Contenido editorial de la página: métricas, servicios, equipo y testimonios.
 * Separado de los componentes para que el copy se edite sin tocar JSX.
 */

export interface Stat {
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  label: string;
  detail: string;
}

export const STATS: Stat[] = [
  {
    value: 480,
    suffix: '+',
    label: 'Operaciones cerradas',
    detail: 'Compraventas firmadas desde 1966 en la Ciudad de Buenos Aires.',
  },
  {
    value: 27,
    label: 'Días hasta la primera oferta',
    detail: 'Media de nuestras exclusivas en los últimos 24 meses.',
  },
  {
    value: 98.4,
    suffix: ' %',
    decimals: 1,
    label: 'Del precio de salida',
    detail: 'Precio medio de cierre respecto al precio de publicación.',
  },
  {
    value: 60,
    label: 'Años de recorrido',
    detail: 'La trayectoria comercial de Mauro Otranto, sin franquicias ni intermediarios.',
  },
];

export interface Service {
  icon: 'home' | 'gauge' | 'search' | 'scale';
  title: string;
  description: string;
  bullets: string[];
}

export const SERVICES: Service[] = [
  {
    icon: 'home',
    title: 'Venta en exclusiva',
    description:
      'Preparamos la vivienda, producimos el material y gestionamos el proceso completo hasta la firma de la escritura. Sin carteles ni visitas indiscriminadas.',
    bullets: ['Home staging y reportaje profesional', 'Filtro previo de compradores', 'Informe semanal de actividad'],
  },
  {
    icon: 'gauge',
    title: 'Tasación certificada',
    description:
      'Un informe con comparables reales de los últimos 12 meses, no una estimación automática. Lo recibís en 48 horas y es gratuito.',
    bullets: ['Comparables cerrados, no publicados', 'Análisis de absorción por barrio', 'Rango de precio realista en USD'],
  },
  {
    icon: 'search',
    title: 'Búsqueda personalizada',
    description:
      'Trabajamos del lado del comprador: rastreamos cartera off-market, negociamos por vos y coordinamos la due diligence técnica.',
    bullets: ['Acceso a producto no publicado', 'Negociación en tu nombre', 'Revisión técnica y de dominio'],
  },
  {
    icon: 'scale',
    title: 'Acompañamiento legal e impositivo',
    description:
      'Boleto de compraventa, certificado de inhibición, impuesto de sellos y estructura de la operación revisados junto a la escribanía interviniente.',
    bullets: ['Informe de dominio e inhibiciones', 'Optimización impositiva (Ganancias/ITI)', 'Coordinación con la escribanía'],
  },
];

export interface TeamMember {
  name: string;
  role: string;
  bio: string;
  /** Sin foto real todavía → About.tsx muestra un placeholder con iniciales en vez de stock. */
  image?: string;
  /** Número de matrícula profesional, cuando aplica (ej. CUCICBA). Verificable públicamente. */
  matricula?: string;
}

/**
 * Equipo real. Fotos servidas localmente desde public/team/ — la de Vanina Cesari se
 * bajó de cgestudioasociados.com.ar/img/Vanina.jpg (misma persona, socia también de
 * CG Estudio Asociados) y se copió acá para no depender de que ese sitio, un proyecto
 * distinto, mantenga ese archivo en esa URL para siempre.
 */
export const TEAM: TeamMember[] = [
  {
    name: 'Mauro Otranto',
    role: 'Corredor Inmobiliario',
    bio: 'Más de 60 años de experiencia en el mercado. Su profundo conocimiento asegura que tu propiedad sea tasada y negociada con el mayor rigor y profesionalismo.',
    image: '/team/mauro-otranto.jpg',
    matricula: 'CUCICBA Mat. 5846',
  },
  {
    name: 'Dra. Vanina Marisel Cesari',
    role: 'Asesoría Legal',
    bio: 'Abogada. Su gestión jurídica blinda cada operación. Desde la revisión de los primeros títulos hasta la firma final, tenés el respaldo legal necesario para operar con total confianza.',
    image: '/team/vanina-cesari.jpg',
    matricula: 'CPACF T° 136 — F° 708',
  },
];

export interface Testimonial {
  quote: string;
  name: string;
  context: string;
  rating: number;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'Habíamos tenido el departamento doce meses con otra inmobiliaria sin una sola oferta seria. Consultora Internacional lo replanteó entero, lo sacó de nuevo y en cinco semanas estábamos firmando el boleto por encima de lo que esperábamos.',
    name: 'Beatriz L.',
    context: 'Venta de departamento · Belgrano',
    rating: 5,
  },
  {
    quote:
      'Volvíamos a Buenos Aires después de diez años en Miami, sin conocer bien los barrios de nuevo. Clara nos mostró ocho casas en dos días, todas con sentido, y ninguna estaba publicada. Ese nivel de filtro vale cada dólar de honorarios.',
    name: 'Andreas M.',
    context: 'Compra de casa · San Isidro',
    rating: 5,
  },
  {
    quote:
      'Lo que más valoro es que me dijeron desde el primer día que mi precio era un 12 % alto y por qué. Preferí escucharlos. Vendí en siete semanas al precio que ellos habían calculado.',
    name: 'Javier R.',
    context: 'Venta de penthouse · Palermo Chico',
    rating: 5,
  },
  {
    quote:
      'Una herencia con tres hermanos y opiniones distintas. Valentina manejó la parte humana tan bien como la técnica, y coordinó escribanía, impuestos y reparto sin que tuviéramos que discutir una sola vez.',
    name: 'Familia Sáez',
    context: 'Venta por sucesión · Recoleta',
    rating: 5,
  },
];
