import { useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';

import { useInViewOnce } from '@/hooks/useInViewOnce';
import { numberFormat } from '@/lib/format';

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  /** Duración total en milisegundos. */
  duration?: number;
  className?: string;
}

/** Ease-out cúbico: arranque rápido y frenada larga, se lee mejor que lineal. */
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

/**
 * Contador que arranca cuando entra en viewport.
 * Con `prefers-reduced-motion` muestra el valor final sin animar.
 */
export function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 1800,
  className,
}: AnimatedCounterProps) {
  const { ref, inView } = useInViewOnce<HTMLSpanElement>('0px');
  const shouldReduceMotion = useReducedMotion();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!inView) return;

    if (shouldReduceMotion) {
      setCurrent(value);
      return;
    }

    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setCurrent(value * easeOutCubic(progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value, duration, shouldReduceMotion]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {numberFormat(current, decimals)}
      {suffix}
    </span>
  );
}
