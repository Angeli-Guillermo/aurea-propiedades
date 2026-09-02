import { motion } from 'motion/react';

import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { LazyImage } from '@/components/ui/LazyImage';
import { TEAM } from '@/data/content';
import { SITE } from '@/data/site';
import { fadeSide, fadeUp, staggerContainer, staggerItem, VIEWPORT_ONCE } from '@/lib/motion';
import { scrollToId } from '@/lib/scroll';

/** "Dra. Vanina Marisel Cesari" → "VC" — ignora títulos (Dr./Dra./Lic.) para el placeholder. */
function initials(fullName: string): string {
  const words = fullName.split(' ').filter((word) => !/^(Dr|Dra|Lic|Sr|Sra)\.?$/i.test(word));
  const first = words[0]?.[0] ?? '';
  const last = words.length > 1 ? words[words.length - 1][0] : '';
  return `${first}${last}`.toUpperCase();
}

// Foto real de un edificio de la cartera (Belgrano R, Blanco Encalada 2995)
// — no una de stock. Se probaron varias fotos reales de avisos antes de
// elegir ésta: la mayoría son fotos funcionales de aviso (marca de agua de
// Zonaprop, poca definición al agrandarlas), ésta es la única nítida y sin
// marca de agua. Reemplazar cuando haya una foto real de la oficina propia
// (Blanco Encalada 1583) o del equipo en acción.
const ANCHOR_IMAGE =
  'https://imgar.zonapropcdn.com/avisos/resize/1/00/53/40/99/58/1200x1200/1905906466.jpg';

export function About() {
  return (
    <section id="nosotros" className="scroll-mt-24 bg-sand-100 py-24 lg:py-32">
      <Container size="wide">
        {/* Foto real + texto. Una sola imagen a propósito: dos fotos de estilos
            distintos (la anterior combinación de stock) generaban un choque
            visual que le restaba elegancia al conjunto. */}
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <motion.div
            variants={fadeSide('left')}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE}
          >
            <LazyImage
              src={ANCHOR_IMAGE}
              alt="Edificio de la cartera en Belgrano R"
              width={1000}
              height={1250}
              wrapperClassName="aspect-[4/5] rounded-2xl shadow-lux"
            />
          </motion.div>

          <div>
            <motion.div
              variants={staggerContainer(0.1)}
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT_ONCE}
              className="flex flex-col gap-5"
            >
              {/* Reemplaza el eyebrow genérico "Quiénes somos": el dato real
                  pesa más que una etiqueta de sección. */}
              <motion.span
                variants={fadeUp}
                className="inline-flex w-fit items-center gap-2 rounded-full border border-gold-500/25 bg-gold-50 py-1.5 pl-2 pr-4 text-xs font-medium text-gold-700"
              >
                <span className="grid size-6 place-items-center rounded-full bg-gold-500 font-display text-[0.6875rem] text-sand-50">
                  {new Date().getFullYear() - SITE.foundedYear}
                </span>
                años operando en Buenos Aires
              </motion.span>

              <motion.h2
                variants={fadeUp}
                className="font-display text-4xl font-light leading-[1.1] text-ink-900 text-balance sm:text-5xl"
              >
                Una familia dedicada a tu patrimonio
              </motion.h2>
            </motion.div>

            <motion.div
              variants={staggerContainer(0.09)}
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT_ONCE}
              className="mt-7 space-y-5 text-[0.9375rem] leading-relaxed text-ink-700/90 [font-weight:450]"
            >
              <motion.p variants={staggerItem}>
                Comprar o vender es una de las decisiones más importantes de tu vida — nuestro
                diferencial es acompañarte en cada paso, de punta a punta.
              </motion.p>
              <motion.p variants={staggerItem}>
                Como empresa familiar que opera desde Capital Federal, fusionamos dos pilares
                fundamentales: los 60 años de experiencia comercial de Mauro Otranto y el resguardo
                jurídico de la abogada Vanina Marisel Cesari.
              </motion.p>
              <motion.p variants={staggerItem}>
                Nuestro equipo centraliza toda la gestión para que no tengas que preocuparte por
                trámites ni imprevistos legales. Nosotros nos ocupamos de todo.
              </motion.p>
            </motion.div>

            <Button size="lg" className="mt-9" onClick={() => scrollToId('contacto')}>
              Agendar una asesoría
            </Button>
          </div>
        </div>

        {/* Equipo */}
        <motion.div
          variants={staggerContainer(0.1)}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          className="mt-32 grid gap-8 sm:grid-cols-2 sm:max-w-2xl sm:mx-auto lg:max-w-none lg:mx-0"
        >
          {TEAM.map((member) => (
            <motion.article key={member.name} variants={staggerItem} className="group">
              {member.image ? (
                <LazyImage
                  src={member.image}
                  alt={`${member.name}, ${member.role}`}
                  width={640}
                  height={800}
                  wrapperClassName="aspect-[4/5] rounded-2xl"
                  className="grayscale transition-[filter,transform] duration-700 ease-out-expo group-hover:scale-[1.03] group-hover:grayscale-0"
                />
              ) : (
                // Sin foto real todavía: placeholder con iniciales, mismo tratamiento
                // visual que el monograma del favicon, en vez de una foto de stock
                // atribuida a una persona real.
                <div
                  aria-hidden
                  className="flex aspect-[4/5] items-center justify-center rounded-2xl bg-ink-900"
                >
                  <span className="font-display text-5xl text-gold-400">
                    {initials(member.name)}
                  </span>
                </div>
              )}
              <h3 className="mt-5 font-display text-xl font-normal text-ink-900">{member.name}</h3>
              <p className="mt-0.5 text-[0.6875rem] uppercase tracking-[0.18em] text-gold-600">
                {member.role}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ink-600/85">{member.bio}</p>
              {member.matricula ? (
                <p className="mt-2 text-xs text-ink-500">{member.matricula}</p>
              ) : null}
            </motion.article>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
