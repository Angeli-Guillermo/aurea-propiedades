/**
 * Estilo JSON del mapa: neutro cálido, muy desaturado, con el agua en un azul
 * apagado y las etiquetas de POI casi ocultas para que los pines de las
 * propiedades sean lo único que destaque.
 *
 * IMPORTANTE: Google ignora estos estilos si el mapa tiene `mapId`.
 * Con `VITE_GOOGLE_MAPS_MAP_ID` definido, el estilo se gestiona en Cloud Console.
 */
export const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#f5f2ec' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#6b7a8c' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f2ec' }] },

  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#d9d2c4' }] },
  {
    featureType: 'administrative.land_parcel',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'administrative.neighborhood',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8a97a6' }],
  },

  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#e4e8dd' }, { visibility: 'on' }],
  },

  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9aa4b0' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#fdfcfa' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#eae5db' }] },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#ded7c9' }],
  },
  { featureType: 'road.local', elementType: 'labels', stylers: [{ visibility: 'off' }] },

  { featureType: 'transit', stylers: [{ visibility: 'off' }] },

  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9d6de' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#8fa3b0' }] },
];
