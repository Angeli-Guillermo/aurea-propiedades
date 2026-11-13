declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void;
  }
}

/**
 * Evento personalizado de Microsoft Clarity (gratis; los de Vercel Analytics
 * piden plan Pro). En Clarity: Filtros → Eventos personalizados, o Embudos.
 */
export function marcarEvento(nombre: string): void {
  window.clarity?.('event', nombre);
}

/** Un solo listener cubre todos los enlaces a WhatsApp, presentes y futuros. */
export function escucharClicsWhatsapp(): void {
  document.addEventListener('click', (e) => {
    if ((e.target as Element | null)?.closest?.('a[href*="wa.me/"]')) {
      marcarEvento('contacto_whatsapp');
    }
  });
}
