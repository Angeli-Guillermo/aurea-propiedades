import { z } from 'zod';

/**
 * Fuente única de verdad del dominio "propiedad".
 *
 * El esquema de Zod se usa para (a) derivar el tipo de TypeScript y
 * (b) validar la respuesta de la API real en el borde del sistema.
 * Si tu API devuelve otro shape, no toques esto: adaptá en `src/api/properties.ts`.
 */

export const PROPERTY_TYPES = [
  'piso',
  'ph',
  'atico',
  'duplex',
  'casa',
  'terreno',
  'oficina',
  'local',
  'cochera',
] as const;

/** Etiquetas legibles para la UI (filtros, badges, modal). Vocabulario argentino. */
export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  piso: 'Departamento',
  ph: 'PH',
  atico: 'Penthouse',
  duplex: 'Dúplex',
  casa: 'Casa',
  terreno: 'Terreno',
  oficina: 'Oficina',
  local: 'Local comercial',
  cochera: 'Cochera',
};

export const propertyTypeSchema = z.enum(PROPERTY_TYPES);
export type PropertyType = z.infer<typeof propertyTypeSchema>;

export const propertyStatusSchema = z.enum(['venta', 'alquiler']);
export type PropertyStatus = z.infer<typeof propertyStatusSchema>;

export const propertySchema = z.object({
  id: z.string().min(1),
  /** Identificador legible, útil para deep-links (#propiedad/atico-serrano). */
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().default(''),

  /** Precio en unidades enteras de la moneda (sin céntimos). */
  price: z.number().nonnegative(),
  currency: z.string().default('USD'),
  status: propertyStatusSchema.default('venta'),
  type: propertyTypeSchema,

  /** Barrio o municipio — se usa como filtro de zona. */
  neighborhood: z.string().min(1),
  city: z.string().default('CABA'),
  address: z.string().min(1),

  bedrooms: z.number().int().nonnegative(),
  bathrooms: z.number().int().nonnegative(),
  /**
   * Convención argentina: total de ambientes (dormitorios + living/comedor).
   * Opcional porque no aplica a todos los tipos (cochera, local, terreno sin construir).
   */
  rooms: z.number().int().positive().optional(),
  /** Superficie construida (cubierta) en m². */
  area: z.number().positive(),
  /** Superficie total del lote/unidad en m² — sólo cuando difiere de la cubierta. */
  areaTotal: z.number().positive().optional(),
  parking: z.number().int().nonnegative().default(0),
  year: z.number().int().optional(),
  /** Expensas mensuales en ARS (sólo si el aviso las declara). */
  expenses: z.number().nonnegative().optional(),

  featured: z.boolean().default(false),

  /** Imagen principal (card + hero del modal). */
  image: z.url(),
  gallery: z.array(z.url()).default([]),
  features: z.array(z.string()).default([]),

  /** Coordenadas para el marker de Google Maps. */
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export type Property = z.infer<typeof propertySchema>;

/** Filtros aplicados en cliente sobre el listado de propiedades. */
export interface PropertyFilters {
  type: PropertyType | 'all';
  neighborhood: string | 'all';
}

export const DEFAULT_FILTERS: PropertyFilters = {
  type: 'all',
  neighborhood: 'all',
};

/** Aplica los filtros de la UI. Puro: no muta el array de entrada. */
export function applyPropertyFilters(
  properties: readonly Property[],
  filters: PropertyFilters,
): Property[] {
  return properties.filter((property) => {
    const matchesType = filters.type === 'all' || property.type === filters.type;
    const matchesZone =
      filters.neighborhood === 'all' || property.neighborhood === filters.neighborhood;
    return matchesType && matchesZone;
  });
}

/** Zonas únicas presentes en el dataset, ordenadas alfabéticamente. */
export function getNeighborhoods(properties: readonly Property[]): string[] {
  return [...new Set(properties.map((p) => p.neighborhood))].sort((a, b) =>
    a.localeCompare(b, 'es'),
  );
}
