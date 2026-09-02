import { motion } from 'motion/react';
import { ArrowUpRight, Bath, BedDouble, LayoutGrid, Maximize } from 'lucide-react';

import { LazyImage } from '@/components/ui/LazyImage';
import { cn } from '@/lib/cn';
import { cleanScrapedDescription, formatArea, formatPrice } from '@/lib/format';
import { cardHover, staggerItem } from '@/lib/motion';
import { PROPERTY_TYPE_LABELS, type Property } from '@/types/property';

interface PropertyCardProps {
  property: Property;
  onSelect: (property: Property) => void;
  /** La primera fila carga con prioridad para mejorar el LCP de la sección. */
  priority?: boolean;
}

export function PropertyCard({ property, onSelect, priority = false }: PropertyCardProps) {
  return (
    // El artículo sólo participa del stagger del grid; el hover vive en el
    // botón interior para no interrumpir la propagación de variants del padre.
    <motion.article variants={staggerItem} className="group h-full">
      <motion.button
        type="button"
        variants={cardHover}
        initial="rest"
        whileHover="hover"
        onClick={() => onSelect(property)}
        aria-label={`Ver detalle de ${property.title}`}
        className={cn(
          'flex h-full w-full flex-col overflow-hidden rounded-2xl bg-white text-left',
          'shadow-soft transition-shadow duration-500 ease-out-expo hover:shadow-lux',
        )}
      >
        {/* Media */}
        <div className="relative overflow-hidden">
          <LazyImage
            src={property.image}
            alt={`${property.title}, ${property.neighborhood}`}
            width={1200}
            height={900}
            priority={priority}
            wrapperClassName="aspect-[4/3]"
            className="transition-transform duration-[900ms] ease-out-expo group-hover:scale-[1.06]"
          />

          {/* Degradado inferior para asentar el precio */}
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-ink-950/75 to-transparent"
          />

          <span className="absolute left-4 top-4 rounded-full bg-sand-50/92 px-3 py-1 text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-ink-800 backdrop-blur-sm">
            {PROPERTY_TYPE_LABELS[property.type]}
          </span>

          <p className="absolute bottom-4 left-4 font-display text-2xl font-normal text-sand-50">
            {formatPrice(property.price, property.currency)}
            {property.status === 'alquiler' ? <span className="text-base">/mes</span> : null}
          </p>

          <span
            aria-hidden
            className="absolute bottom-4 right-4 grid size-9 place-items-center rounded-full bg-sand-50/92 text-ink-900 opacity-0 transition-all duration-500 ease-out-expo group-hover:opacity-100"
          >
            <ArrowUpRight className="size-4" />
          </span>
        </div>

        {/* Contenido */}
        <div className="flex flex-1 flex-col p-6">
          <p className="text-[0.6875rem] uppercase tracking-[0.2em] text-gold-600">
            {property.neighborhood}
          </p>

          <h3 className="mt-2 font-display text-xl font-normal leading-snug text-ink-900 text-balance">
            {property.title}
          </h3>

          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-600/80">
            {cleanScrapedDescription(property.description)}
          </p>

          <dl className="mt-auto flex flex-wrap items-center gap-4 pt-6 text-sm text-ink-700">
            {/* Ambientes, dormitorios y baños no aplican a cochera/terreno/local sin uso —
                se ocultan en vez de mostrar un "0" o un valor inventado. */}
            {property.rooms ? (
              <div className="flex items-center gap-2">
                <LayoutGrid className="size-4 text-ink-400" aria-hidden />
                <dt className="sr-only">Ambientes</dt>
                <dd>{property.rooms} amb.</dd>
              </div>
            ) : null}
            {property.bedrooms > 0 ? (
              <div className="flex items-center gap-2">
                <BedDouble className="size-4 text-ink-400" aria-hidden />
                <dt className="sr-only">Dormitorios</dt>
                <dd>{property.bedrooms}</dd>
              </div>
            ) : null}
            {property.bathrooms > 0 ? (
              <div className="flex items-center gap-2">
                <Bath className="size-4 text-ink-400" aria-hidden />
                <dt className="sr-only">Baños</dt>
                <dd>{property.bathrooms}</dd>
              </div>
            ) : null}
            <div className="flex items-center gap-2">
              <Maximize className="size-4 text-ink-400" aria-hidden />
              <dt className="sr-only">Superficie</dt>
              <dd>{formatArea(property.area)}</dd>
            </div>
          </dl>
        </div>
      </motion.button>
    </motion.article>
  );
}
