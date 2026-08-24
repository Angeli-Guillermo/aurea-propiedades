import { useEffect, useRef, useState } from 'react';
import type { TouchEvent } from 'react';
import { createPortal } from 'react-dom';
import {
  Bath,
  BedDouble,
  Car,
  Check,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  LandPlot,
  LayoutGrid,
  MapPin,
  Maximize,
  Wallet,
  X,
  ZoomIn,
} from 'lucide-react';

import { Button, ButtonLink } from '@/components/ui/Button';
import { LazyImage } from '@/components/ui/LazyImage';
import { Modal } from '@/components/ui/Modal';
import PropertyLocationMap from '@/components/map/PropertyLocationMap';
import { whatsappUrl } from '@/data/site';
import { cn } from '@/lib/cn';
import { formatArea, formatPrice } from '@/lib/format';
import { scrollToId } from '@/lib/scroll';
import { PROPERTY_TYPE_LABELS, type Property } from '@/types/property';

interface PropertyModalProps {
  property: Property | null;
  onClose: () => void;
}

/** Ficha completa de la propiedad seleccionada. */
export function PropertyModal({ property, onClose }: PropertyModalProps) {
  const [activeImage, setActiveImage] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Guardamos la última propiedad para que la animación de salida siga
  // teniendo contenido que renderizar mientras el modal se cierra.
  const lastProperty = useRef<Property | null>(null);
  if (property) lastProperty.current = property;
  const data = property ?? lastProperty.current;

  // Al cambiar de propiedad volvemos siempre a la primera foto.
  useEffect(() => {
    setActiveImage(0);
    setIsLightboxOpen(false);
  }, [property?.id]);

  const gallery = data ? (data.gallery.length > 0 ? data.gallery : [data.image]) : [];
  const goToPrev = () => setActiveImage((index) => (index - 1 + gallery.length) % gallery.length);
  const goToNext = () => setActiveImage((index) => (index + 1) % gallery.length);

  // Flechas del teclado para pasar de foto mientras el modal está abierto.
  useEffect(() => {
    if (!property || gallery.length <= 1) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') goToPrev();
      if (event.key === 'ArrowRight') goToNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [property, gallery.length]);

  // Escape cierra primero el visor ampliado, no toda la ficha — se registra en
  // fase de captura para llegar antes que el Escape del Modal contenedor.
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      setIsLightboxOpen(false);
    };
    document.addEventListener('keydown', handleEscape, { capture: true });
    return () => document.removeEventListener('keydown', handleEscape, { capture: true });
  }, [isLightboxOpen]);

  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0].clientX;
  };
  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const deltaX = event.changedTouches[0].clientX - touchStartX.current;
    const SWIPE_THRESHOLD = 40;
    if (deltaX > SWIPE_THRESHOLD) goToPrev();
    else if (deltaX < -SWIPE_THRESHOLD) goToNext();
    touchStartX.current = null;
  };

  if (!data) return null;
  // Ambientes/dormitorios/baños no aplican a todos los tipos (cochera, terreno, local
  // sin uso) — se omiten en vez de mostrar un "0" o un dato que no está en el aviso real.
  const specs = [
    ...(data.rooms ? [{ icon: LayoutGrid, label: 'Ambientes', value: String(data.rooms) }] : []),
    ...(data.bedrooms > 0
      ? [{ icon: BedDouble, label: 'Dormitorios', value: String(data.bedrooms) }]
      : []),
    ...(data.bathrooms > 0
      ? [{ icon: Bath, label: 'Baños', value: String(data.bathrooms) }]
      : []),
    { icon: Maximize, label: 'Superficie', value: formatArea(data.area) },
    ...(data.areaTotal
      ? [{ icon: LandPlot, label: 'Sup. total', value: formatArea(data.areaTotal) }]
      : []),
    { icon: Car, label: 'Cochera', value: data.parking > 0 ? `${data.parking} cocheras` : '—' },
    ...(data.year ? [{ icon: CalendarDays, label: 'Año', value: String(data.year) }] : []),
    // Las expensas son en pesos aunque la propiedad se venda en dólares —
    // convención del mercado argentino. No todos los avisos las declaran
    // (terrenos y casas standalone típicamente no tienen).
    ...(data.expenses
      ? // Espacio antes de "/mes" (no pegado al monto): sin él, "275.000/mes" es
        // un solo token sin puntos de corte y el navegador lo desborda del ancho
        // de la celda en vez de bajarlo de línea — con el contenedor en
        // overflow-hidden, ese desborde se ve como el número cortado a la mitad.
        [{ icon: Wallet, label: 'Expensas', value: `${formatPrice(data.expenses, 'ARS')} /mes` }]
      : []),
  ];
  // La grilla usa 4 columnas en desktop (2 en mobile, ambos divisores de 4)
  // — sin este relleno, una fila incompleta deja expuesto el fondo oscuro
  // del contenedor como un bloque gris feo en vez de una celda vacía discreta.
  const SPEC_COLUMNS = 4;
  const specsFillerCount = (SPEC_COLUMNS - (specs.length % SPEC_COLUMNS)) % SPEC_COLUMNS;

  const requestVisit = () => {
    onClose();
    requestAnimationFrame(() => scrollToId('contacto'));
  };

  return (
    <>
    <Modal open={property !== null} onClose={onClose} label={data.title}>
      {/* Galería */}
      <div
        className="group relative"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <button
          type="button"
          onClick={() => setIsLightboxOpen(true)}
          aria-label="Ampliar foto"
          className="block w-full cursor-zoom-in"
        >
          <LazyImage
            key={gallery[activeImage]}
            src={gallery[activeImage]}
            alt={`${data.title} — imagen ${activeImage + 1} de ${gallery.length}`}
            width={1200}
            height={750}
            wrapperClassName="aspect-[16/10] sm:aspect-[16/9] rounded-t-3xl"
          />
        </button>

        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        >
          <span className="grid size-11 place-items-center rounded-full bg-ink-950/45 text-sand-50 backdrop-blur-md">
            <ZoomIn className="size-5" />
          </span>
        </span>

        {gallery.length > 1 ? (
          <>
            <button
              type="button"
              onClick={goToPrev}
              aria-label="Foto anterior"
              className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-ink-950/45 text-sand-50 backdrop-blur-md transition-colors duration-300 hover:bg-ink-950/70 sm:left-4 sm:size-11"
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={goToNext}
              aria-label="Foto siguiente"
              className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-ink-950/45 text-sand-50 backdrop-blur-md transition-colors duration-300 hover:bg-ink-950/70 sm:right-4 sm:size-11"
            >
              <ChevronRight className="size-5" aria-hidden />
            </button>

            <p className="absolute left-4 top-4 rounded-full bg-ink-950/45 px-3 py-1 text-xs text-sand-50 backdrop-blur-md">
              {activeImage + 1} / {gallery.length}
            </p>

            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 rounded-full bg-ink-950/45 p-2 backdrop-blur-md">
              {gallery.map((src, index) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  aria-label={`Ver imagen ${index + 1}`}
                  aria-current={index === activeImage}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-400 ease-out-expo',
                    index === activeImage ? 'w-8 bg-sand-50' : 'w-1.5 bg-sand-50/50 hover:bg-sand-50/80',
                  )}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      <div className="p-6 sm:p-10">
        {/* Cabecera */}
        <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
          <div className="min-w-0">
            <p className="text-[0.6875rem] uppercase tracking-[0.2em] text-gold-600">
              {PROPERTY_TYPE_LABELS[data.type]} · {data.neighborhood}
            </p>
            <h3 className="mt-2 font-display text-3xl font-light leading-tight text-ink-900 text-balance sm:text-4xl">
              {data.title}
            </h3>
            <p className="mt-3 flex items-center gap-2 text-sm text-ink-600">
              <MapPin className="size-4 shrink-0 text-ink-400" aria-hidden />
              {data.address}, {data.city}
            </p>
          </div>

          <div className="shrink-0">
            <p className="font-display text-3xl font-normal text-ink-900">
              {formatPrice(data.price, data.currency)}
              {data.status === 'alquiler' ? (
                <span className="text-lg text-ink-500">/mes</span>
              ) : null}
            </p>
            {data.status === 'venta' ? (
              <p className="mt-1 text-right text-xs text-ink-500">
                {formatPrice(Math.round(data.price / data.area), data.currency)} / m²
              </p>
            ) : null}
          </div>
        </div>

        {/* Especificaciones */}
        <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-ink-900/10 sm:grid-cols-4">
          {specs.map(({ icon: Icon, label, value }) => (
            <div key={label} className="min-w-0 bg-sand-50 px-5 py-4">
              <dt className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-ink-400">
                <Icon className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate">{label}</span>
              </dt>
              <dd className="mt-1.5 break-words text-lg font-light text-ink-900">{value}</dd>
            </div>
          ))}
          {Array.from({ length: specsFillerCount }).map((_, index) => (
            <div key={`filler-${index}`} aria-hidden className="bg-sand-50" />
          ))}
        </dl>

        {/* Descripción */}
        <div className="mt-9 grid gap-9 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <h4 className="font-display text-lg font-normal text-ink-900">Sobre la propiedad</h4>
            <p className="mt-3 leading-relaxed text-ink-700/90 text-pretty">
              {data.description}
            </p>
          </div>

          {data.features.length > 0 ? (
            <div>
              <h4 className="font-display text-lg font-normal text-ink-900">Destacados</h4>
              <ul className="mt-3 space-y-2.5">
                {data.features.map((feature) => (
                  <li key={feature} className="flex gap-3 text-sm text-ink-700">
                    <Check className="mt-0.5 size-4 shrink-0 text-gold-600" aria-hidden />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        {/* Ubicación */}
        <div className="mt-9">
          <h4 className="font-display text-lg font-normal text-ink-900">Ubicación</h4>
          <p className="mt-1 text-sm text-ink-600">
            {data.address}, {data.neighborhood}
          </p>
          <div className="mt-4 h-56 overflow-hidden rounded-2xl sm:h-64">
            <PropertyLocationMap
              lat={data.lat}
              lng={data.lng}
              title={data.title}
              address={`${data.address}, ${data.neighborhood}, ${data.city}`}
            />
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 flex flex-col gap-3 border-t border-ink-900/10 pt-8 sm:flex-row">
          <Button size="lg" onClick={requestVisit} className="sm:flex-1">
            Solicitar visita
          </Button>
          <ButtonLink
            variant="outline"
            size="lg"
            href={whatsappUrl(
              `Hola, me interesa la propiedad "${data.title}" (${data.neighborhood}). ¿Podemos hablar?`,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="sm:flex-1"
          >
            Consultar por WhatsApp
          </ButtonLink>
        </div>
      </div>
    </Modal>

    {isLightboxOpen
      ? createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Foto ${activeImage + 1} de ${gallery.length}: ${data.title}`}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-ink-950/95 p-4 backdrop-blur-sm sm:p-10"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <button
              type="button"
              aria-label="Cerrar"
              onClick={() => setIsLightboxOpen(false)}
              className="absolute inset-0 cursor-zoom-out"
            />

            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              aria-label="Cerrar vista ampliada"
              className="absolute right-4 top-4 z-10 grid size-11 place-items-center rounded-full bg-sand-50/10 text-sand-50 backdrop-blur-md transition-colors duration-300 hover:bg-sand-50/20"
            >
              <X className="size-5" aria-hidden />
            </button>

            <img
              src={gallery[activeImage]}
              alt={`${data.title} — imagen ${activeImage + 1} de ${gallery.length}`}
              className="relative max-h-[88dvh] max-w-full rounded-lg object-contain shadow-lux"
            />

            {gallery.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={goToPrev}
                  aria-label="Foto anterior"
                  className="absolute left-3 top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-sand-50/10 text-sand-50 backdrop-blur-md transition-colors duration-300 hover:bg-sand-50/20 sm:left-6"
                >
                  <ChevronLeft className="size-5" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={goToNext}
                  aria-label="Foto siguiente"
                  className="absolute right-3 top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-sand-50/10 text-sand-50 backdrop-blur-md transition-colors duration-300 hover:bg-sand-50/20 sm:right-6"
                >
                  <ChevronRight className="size-5" aria-hidden />
                </button>
                <p className="absolute left-4 top-4 rounded-full bg-sand-50/10 px-3 py-1 text-xs text-sand-50 backdrop-blur-md">
                  {activeImage + 1} / {gallery.length}
                </p>
              </>
            ) : null}
          </div>,
          document.body,
        )
      : null}
    </>
  );
}
