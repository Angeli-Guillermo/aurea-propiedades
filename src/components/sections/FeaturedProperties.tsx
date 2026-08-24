import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { RefreshCw, SearchX, TriangleAlert } from 'lucide-react';

import { propertiesQueryOptions } from '@/api/properties';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { PropertyFilters } from '@/components/properties/PropertyFilters';
import { PropertyGridSkeleton } from '@/components/properties/PropertyCardSkeleton';
import { PropertyModal } from '@/components/properties/PropertyModal';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { staggerContainer, VIEWPORT_ONCE } from '@/lib/motion';
import {
  applyPropertyFilters,
  DEFAULT_FILTERS,
  getNeighborhoods,
  type Property,
  type PropertyFilters as Filters,
} from '@/types/property';

/**
 * Cartera destacada.
 *
 * Comparte la query `['properties']` con la sección de mapa: TanStack Query
 * deduplica la petición y ambas secciones leen de la misma caché.
 */
export function FeaturedProperties() {
  const { data, isPending, isError, error, refetch, isFetching } = useQuery(
    propertiesQueryOptions,
  );

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [selected, setSelected] = useState<Property | null>(null);

  const properties = useMemo(() => data ?? [], [data]);
  const neighborhoods = useMemo(() => getNeighborhoods(properties), [properties]);
  const visible = useMemo(
    () => applyPropertyFilters(properties, filters),
    [properties, filters],
  );

  return (
    <section id="propiedades" className="scroll-mt-24 bg-sand-50 py-24 lg:py-32">
      <Container size="wide">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Cartera actual"
            title={
              <>
                Propiedades seleccionadas
                <br className="hidden sm:block" /> una por una
              </>
            }
            description="Cada vivienda pasa por una revisión técnica, registral y de precio antes de entrar en esta lista. Si no la recomendaríamos a un familiar, no la publicamos."
          />
        </div>

        {/* Filtros */}
        <div className="mt-12">
          <PropertyFilters
            filters={filters}
            neighborhoods={neighborhoods}
            onChange={setFilters}
            resultCount={visible.length}
            disabled={isPending}
          />
        </div>

        {/* Estados: carga → error → vacío → grid */}
        <div className="mt-10">
          {isPending ? (
            <PropertyGridSkeleton count={6} />
          ) : isError ? (
            <ErrorState message={error.message} onRetry={() => void refetch()} busy={isFetching} />
          ) : visible.length === 0 ? (
            <EmptyState onReset={() => setFilters(DEFAULT_FILTERS)} />
          ) : (
            <motion.div
              key={`${filters.type}-${filters.neighborhood}`}
              variants={staggerContainer(0.07)}
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT_ONCE}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {visible.map((property, index) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onSelect={setSelected}
                  priority={index < 3}
                />
              ))}
            </motion.div>
          )}
        </div>
      </Container>

      <PropertyModal property={selected} onClose={() => setSelected(null)} />
    </section>
  );
}

/** Fallo de red o de la API: mensaje claro y reintento explícito. */
function ErrorState({
  message,
  onRetry,
  busy,
}: {
  message: string;
  onRetry: () => void;
  busy: boolean;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-ink-900/10 bg-white px-6 py-20 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-red-50 text-red-500">
        <TriangleAlert className="size-5" aria-hidden />
      </span>
      <p className="mt-5 font-display text-xl text-ink-900">No hemos podido cargar la cartera</p>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-600">{message}</p>
      <Button variant="outline" onClick={onRetry} disabled={busy} className="mt-7">
        <RefreshCw className={busy ? 'size-4 animate-spin' : 'size-4'} aria-hidden />
        {busy ? 'Reintentando…' : 'Reintentar'}
      </Button>
    </div>
  );
}

/** Filtros demasiado restrictivos: ofrecemos la salida en un clic. */
function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-ink-900/15 bg-white/60 px-6 py-20 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-ink-900/[0.05] text-ink-400">
        <SearchX className="size-5" aria-hidden />
      </span>
      <p className="mt-5 font-display text-xl text-ink-900">
        No hay nada con esos criterios ahora mismo
      </p>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-600">
        Movemos entre 6 y 10 propiedades al mes. Contanos qué buscás y te avisamos antes de que
        salga publicada.
      </p>
      <Button variant="outline" onClick={onReset} className="mt-7">
        Ver toda la cartera
      </Button>
    </div>
  );
}
