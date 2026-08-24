import type { Variants } from 'motion/react';

/**
 * Variants centralizados de Framer Motion (paquete `motion`).
 *
 * Regla de oro de performance: sólo animamos `transform` y `opacity`,
 * nunca propiedades que provoquen layout (width, height, top, margin...).
 *
 * `prefers-reduced-motion` se respeta globalmente vía <MotionConfig reducedMotion="user">
 * en App.tsx, así que aquí no hace falta condicionar nada.
 */

/** Curva de salida amplia, el "sello" de movimiento de la página. */
export const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const EASE_OUT_QUART: [number, number, number, number] = [0.25, 1, 0.5, 1];

/** Configuración de viewport para `whileInView`: se anima una sola vez. */
export const VIEWPORT_ONCE = { once: true, amount: 0.2 } as const;

/** Aparición desde abajo. Es el movimiento por defecto de las secciones. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE_OUT_EXPO },
  },
};

/** Variante más sutil para textos largos y elementos secundarios. */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.8, ease: EASE_OUT_QUART } },
};

/** Aparición lateral, usada en composiciones editoriales de dos columnas. */
export const fadeSide = (from: 'left' | 'right'): Variants => ({
  hidden: { opacity: 0, x: from === 'left' ? -32 : 32 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.75, ease: EASE_OUT_EXPO } },
});

/** Contenedor que escalona la entrada de sus hijos. */
export const staggerContainer = (stagger = 0.08, delayChildren = 0.05): Variants => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: stagger, delayChildren },
  },
});

/** Item pensado para vivir dentro de `staggerContainer` (grids de tarjetas). */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: EASE_OUT_EXPO },
  },
};

/** Elevación sutil en hover de tarjeta. */
export const cardHover = {
  rest: { y: 0 },
  hover: { y: -8, transition: { duration: 0.4, ease: EASE_OUT_EXPO } },
} satisfies Variants;

/** Micro-interacción estándar de botones y chips. */
export const tapScale = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: { duration: 0.2, ease: EASE_OUT_QUART },
} as const;

/** Overlay + panel del modal de detalle. */
export const modalOverlay: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

export const modalPanel: Variants = {
  hidden: { opacity: 0, y: 32, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: EASE_OUT_EXPO } },
  exit: { opacity: 0, y: 16, scale: 0.99, transition: { duration: 0.2, ease: EASE_OUT_QUART } },
};
