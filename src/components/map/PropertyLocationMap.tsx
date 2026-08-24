interface PropertyLocationMapProps {
  lat: number;
  lng: number;
  title: string;
  address: string;
}

/**
 * Mini-mapa de una sola propiedad, embebido en `PropertyModal`.
 *
 * A diferencia de `PropertiesMap` (que necesita el SDK de Google Maps
 * JavaScript API para pines personalizados, InfoWindow y estilos), acá sólo
 * hace falta mostrar UN punto — así que usamos el embed clásico de Google
 * Maps por `<iframe>`. Ventaja clave: **no requiere API Key ni facturación**,
 * es gratis y muestra un mapa real, interactivo (pan/zoom), sin depender de
 * que el usuario configure `VITE_GOOGLE_MAPS_API_KEY`.
 */
export default function PropertyLocationMap({ lat, lng, title, address }: PropertyLocationMapProps) {
  // `hl=es-419` fuerza el idioma del embed (español latinoamericano) en vez de
  // depender del locale del sistema del visitante, que puede ser cualquier cosa.
  const embedSrc = `https://maps.google.com/maps?q=${lat},${lng}&z=15&hl=es-419&output=embed`;
  const mapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  return (
    <div className="relative size-full">
      <iframe
        src={embedSrc}
        title={`Mapa de ubicación: ${title}`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="size-full border-0"
      />

      <a
        href={mapsSearchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-3 right-3 rounded-full bg-sand-50/95 px-3.5 py-1.5 text-xs font-medium text-ink-800 shadow-soft backdrop-blur-sm transition-colors duration-300 hover:bg-white"
      >
        Abrir en Google Maps
      </a>
    </div>
  );
}
