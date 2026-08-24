import { lazy, Suspense, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';

import { propertiesQueryOptions } from '@/api/properties';
import { PropertyModal } from '@/components/properties/PropertyModal';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Skeleton } from '@/components/ui/Skeleton';
import { useInViewOnce } from '@/hooks/useInViewOnce';
import { fadeUp, VIEWPORT_ONCE } from '@/lib/motion';
import type { Property } from '@/types/property';

/**
 * El SDK de Google Maps pesa varios cientos de kB. Lo cargamos en un chunk
 * aparte y sólo cuando la sección está a punto de entrar en pantalla.
 */
const PropertiesMap = lazy(() => import('@/components/map/PropertiesMap'));

export function MapSection() {
  const { data, isPending } = useQuery(propertiesQueryOptions);
  const { ref, inView } = useInViewOnce<HTMLDivElement>('300px');
  const [selected, setSelected] = useState<Property | null>(null);

  const properties = data ?? [];
  const shouldRenderMap = inView && !isPending;

  return (
    <section id="mapa" className="scroll-mt-24 bg-sand-100 py-24 lg:py-32">
      <Container size="wide">
        <SectionHeading
          eyebrow="Dónde están"
          title="La cartera, sobre el plano"
          description="Tocá cualquier pin para ver el precio, la dirección y abrir la ficha completa. En Buenos Aires la calle importa más que el metro cuadrado."
        />

        <motion.div
          ref={ref}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          className="mt-12 overflow-hidden rounded-3xl shadow-lux"
        >
          {/* Alturas fijas → sin CLS cuando el mapa termina de montar */}
          <div className="h-[26rem] w-full sm:h-[32rem] lg:h-[38rem]">
            {shouldRenderMap ? (
              <Suspense fallback={<MapSkeleton />}>
                <PropertiesMap properties={properties} onSelect={setSelected} />
              </Suspense>
            ) : (
              <MapSkeleton />
            )}
          </div>
        </motion.div>

        <p className="mt-5 text-center text-sm text-ink-500">
          {properties.length > 0
            ? `${properties.length} propiedades disponibles en CABA y alrededores`
            : 'Cargando ubicaciones…'}
        </p>
      </Container>

      <PropertyModal property={selected} onClose={() => setSelected(null)} />
    </section>
  );
}

/** Placeholder con la silueta del mapa: se ve antes de descargar el SDK. */
function MapSkeleton() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-sand-200">
      <Skeleton className="size-full rounded-none" />
      <div className="absolute inset-0 grid place-items-center">
        <p className="text-sm text-ink-500">Preparando el mapa…</p>
      </div>
    </div>
  );
}
