import { useEffect, useRef, useState } from 'react';

/**
 * Detecta la primera entrada del elemento en viewport y se desconecta.
 *
 * Se usa para diferir trabajo caro: la carga del bundle de Google Maps
 * y el arranque de los contadores animados.
 *
 * @param rootMargin margen previo para empezar a cargar un poco antes de que
 *                   el usuario llegue a la sección (evita el "pop" visual).
 */
export function useInViewOnce<T extends Element>(rootMargin = '200px') {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (inView) return;
    const element = ref.current;
    if (!element) return;

    // Navegadores sin IntersectionObserver: mostramos el contenido directamente.
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold: 0 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [inView, rootMargin]);

  return { ref, inView } as const;
}
