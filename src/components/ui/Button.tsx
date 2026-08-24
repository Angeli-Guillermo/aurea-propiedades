import { motion } from 'motion/react';
import type { HTMLMotionProps } from 'motion/react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';
import { EASE_OUT_QUART } from '@/lib/motion';

type Variant = 'primary' | 'gold' | 'outline' | 'ghost' | 'light';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-ink-900 text-sand-50 hover:bg-ink-800 shadow-soft hover:shadow-lux',
  gold: 'bg-gold-500 text-ink-950 hover:bg-gold-400 shadow-soft hover:shadow-lux',
  outline:
    'border border-ink-900/20 text-ink-900 hover:border-ink-900/45 hover:bg-ink-900/[0.04]',
  ghost: 'text-ink-700 hover:text-ink-900 hover:bg-ink-900/[0.05]',
  light:
    'bg-sand-50/95 text-ink-900 hover:bg-white shadow-soft backdrop-blur-sm',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-4 text-[0.8125rem]',
  md: 'h-11 px-6 text-sm',
  lg: 'h-13 px-8 text-[0.9375rem]',
};

const BASE =
  'inline-flex select-none items-center justify-center gap-2 rounded-full font-medium tracking-tight ' +
  'transition-colors duration-300 ease-out-quart disabled:pointer-events-none disabled:opacity-55';

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

// Usamos los props de Motion (no los de React) porque Motion redefine
// `onDrag`, `onAnimationStart` y compañía con firmas propias.
type ButtonProps = CommonProps & Omit<HTMLMotionProps<'button'>, 'children'>;
type LinkProps = CommonProps & Omit<HTMLMotionProps<'a'>, 'children'>;

const MotionButton = motion.button;
const MotionLink = motion.a;

/** Botón con micro-interacción (hover + tap) sobre transform únicamente. */
export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <MotionButton
      type="button"
      whileHover={{ scale: 1.025 }}
      whileTap={{ scale: 0.975 }}
      transition={{ duration: 0.2, ease: EASE_OUT_QUART }}
      className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
      {...props}
    >
      {children}
    </MotionButton>
  );
}

/** Misma apariencia que `Button`, pero semánticamente un enlace. */
export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: LinkProps) {
  return (
    <MotionLink
      whileHover={{ scale: 1.025 }}
      whileTap={{ scale: 0.975 }}
      transition={{ duration: 0.2, ease: EASE_OUT_QUART }}
      className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
      {...props}
    >
      {children}
    </MotionLink>
  );
}
