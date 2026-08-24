import { useCallback, useEffect, useMemo, useState } from 'react';
import { GoogleMap, InfoWindowF, MarkerF, useJsApiLoader } from '@react-google-maps/api';
import { ArrowUpRight, MapPin } from 'lucide-react';

import { MAP_STYLES } from '@/components/map/mapStyles';
import {
  GOOGLE_MAPS_API_KEY,
  GOOGLE_MAPS_LOADER_ID,
  GOOGLE_MAPS_MAP_ID,
  MAP_COLORS,
  MAP_PIN_PATH,
} from '@/components/map/mapConfig';
import { SITE } from '@/data/site';
import { formatArea, formatPrice, formatPriceCompact } from '@/lib/format';
import { PROPERTY_TYPE_LABELS, type Property } from '@/types/property';

interface PropertiesMapProps {
  properties: readonly Property[];
  /** Abre el modal de detalle desde el InfoWindow. */
  onSelect: (property: Property) => void;
}

const CONTAINER_STYLE = { width: '100%', height: '100%' } as const;

/**
 * Mapa de propiedades.
 *
 * Este módulo se importa con `React.lazy` desde `MapSection`, de modo que
 * ni este componente ni el SDK de Google entran en el bundle inicial.
 */
export default function PropertiesMap({ properties, onSelect }: PropertiesMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: GOOGLE_MAPS_LOADER_ID,
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    // `mapIds` sólo se envía si hay Map ID: si no, Google aplica los estilos JSON.
    ...(GOOGLE_MAPS_MAP_ID ? { mapIds: [GOOGLE_MAPS_MAP_ID] } : {}),
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeProperty = useMemo(
    () => properties.find((property) => property.id === activeId) ?? null,
    [properties, activeId],
  );

  const options = useMemo<google.maps.MapOptions>(
    () => ({
      disableDefaultUI: true,
      zoomControl: true,
      clickableIcons: false,
      // En móvil evita "secuestrar" el scroll de la página.
      gestureHandling: 'cooperative',
      maxZoom: 17,
      ...(GOOGLE_MAPS_MAP_ID ? { mapId: GOOGLE_MAPS_MAP_ID } : { styles: MAP_STYLES }),
    }),
    [],
  );

  /** Encuadra automáticamente todos los pines cada vez que cambia el listado. */
  useEffect(() => {
    if (!map || properties.length === 0) return;

    if (properties.length === 1) {
      map.setCenter({ lat: properties[0].lat, lng: properties[0].lng });
      map.setZoom(15);
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    for (const property of properties) {
      bounds.extend({ lat: property.lat, lng: property.lng });
    }
    map.fitBounds(bounds, { top: 72, right: 48, bottom: 72, left: 48 });
  }, [map, properties]);

  // Si el listado cambia y la propiedad activa ya no existe, cerramos el InfoWindow.
  useEffect(() => {
    if (activeId && !properties.some((property) => property.id === activeId)) {
      setActiveId(null);
    }
  }, [activeId, properties]);

  const buildIcon = useCallback(
    (isActive: boolean): google.maps.Symbol => ({
      path: MAP_PIN_PATH,
      fillColor: isActive ? MAP_COLORS.gold : MAP_COLORS.ink,
      fillOpacity: 1,
      strokeColor: MAP_COLORS.sand,
      strokeWeight: 2,
      scale: isActive ? 1.15 : 0.92,
      anchor: new google.maps.Point(12, 36),
    }),
    [],
  );

  // ── Estados de error ───────────────────────────────────────────────────
  if (!GOOGLE_MAPS_API_KEY) return <MapNotice variant="missing-key" />;
  if (loadError) return <MapNotice variant="load-error" />;
  if (!isLoaded) return <MapLoading />;

  const center = properties[0]
    ? { lat: properties[0].lat, lng: properties[0].lng }
    : SITE.mapCenter;

  return (
    <GoogleMap
      mapContainerStyle={CONTAINER_STYLE}
      center={center}
      zoom={12}
      options={options}
      onLoad={setMap}
      onUnmount={() => setMap(null)}
      onClick={() => setActiveId(null)}
    >
      {properties.map((property) => (
        <MarkerF
          key={property.id}
          position={{ lat: property.lat, lng: property.lng }}
          icon={buildIcon(property.id === activeId)}
          title={`${property.title} · ${formatPriceCompact(property.price, property.currency)}`}
          zIndex={property.id === activeId ? 10 : 1}
          onClick={() => setActiveId(property.id)}
        />
      ))}

      {activeProperty ? (
        <InfoWindowF
          position={{ lat: activeProperty.lat, lng: activeProperty.lng }}
          onCloseClick={() => setActiveId(null)}
          options={{ pixelOffset: new google.maps.Size(0, -40), disableAutoPan: false }}
        >
          <div className="w-64 overflow-hidden rounded-2xl bg-white font-sans">
            <img
              src={activeProperty.image}
              alt=""
              width={512}
              height={288}
              loading="lazy"
              decoding="async"
              className="h-28 w-full object-cover"
            />
            <div className="p-4">
              <p className="text-[0.625rem] uppercase tracking-[0.18em] text-gold-600">
                {PROPERTY_TYPE_LABELS[activeProperty.type]} · {activeProperty.neighborhood}
              </p>
              <p className="mt-1.5 font-display text-lg leading-tight text-ink-900">
                {formatPrice(activeProperty.price, activeProperty.currency)}
              </p>
              <p className="mt-1 flex items-start gap-1.5 text-xs leading-snug text-ink-600">
                <MapPin className="mt-px size-3 shrink-0 text-ink-400" aria-hidden />
                {activeProperty.address}
              </p>
              <p className="mt-1 text-xs text-ink-500">
                {activeProperty.bedrooms} hab · {activeProperty.bathrooms} baños ·{' '}
                {formatArea(activeProperty.area)}
              </p>

              <button
                type="button"
                onClick={() => onSelect(activeProperty)}
                className="mt-3.5 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-ink-900 px-4 py-2 text-xs font-medium text-sand-50 transition-colors duration-300 hover:bg-ink-800"
              >
                Ver detalle
                <ArrowUpRight className="size-3.5" aria-hidden />
              </button>
            </div>
          </div>
        </InfoWindowF>
      ) : null}
    </GoogleMap>
  );
}

/** Placeholder mientras el SDK de Google descarga y se inicializa. */
function MapLoading() {
  return (
    <div className="grid h-full w-full place-items-center bg-sand-100">
      <div className="flex flex-col items-center gap-3 text-ink-400">
        <span
          aria-hidden
          className="size-8 animate-spin rounded-full border-2 border-ink-900/15 border-t-gold-500"
        />
        <p className="text-sm">Cargando mapa…</p>
      </div>
    </div>
  );
}

/** Fallback elegante: la sección nunca se rompe por falta de API Key. */
function MapNotice({ variant }: { variant: 'missing-key' | 'load-error' }) {
  const isMissingKey = variant === 'missing-key';

  return (
    <div className="grid h-full w-full place-items-center bg-sand-100 px-6 py-12">
      <div className="max-w-md text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-ink-900/[0.06] text-ink-500">
          <MapPin className="size-5" aria-hidden />
        </span>
        <p className="mt-5 font-display text-xl text-ink-900">
          {isMissingKey ? 'Mapa no configurado' : 'No hemos podido cargar el mapa'}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink-600">
          {isMissingKey ? (
            <>
              Definí <code className="rounded bg-ink-900/[0.06] px-1.5 py-0.5 text-[0.8em]">
                VITE_GOOGLE_MAPS_API_KEY
              </code>{' '}
              en tu archivo <code className="rounded bg-ink-900/[0.06] px-1.5 py-0.5 text-[0.8em]">.env.local</code>{' '}
              y reiniciá el servidor de desarrollo. Las instrucciones paso a paso están en el
              README.
            </>
          ) : (
            <>
              Revisá que la API Key sea válida, que la <em>Maps JavaScript API</em> esté habilitada
              y que el dominio actual esté en las restricciones de referente HTTP.
            </>
          )}
        </p>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SITE.address)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-gold-600 underline underline-offset-4 transition-colors hover:text-gold-700"
        >
          Ver la oficina en Google Maps
          <ArrowUpRight className="size-4" aria-hidden />
        </a>
      </div>
    </div>
  );
}
