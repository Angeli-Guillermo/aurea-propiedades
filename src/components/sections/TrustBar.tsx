import { motion } from 'motion/react';

import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { Container } from '@/components/ui/Container';
import { STATS } from '@/data/content';
import { staggerContainer, staggerItem, VIEWPORT_ONCE } from '@/lib/motion';

/** Barra de confianza con contadores animados al entrar en viewport. */
export function TrustBar() {
  return (
    <section aria-label="Cifras clave" className="border-b border-ink-900/8 bg-sand-50">
      <Container size="wide" className="py-16 lg:py-20">
        <motion.dl
          variants={staggerContainer(0.1)}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          className="grid grid-cols-2 gap-x-8 gap-y-12 lg:grid-cols-4"
        >
          {/* Lighthouse (02-sep-2026): un <dl> solo admite <dt>/<dd> (y
              script/template) como hijos directos de cada <div> — el <p> de
              detalle y el <span> decorativos rompían esa regla al ser
              hermanos sueltos de dt/dd. Se resuelve tratando el número como
              el término (dt) y el resto — label + detalle + línea — como su
              definición (dd), que sí acepta cualquier contenido de flujo.
              El orden visual (número, label, detalle, línea) queda igual
              porque es también el orden real del DOM. */}
          {STATS.map((stat) => (
            <motion.div key={stat.label} variants={staggerItem} className="relative">
              <dt className="font-display text-5xl font-light tracking-tight text-ink-900 lg:text-6xl">
                <AnimatedCounter
                  value={stat.value}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                  decimals={stat.decimals}
                />
              </dt>
              <dd>
                <p className="mt-3 text-sm font-medium text-ink-800">{stat.label}</p>
                <p className="mt-1.5 max-w-56 text-[0.8125rem] leading-relaxed text-ink-500">
                  {stat.detail}
                </p>
                <span aria-hidden className="mt-5 block h-px w-10 bg-gold-500/50" />
              </dd>
            </motion.div>
          ))}
        </motion.dl>
      </Container>
    </section>
  );
}
