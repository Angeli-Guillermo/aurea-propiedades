import { lazy, Suspense } from 'react';
import { motion } from 'motion/react';
import { Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';

import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Skeleton } from '@/components/ui/Skeleton';
import { SITE, whatsappUrl } from '@/data/site';
import { fadeSide, staggerContainer, staggerItem, VIEWPORT_ONCE } from '@/lib/motion';

/**
 * React Hook Form y el resolver de Zod sólo hacen falta al llegar al
 * formulario, que está al final de la página: los diferimos a un chunk aparte.
 */
const ValuationForm = lazy(() =>
  import('@/components/forms/ValuationForm').then((module) => ({
    default: module.ValuationForm,
  })),
);

const CONTACT_ITEMS = [
  { icon: Phone, label: 'Teléfono', value: SITE.phone, href: SITE.phoneHref },
  { icon: Mail, label: 'Email', value: SITE.email, href: `mailto:${SITE.email}` },
  { icon: MapPin, label: 'Oficina', value: SITE.address },
  { icon: Clock, label: 'Horario', value: SITE.schedule },
] as const;

export function ContactSection() {
  return (
    <section id="contacto" className="scroll-mt-24 bg-sand-50 py-24 lg:py-32">
      <Container size="wide">
        <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          {/* Columna editorial */}
          <motion.div
            variants={fadeSide('left')}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE}
          >
            <SectionHeading
              eyebrow="Valoración gratuita"
              title={
                <>
                  Sabé cuánto vale
                  <br className="hidden sm:block" /> tu casa de verdad
                </>
              }
              description="Un informe con comparables reales de tu portal, tu calle y tu tipología. Sin compromiso y sin que tengas que firmar nada para recibirlo."
            />

            <motion.ul
              variants={staggerContainer(0.08)}
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT_ONCE}
              className="mt-11 space-y-6"
            >
              {CONTACT_ITEMS.map((item) => {
                const Icon = item.icon;
                const content = (
                  <>
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-ink-900/[0.05] text-ink-700 transition-colors duration-300 group-hover:bg-gold-100 group-hover:text-gold-700">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <span>
                      <span className="block text-[0.6875rem] uppercase tracking-[0.18em] text-ink-400">
                        {item.label}
                      </span>
                      <span className="mt-0.5 block text-[0.9375rem] text-ink-900">
                        {item.value}
                      </span>
                    </span>
                  </>
                );

                return (
                  <motion.li key={item.label} variants={staggerItem}>
                    {'href' in item && item.href ? (
                      <a href={item.href} className="group flex items-center gap-4">
                        {content}
                      </a>
                    ) : (
                      <div className="group flex items-center gap-4">{content}</div>
                    )}
                  </motion.li>
                );
              })}
            </motion.ul>

            {/* Atajo para quien no quiere rellenar formularios */}
            <motion.a
              variants={staggerItem}
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT_ONCE}
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-11 flex items-center gap-4 rounded-2xl border border-ink-900/10 bg-white p-5 transition-colors duration-300 hover:border-gold-400/60"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#25D366]/12 text-[#128C4A]">
                <MessageCircle className="size-5" aria-hidden />
              </span>
              <span>
                <span className="block text-[0.9375rem] font-medium text-ink-900">
                  ¿Preferís escribir?
                </span>
                <span className="mt-0.5 block text-sm text-ink-500">
                  Contestamos por WhatsApp en horario de oficina.
                </span>
              </span>
            </motion.a>
          </motion.div>

          {/* Formulario */}
          <motion.div
            variants={fadeSide('right')}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE}
          >
            <Suspense fallback={<FormSkeleton />}>
              <ValuationForm />
            </Suspense>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}

/** Silueta del formulario mientras se descarga su chunk. */
function FormSkeleton() {
  return (
    <div className="rounded-2xl border border-ink-900/10 bg-white p-6 shadow-soft sm:p-9">
      <Skeleton className="h-3 w-32" />
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-12 rounded-xl" />
      </div>
      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index}>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-2 h-12 rounded-xl" />
          </div>
        ))}
      </div>
      <Skeleton className="mt-5 h-28 rounded-xl" />
      <Skeleton className="mt-7 h-13 w-64 rounded-full" />
    </div>
  );
}
