import { motion } from 'motion/react';
import { Check, Gauge, Home, Scale, Search, type LucideIcon } from 'lucide-react';

import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { SERVICES, type Service } from '@/data/content';
import { staggerContainer, staggerItem, VIEWPORT_ONCE } from '@/lib/motion';

const ICONS: Record<Service['icon'], LucideIcon> = {
  home: Home,
  gauge: Gauge,
  search: Search,
  scale: Scale,
};

/**
 * Servicios en composición bento: la primera tarjeta ocupa el doble de ancho
 * para romper la retícula uniforme y crear jerarquía real.
 */
export function Services() {
  return (
    <section id="servicios" className="scroll-mt-24 bg-ink-950 py-24 text-sand-100 lg:py-32">
      <Container size="wide">
        <SectionHeading
          eyebrow="Qué hacemos"
          tone="light"
          title={
            <>
              Cuatro formas de trabajar
              <br className="hidden sm:block" /> juntos
            </>
          }
          description="No cobramos por publicar anuncios. Cobramos por cerrar operaciones bien, y eso empieza mucho antes de la primera visita."
        />

        <motion.div
          variants={staggerContainer(0.09)}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3"
        >
          {SERVICES.map((service, index) => {
            const Icon = ICONS[service.icon];
            const isFeatured = index === 0;

            return (
              <motion.article
                key={service.title}
                variants={staggerItem}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.4 }}
                className={[
                  'edge-gold group relative flex flex-col rounded-2xl border border-sand-50/10 p-8 transition-colors duration-500',
                  'hover:border-gold-400/35',
                  isFeatured
                    ? 'bg-gradient-to-br from-ink-800 to-ink-900 lg:col-span-2 lg:row-span-1'
                    : 'bg-ink-900/60',
                ].join(' ')}
              >
                <span className="grid size-12 place-items-center rounded-full bg-gold-500/12 text-gold-300 transition-colors duration-500 group-hover:bg-gold-500/22">
                  <Icon className="size-5" aria-hidden />
                </span>

                <h3 className="mt-6 font-display text-2xl font-light text-sand-50">
                  {service.title}
                </h3>

                <p className="mt-3 max-w-md text-sm leading-relaxed text-sand-300/75">
                  {service.description}
                </p>

                <ul className="mt-6 space-y-2.5 border-t border-sand-50/10 pt-6">
                  {service.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-3 text-sm text-sand-200/80">
                      <Check className="mt-0.5 size-4 shrink-0 text-gold-400" aria-hidden />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </motion.article>
            );
          })}
        </motion.div>
      </Container>
    </section>
  );
}
