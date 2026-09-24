import { useCallback, useEffect, useState } from 'react';

import type { Property } from '@/types/property';

const PARAM = 'propiedad';

/**
 * Sólo el primer componente que monta reclama el deep-link inicial.
 * FeaturedProperties y MapSection usan este hook por separado (mismo patrón
 * que ya tenían con useState local) — sin este flag, ambos abrirían su propio
 * modal a la vez al cargar un link compartido.
 */
let autoOpenClaimed = false;

function buildUrl(id: string | null): string {
  const url = new URL(window.location.href);
  if (id) url.searchParams.set(PARAM, id);
  else url.searchParams.delete(PARAM);
  return url.toString();
}

/**
 * Estado de la ficha de propiedad abierta, sincronizado con `?propiedad=<id>`
 * en la URL — así cada ficha es un link compartible que abre directo a esa
 * propiedad, no sólo a la home.
 */
export function usePropertyModal(properties: Property[]) {
  const [selected, setSelected] = useState<Property | null>(null);

  useEffect(() => {
    if (autoOpenClaimed || properties.length === 0) return;
    autoOpenClaimed = true;
    const id = new URLSearchParams(window.location.search).get(PARAM);
    if (!id) return;
    const match = properties.find((property) => property.id === id);
    if (match) setSelected(match);
  }, [properties]);

  const select = useCallback((property: Property) => {
    setSelected(property);
    window.history.replaceState(null, '', buildUrl(property.id));
  }, []);

  const close = useCallback(() => {
    setSelected(null);
    window.history.replaceState(null, '', buildUrl(null));
  }, []);

  return { selected, select, close, shareUrl: selected ? buildUrl(selected.id) : null };
}
