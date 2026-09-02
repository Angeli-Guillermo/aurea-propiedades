/** Formateadores locales (es-AR) creados una sola vez: Intl es caro de instanciar. */

const currencyFormatters = new Map<string, Intl.NumberFormat>();

function currencyFormatter(currency: string): Intl.NumberFormat {
  let formatter = currencyFormatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    });
    currencyFormatters.set(currency, formatter);
  }
  return formatter;
}

const numberFormatter = new Intl.NumberFormat('es-AR');

/** 1850000 → "US$ 1.850.000" (convención del mercado argentino: venta en dólares) */
export function formatPrice(value: number, currency = 'USD'): string {
  return currencyFormatter(currency).format(value);
}

/**
 * Versión corta para markers y badges del mapa, donde no cabe el precio entero.
 * 1850000 → "US$ 1,85 M" · 520000 → "US$ 520 mil"
 */
export function formatPriceCompact(value: number, currency = 'USD'): string {
  const symbol = currency === 'USD' ? 'US$' : currency;
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    const decimals = Number.isInteger(millions) ? 0 : 2;
    return `${symbol} ${numberFormat(millions, decimals)} M`;
  }
  return `${symbol} ${numberFormat(Math.round(value / 1000), 0)} mil`;
}

/** 210 → "210 m²" */
export function formatArea(value: number): string {
  return `${numberFormatter.format(value)} m²`;
}

/** Formatea con un número fijo de decimales, en es-AR. */
export function numberFormat(value: number, decimals = 0): string {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Limpieza mínima de las descripciones que vienen del feed de ZonaProp
 * (scripts/sync-properties.mjs). No reescribe el contenido — lo redacta el
 * corredor, no nosotros — solo saca artefactos de scraping detectados en
 * vivo el 02-sep-2026: corridas de puntuación repetida ("....!!!!!"),
 * comillas dobles/triples usadas como énfasis (""..."" / """...""") y un
 * guion suelto colgando al final del texto.
 */
export function cleanScrapedDescription(text: string): string {
  return text
    .replace(/"{2,}/g, '"')
    .replace(/[!?.]{3,}/g, '.')
    .replace(/\s+([.!?])/g, '$1')
    .replace(/\s+-\s*$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
