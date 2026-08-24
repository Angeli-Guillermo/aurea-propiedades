import { useCallback, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';

import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';
import { cn } from '@/lib/cn';
import { modalOverlay, modalPanel } from '@/lib/motion';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** Texto accesible del diálogo (se enlaza con aria-labelledby). */
  label: string;
  children: React.ReactNode;
  className?: string;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

/**
 * Diálogo accesible: portal, Escape, click fuera, bloqueo de scroll,
 * foco inicial dentro del panel y foco atrapado en un ciclo.
 */
export function Modal({ open, onClose, label, children, className }: ModalProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useLockBodyScroll(open);

  // Escape + trampa de foco con Tab.
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusables = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.offsetParent !== null);
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    document.addEventListener('keydown', handleKeyDown);

    // Foco inicial en el panel (evita saltar directamente al primer enlace).
    const raf = requestAnimationFrame(() => panelRef.current?.focus());

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(raf);
      previouslyFocused.current?.focus?.();
    };
  }, [open, handleKeyDown]);

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="modal"
          className="fixed inset-0 z-100 flex items-end justify-center p-0 sm:items-center sm:p-6"
          variants={modalOverlay}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Fondo: cierra al hacer click, decorativo para lectores de pantalla */}
          <button
            type="button"
            aria-label="Cerrar"
            tabIndex={-1}
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-ink-950/70 backdrop-blur-sm"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            variants={modalPanel}
            className={cn(
              'relative max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-sand-50 shadow-lux outline-none',
              'sm:max-w-4xl sm:rounded-3xl',
              className,
            )}
          >
            <span id={titleId} className="sr-only">
              {label}
            </span>

            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar detalle"
              className={cn(
                'absolute right-4 top-4 z-10 grid size-10 place-items-center rounded-full',
                'bg-sand-50/90 text-ink-800 shadow-soft backdrop-blur-sm transition-colors duration-200',
                'hover:bg-white hover:text-ink-950',
              )}
            >
              <X className="size-5" aria-hidden />
            </button>

            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
