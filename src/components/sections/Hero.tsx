import { motion } from 'motion/react';
import { ArrowDown } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { SITE } from '@/data/site';
import { EASE_OUT_EXPO, staggerContainer } from '@/lib/motion';
import { scrollToId } from '@/lib/scroll';

/** Entrada del hero: cada bloque sube y aparece con un ligero desfase. */
const heroItem = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE_OUT_EXPO } },
};

export function Hero() {
  return (
    <section
      id="inicio"
      className="grain relative flex min-h-[100svh] items-end overflow-hidden bg-ink-950"
    >
      {/* 02-sep-2026: se sacó la foto de stock (Unsplash) del hero sin
          reemplazo — no hay una foto real disponible todavía (sin oficina
          propia fotografiable). El fondo queda en bg-ink-950 sólido, ya
          declarado en el <section>; las capas de degradado que existían acá
          solo compensaban zonas claras de esa foto y no aportan nada sobre
          un color plano. */}

      <Container size="wide" className="relative z-10 pb-20 pt-36 lg:pb-28">
        <motion.div
          variants={staggerContainer(0.12, 0.25)}
          initial="hidden"
          animate="visible"
          className="max-w-4xl"
        >
          <motion.p
            variants={heroItem}
            className="flex items-center gap-3 text-[0.6875rem] uppercase tracking-[0.28em] text-gold-300"
          >
            <span aria-hidden className="h-px w-10 bg-gold-300/60" />
            {SITE.city} · Desde {SITE.foundedYear}
          </motion.p>

          <motion.h1
            variants={heroItem}
            className="mt-7 text-display font-light text-sand-50 text-balance"
          >
            Hacemos simple el proceso
            <br />
            de <span className="italic text-gold-300">vender o comprar</span>.
          </motion.h1>

          <motion.p
            variants={heroItem}
            className="mt-8 max-w-xl text-lg leading-relaxed text-sand-200/85 text-pretty"
          >
            Te acompañamos en cada paso, desde la tasación hasta la firma de la escritura.
            Trabajamos en toda la Ciudad de Buenos Aires, siempre con el mismo equipo de
            principio a fin.
          </motion.p>

          <motion.div variants={heroItem} className="mt-11 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" variant="gold" onClick={() => scrollToId('propiedades')}>
              Ver propiedades
            </Button>
            <Button
              size="lg"
              variant="light"
              onClick={() => scrollToId('contacto')}
              className="bg-transparent text-sand-50 shadow-none ring-1 ring-inset ring-sand-50/30 backdrop-blur-sm hover:bg-sand-50/10 hover:text-white"
            >
              Tasar mi propiedad gratis
            </Button>
          </motion.div>

          {/* Prueba social inmediata, sin ocupar una sección propia.
              pr-16 en mobile: el botón flotante de WhatsApp (fixed bottom-5
              right-5) se superponía a la última línea de este texto cuando
              el hero ocupa casi toda la altura del viewport — confirmado en
              vivo en 390px de ancho. */}
          <motion.p variants={heroItem} className="mt-10 pr-16 text-sm text-sand-300/65 sm:pr-0">
            Valoración certificada en 48 h · Sin exclusividad forzosa · 480 operaciones firmadas
          </motion.p>
        </motion.div>
      </Container>

      {/* Indicador de scroll */}
      <motion.button
        type="button"
        onClick={() => scrollToId('propiedades')}
        aria-label="Ir a las propiedades"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.8 }}
        className="absolute bottom-7 right-6 z-10 hidden size-12 place-items-center rounded-full border border-sand-50/25 text-sand-50/80 transition-colors duration-300 hover:border-gold-300/70 hover:text-gold-300 lg:grid"
      >
        <motion.span
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ArrowDown className="size-4" aria-hidden />
        </motion.span>
      </motion.button>
    </section>
  );
}
