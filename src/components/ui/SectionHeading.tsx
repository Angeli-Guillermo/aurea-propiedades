import { motion } from 'motion/react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';
import { fadeUp, staggerContainer, VIEWPORT_ONCE } from '@/lib/motion';

interface SectionHeadingProps {
  /** Kicker en mayúsculas sobre el titular. */
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  align?: 'left' | 'center';
  tone?: 'dark' | 'light';
  className?: string;
}

/**
 * Encabezado de sección reutilizable.
 * Mantiene la misma jerarquía tipográfica en toda la página.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  tone = 'dark',
  className,
}: SectionHeadingProps) {
  const isLight = tone === 'light';

  return (
    <motion.div
      variants={staggerContainer(0.1)}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT_ONCE}
      className={cn(
        'flex max-w-2xl flex-col gap-5',
        align === 'center' && 'mx-auto items-center text-center',
        className,
      )}
    >
      <motion.span
        variants={fadeUp}
        className={cn(
          'inline-flex items-center gap-2.5 text-[0.6875rem] font-medium uppercase tracking-[0.24em]',
          isLight ? 'text-gold-300' : 'text-gold-600',
        )}
      >
        <span
          aria-hidden
          className={cn('h-px w-8', isLight ? 'bg-gold-300/60' : 'bg-gold-500/60')}
        />
        {eyebrow}
      </motion.span>

      <motion.h2
        variants={fadeUp}
        className={cn(
          'text-headline font-light text-balance',
          isLight ? 'text-sand-50' : 'text-ink-900',
        )}
      >
        {title}
      </motion.h2>

      {description ? (
        <motion.p
          variants={fadeUp}
          className={cn(
            'text-base leading-relaxed text-pretty sm:text-[1.0625rem]',
            isLight ? 'text-sand-200/80' : 'text-ink-700/85',
          )}
        >
          {description}
        </motion.p>
      ) : null}
    </motion.div>
  );
}
