import { motion } from 'motion/react';
import { Quote, Star } from 'lucide-react';

import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { TESTIMONIALS } from '@/data/content';
import { cn } from '@/lib/cn';
import { staggerContainer, staggerItem, VIEWPORT_ONCE } from '@/lib/motion';

export function Testimonials() {
  return (
    <section id="opiniones" className="scroll-mt-24 bg-sand-50 py-24 lg:py-32">
      <Container size="wide">
        <SectionHeading
          eyebrow="Opiniones"
          align="center"
          title="Lo que dicen quienes ya firmaron"
          description="Reseñas verificadas de operaciones cerradas en los últimos dos años."
        />

        <motion.div
          variants={staggerContainer(0.09)}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          className="mt-16 grid gap-6 md:grid-cols-2"
        >
          {TESTIMONIALS.map((testimonial, index) => (
            <motion.figure
              key={testimonial.name}
              variants={staggerItem}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.4 }}
              className={cn(
                'relative flex flex-col rounded-2xl bg-white p-8 shadow-soft transition-shadow duration-500 hover:shadow-lux lg:p-10',
                // Rompemos la retícula: las tarjetas impares bajan un poco en escritorio
                index % 2 === 1 && 'md:mt-10',
              )}
            >
              <Quote
                className="size-8 shrink-0 text-gold-300"
                aria-hidden
                strokeWidth={1.25}
              />

              <blockquote className="mt-6 text-[1.0625rem] leading-relaxed text-ink-800 text-pretty">
                {testimonial.quote}
              </blockquote>

              <figcaption className="mt-8 flex items-center justify-between gap-4 border-t border-ink-900/8 pt-6">
                <div>
                  <p className="font-medium text-ink-900">{testimonial.name}</p>
                  <p className="mt-0.5 text-[0.8125rem] text-ink-500">{testimonial.context}</p>
                </div>

                <div
                  className="flex gap-0.5"
                  role="img"
                  aria-label={`Valoración: ${testimonial.rating} de 5`}
                >
                  {Array.from({ length: 5 }, (_, starIndex) => (
                    <Star
                      key={starIndex}
                      aria-hidden
                      className={cn(
                        'size-4',
                        starIndex < testimonial.rating
                          ? 'fill-gold-400 text-gold-400'
                          : 'text-ink-300',
                      )}
                    />
                  ))}
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
