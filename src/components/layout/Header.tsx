import { useState } from 'react';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react';
import { Menu, Phone, X } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { HouseMark } from '@/components/ui/HouseMark';
import { NAV_LINKS, SITE } from '@/data/site';
import { cn } from '@/lib/cn';
import { EASE_OUT_EXPO } from '@/lib/motion';
import { scrollToId } from '@/lib/scroll';

/** A partir de este scroll el header pasa de transparente a sólido. */
const SOLID_AT = 40;

export function Header() {
  const { scrollY } = useScroll();
  const [isSolid, setIsSolid] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setIsSolid(latest > SOLID_AT);
  });

  const go = (id: string) => {
    setIsMenuOpen(false);
    // Esperamos al cierre del menú para que el cálculo de offset sea correcto.
    requestAnimationFrame(() => scrollToId(id));
  };

  const solid = isSolid || isMenuOpen;

  return (
    <motion.header
      id="site-header"
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: EASE_OUT_EXPO, delay: 0.15 }}
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-colors duration-500 ease-out-quart',
        solid
          ? 'border-b border-ink-900/10 bg-sand-50/85 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      <Container size="wide" className="flex h-18 items-center justify-between gap-6 lg:h-20">
        {/* Marca */}
        <a
          href="#inicio"
          onClick={(event) => {
            event.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="group flex min-w-0 items-center gap-3"
        >
          <HouseMark
            variant={solid ? 'light' : 'dark'}
            className="size-9 shrink-0 transition-opacity duration-500 sm:size-10"
          />
          <span className="flex min-w-0 flex-col leading-none">
            <span
              className={cn(
                'truncate font-display text-base font-semibold tracking-[0.04em] transition-colors duration-500 sm:text-lg',
                solid ? 'text-ink-900' : 'text-sand-50',
              )}
            >
              {SITE.name}
            </span>
            <span
              className={cn(
                'mt-1 hidden truncate text-[0.5625rem] uppercase tracking-[0.2em] transition-colors duration-500 sm:block',
                solid ? 'text-gold-600' : 'text-gold-300',
              )}
            >
              {SITE.tagline}
            </span>
          </span>
        </a>

        {/* Navegación de escritorio */}
        <nav aria-label="Navegación principal" className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              onClick={(event) => {
                event.preventDefault();
                go(link.id);
              }}
              className={cn(
                'relative rounded-full px-4 py-2 text-sm transition-colors duration-300',
                solid
                  ? 'text-ink-700 hover:bg-ink-900/[0.05] hover:text-ink-950'
                  : 'text-sand-100/85 hover:bg-white/10 hover:text-white',
              )}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Acciones */}
        <div className="flex items-center gap-2">
          <a
            href={SITE.mauroPhoneHref}
            className={cn(
              'hidden items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors duration-300 md:inline-flex',
              solid ? 'text-ink-700 hover:text-ink-950' : 'text-sand-100/85 hover:text-white',
            )}
          >
            <Phone className="size-4" aria-hidden />
            {SITE.mauroPhone}
          </a>

          <Button
            variant={solid ? 'primary' : 'light'}
            size="sm"
            onClick={() => go('contacto')}
            className="hidden sm:inline-flex"
          >
            Quiero vender
          </Button>

          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-expanded={isMenuOpen}
            aria-controls="menu-movil"
            aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            className={cn(
              'grid size-10 place-items-center rounded-full transition-colors duration-300 lg:hidden',
              solid ? 'text-ink-900 hover:bg-ink-900/[0.06]' : 'text-sand-50 hover:bg-white/10',
            )}
          >
            {isMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </Container>

      {/* Menú móvil */}
      <AnimatePresence initial={false}>
        {isMenuOpen ? (
          <motion.div
            id="menu-movil"
            key="mobile-menu"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
            className="border-t border-ink-900/10 bg-sand-50/95 backdrop-blur-xl lg:hidden"
          >
            <Container size="wide" className="flex flex-col gap-1 py-5">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  onClick={(event) => {
                    event.preventDefault();
                    go(link.id);
                  }}
                  className="rounded-xl px-3 py-3 text-[0.9375rem] text-ink-800 transition-colors hover:bg-ink-900/[0.05]"
                >
                  {link.label}
                </a>
              ))}
              <Button size="md" className="mt-3 w-full" onClick={() => go('contacto')}>
                Quiero vender
              </Button>
              <a
                href={SITE.mauroPhoneHref}
                className="mt-1 inline-flex items-center justify-center gap-2 py-2 text-sm text-ink-600"
              >
                <Phone className="size-4" aria-hidden />
                {SITE.mauroPhone}
              </a>
            </Container>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.header>
  );
}
