import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Une clases condicionales (clsx) y resuelve conflictos de Tailwind (twMerge).
 * `cn('px-4', condicion && 'px-6')` → 'px-6'
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
