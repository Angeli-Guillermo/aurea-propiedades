import { motion } from 'motion/react';

import { cn } from '@/lib/cn';
import { EASE_OUT_QUART } from '@/lib/motion';
import {
  PROPERTY_TYPES,
  PROPERTY_TYPE_LABELS,
  type PropertyFilters as Filters,
  type PropertyType,
} from '@/types/property';

interface PropertyFiltersProps {
  filters: Filters;
  neighborhoods: readonly string[];
  onChange: (filters: Filters) => void;
  /** Nº de resultados tras aplicar los filtros (feedback inmediato). */
  resultCount: number;
  disabled?: boolean;
}

function Chip({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      whileHover={disabled ? undefined : { scale: 1.03 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.18, ease: EASE_OUT_QUART }}
      className={cn(
        'shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm transition-colors duration-300',
        'disabled:pointer-events-none disabled:opacity-50',
        active
          ? 'border-ink-900 bg-ink-900 text-sand-50'
          : 'border-ink-900/15 bg-transparent text-ink-700 hover:border-ink-900/35 hover:text-ink-950',
      )}
    >
      {children}
    </motion.button>
  );
}

/**
 * Filtro doble (tipo + zona) resuelto en cliente.
 * En móvil las filas hacen scroll horizontal en lugar de romper el layout.
 */
export function PropertyFilters({
  filters,
  neighborhoods,
  onChange,
  resultCount,
  disabled = false,
}: PropertyFiltersProps) {
  const setType = (type: PropertyType | 'all') => onChange({ ...filters, type });
  const setZone = (neighborhood: string | 'all') => onChange({ ...filters, neighborhood });

  return (
    <div className="flex flex-col gap-5">
      {/* Tipo de propiedad */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        <span className="text-[0.6875rem] uppercase tracking-[0.2em] text-ink-400 sm:w-14">
          Tipo
        </span>
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0">
          <Chip active={filters.type === 'all'} disabled={disabled} onClick={() => setType('all')}>
            Todas
          </Chip>
          {PROPERTY_TYPES.map((type) => (
            <Chip
              key={type}
              active={filters.type === type}
              disabled={disabled}
              onClick={() => setType(type)}
            >
              {PROPERTY_TYPE_LABELS[type]}
            </Chip>
          ))}
        </div>
      </div>

      {/* Zona */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        <span className="text-[0.6875rem] uppercase tracking-[0.2em] text-ink-400 sm:w-14">
          Zona
        </span>
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0">
          <Chip
            active={filters.neighborhood === 'all'}
            disabled={disabled}
            onClick={() => setZone('all')}
          >
            CABA y alrededores
          </Chip>
          {neighborhoods.map((zone) => (
            <Chip
              key={zone}
              active={filters.neighborhood === zone}
              disabled={disabled}
              onClick={() => setZone(zone)}
            >
              {zone}
            </Chip>
          ))}
        </div>
      </div>

      <p aria-live="polite" className="text-sm text-ink-500">
        {disabled
          ? 'Cargando cartera…'
          : `${resultCount} ${resultCount === 1 ? 'propiedad disponible' : 'propiedades disponibles'}`}
      </p>
    </div>
  );
}
