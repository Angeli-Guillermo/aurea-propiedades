import { Instagram, Mail, Phone } from 'lucide-react';

import { NewsletterSignup } from '@/components/forms/NewsletterSignup';
import { Container } from '@/components/ui/Container';
import { HouseMark } from '@/components/ui/HouseMark';
import { NAV_LINKS, SITE } from '@/data/site';
import { scrollToId } from '@/lib/scroll';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="grain relative overflow-hidden bg-ink-950 text-sand-200">
      <Container size="wide" className="relative z-10 py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr]">
          {/* Marca */}
          <div className="max-w-sm">
            <div className="flex items-center gap-3">
              <HouseMark variant="dark" className="size-10 shrink-0" />
              <div>
                <p className="font-display text-xl leading-tight text-sand-50 sm:text-2xl">
                  {SITE.name}
                </p>
                <p className="mt-1 text-[0.625rem] uppercase tracking-[0.24em] text-gold-400">
                  {SITE.tagline}
                </p>
              </div>
            </div>
            <p className="mt-6 text-sm leading-relaxed text-sand-300/70">
              Trabajamos por encargo y en exclusiva. Menos operaciones al año, cada una atendida
              por la persona con la que hablaste el primer día.
            </p>

            <div className="mt-7 flex gap-3">
              <a
                href={SITE.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="grid size-10 place-items-center rounded-full border border-sand-50/15 text-sand-200 transition-colors duration-300 hover:border-gold-400/60 hover:text-gold-300"
              >
                <Instagram className="size-4" aria-hidden />
              </a>
            </div>
          </div>

          {/* Navegación */}
          <nav aria-label="Navegación del pie">
            <p className="text-[0.6875rem] uppercase tracking-[0.24em] text-sand-400/70">
              Explorar
            </p>
            <ul className="mt-5 space-y-3 text-sm">
              {[...NAV_LINKS, { id: 'contacto', label: 'Contacto' }].map((link) => (
                <li key={link.id}>
                  <a
                    href={`#${link.id}`}
                    onClick={(event) => {
                      event.preventDefault();
                      scrollToId(link.id);
                    }}
                    className="text-sand-300/75 transition-colors duration-300 hover:text-sand-50"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contacto */}
          <div>
            <p className="text-[0.6875rem] uppercase tracking-[0.24em] text-sand-400/70">
              Oficina
            </p>
            <ul className="mt-5 space-y-4 text-sm text-sand-300/75">
              <li className="flex gap-3">
                <Phone className="mt-0.5 size-4 shrink-0 text-gold-400" aria-hidden />
                <a href={SITE.mauroPhoneHref} className="transition-colors hover:text-sand-50">
                  {SITE.mauroPhone}
                </a>
              </li>
              <li className="flex gap-3">
                <Mail className="mt-0.5 size-4 shrink-0 text-gold-400" aria-hidden />
                <a
                  href={`mailto:${SITE.email}`}
                  className="break-all transition-colors hover:text-sand-50"
                >
                  {SITE.email}
                </a>
              </li>
              <li className="flex gap-3">
                <Mail className="mt-0.5 size-4 shrink-0 text-gold-400" aria-hidden />
                <a
                  href={`mailto:${SITE.mauroEmail}`}
                  className="break-all transition-colors hover:text-sand-50"
                >
                  {SITE.mauroEmail}
                </a>
              </li>
              <li className="pl-7 text-sand-400/70">{SITE.schedule}</li>
            </ul>
          </div>
        </div>

        {/* Newsletter + zonas de cobertura */}
        <div className="mt-14 grid gap-10 border-t border-sand-50/10 pt-10 lg:grid-cols-[1fr_1.2fr] lg:items-start lg:gap-16">
          <div>
            <p className="text-[0.6875rem] uppercase tracking-[0.24em] text-sand-400/70">
              Novedades
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-sand-300/70">
              Recibí las nuevas incorporaciones a la cartera antes de que salgan a la calle.
            </p>
            <div className="mt-4 max-w-sm">
              <NewsletterSignup />
            </div>
          </div>

          <div>
            <p className="text-[0.6875rem] uppercase tracking-[0.24em] text-sand-400/70">
              Zonas donde operamos
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {SITE.coverageAreas.map((area) => (
                <li
                  key={area}
                  className="rounded-full border border-sand-50/12 px-3.5 py-1.5 text-xs text-sand-300/80"
                >
                  {area}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-sand-50/10 pt-7 text-xs text-sand-400/70 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {SITE.legalName}. Todos los derechos reservados.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <a href="/aviso-legal.html" className="transition-colors hover:text-sand-200">
              Aviso legal
            </a>
            <a href="/privacidad.html" className="transition-colors hover:text-sand-200">
              Privacidad
            </a>
            <a href="/cookies.html" className="transition-colors hover:text-sand-200">
              Cookies
            </a>
            {/* Portfolio temporal en Vercel — reemplazar por el dominio propio cuando esté registrado */}
            <a
              href="https://eltanodesign.com.ar/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sand-400/50 transition-colors hover:text-sand-200"
            >
              Diseñado por El Tano Design
            </a>
          </div>
        </div>
      </Container>

      {/* Halo dorado decorativo */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-40 size-[28rem] rounded-full bg-gold-500/10 blur-3xl"
      />
    </footer>
  );
}
