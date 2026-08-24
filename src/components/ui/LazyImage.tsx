import { useEffect, useRef, useState } from 'react';
import type { ImgHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

interface LazyImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'loading'> {
  src: string;
  alt: string;
  /** Obligatorios: reservan el espacio y evitan CLS. */
  width: number;
  height: number;
  /** Sólo para la imagen LCP (hero): carga eager + fetchPriority alta. */
  priority?: boolean;
  /** Clases del contenedor (aspect-ratio, radios, overflow). */
  wrapperClassName?: string;
}

/**
 * Imagen con carga diferida y fundido de entrada.
 *
 * - `loading="lazy"` + `decoding="async"` en todo lo que no es LCP.
 * - Dimensiones explícitas → cero layout shift.
 * - Placeholder de color mientras descarga (no un spinner que distraiga).
 */
export function LazyImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
  wrapperClassName,
  ...rest
}: LazyImageProps) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Si la imagen ya estaba en caché, `onLoad` puede haberse disparado
  // antes de que React adjuntara el handler.
  useEffect(() => {
    if (imageRef.current?.complete) setLoaded(true);
  }, []);

  return (
    <span className={cn('relative block overflow-hidden bg-sand-200', wrapperClassName)}>
      <img
        ref={imageRef}
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        onLoad={() => setLoaded(true)}
        className={cn(
          'h-full w-full object-cover transition-opacity duration-700 ease-out-quart',
          loaded ? 'opacity-100' : 'opacity-0',
          className,
        )}
        {...rest}
      />
      {!loaded ? (
        <span aria-hidden className="absolute inset-0 animate-pulse bg-sand-200" />
      ) : null}
    </span>
  );
}
