/** Fallback si el header todavía no está montado. */
const FALLBACK_HEADER_HEIGHT = 76;
const EXTRA_OFFSET = 16;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Scroll suave a una sección compensando la altura real del header sticky.
 *
 * El CSS ya define `scroll-padding-top`, pero calcularlo en JS permite que el
 * offset siga siendo correcto cuando el header cambia de alto al hacer scroll.
 */
export function scrollToId(id: string): void {
  const target = document.getElementById(id);
  if (!target) return;

  const header = document.getElementById('site-header');
  const offset = (header?.offsetHeight ?? FALLBACK_HEADER_HEIGHT) + EXTRA_OFFSET;
  const top = target.getBoundingClientRect().top + window.scrollY - offset;

  window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
}
