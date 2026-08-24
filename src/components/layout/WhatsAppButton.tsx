import { motion } from 'motion/react';

import { SITE, whatsappUrl } from '@/data/site';
import { EASE_OUT_EXPO } from '@/lib/motion';

/**
 * CTA flotante de WhatsApp.
 * Aparece con retardo para no competir con el hero en el primer pintado.
 */
export function WhatsAppButton() {
  return (
    <motion.a
      href={whatsappUrl()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Escribir por WhatsApp a ${SITE.legalName}`}
      initial={{ opacity: 0, scale: 0.8, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT_EXPO, delay: 1.4 }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      className="group fixed bottom-5 right-5 z-40 flex items-center gap-3 rounded-full bg-[#25D366] py-3 pl-3.5 pr-4 text-ink-950 shadow-lux sm:bottom-7 sm:right-7"
    >
      {/* Logo oficial simplificado */}
      <svg viewBox="0 0 24 24" className="size-6 shrink-0 fill-white" aria-hidden>
        <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47s1.06 2.86 1.21 3.06c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.71 2-1.4.25-.69.25-1.28.17-1.4-.07-.13-.27-.2-.57-.35Z" />
        <path d="M12.04 2C6.6 2 2.18 6.42 2.18 11.86c0 1.74.46 3.44 1.32 4.94L2 22l5.34-1.4a9.84 9.84 0 0 0 4.7 1.2h.01c5.43 0 9.85-4.42 9.85-9.86A9.79 9.79 0 0 0 19.02 4.9 9.79 9.79 0 0 0 12.04 2Zm0 17.98h-.01a8.2 8.2 0 0 1-4.17-1.14l-.3-.18-3.1.81.83-3.02-.2-.31a8.13 8.13 0 0 1-1.25-4.34c0-4.52 3.68-8.19 8.2-8.19a8.15 8.15 0 0 1 8.19 8.2c0 4.52-3.68 8.17-8.19 8.17Z" />
      </svg>

      <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium text-white opacity-0 transition-all duration-400 ease-out-expo group-hover:max-w-40 group-hover:opacity-100">
        Hablemos
      </span>
    </motion.a>
  );
}
