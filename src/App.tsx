import { MotionConfig } from 'motion/react';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { WhatsAppButton } from '@/components/layout/WhatsAppButton';
import { About } from '@/components/sections/About';
import { ContactSection } from '@/components/sections/ContactSection';
import { FeaturedProperties } from '@/components/sections/FeaturedProperties';
import { Hero } from '@/components/sections/Hero';
import { MapSection } from '@/components/sections/MapSection';
import { Services } from '@/components/sections/Services';
import { Testimonials } from '@/components/sections/Testimonials';
import { TrustBar } from '@/components/sections/TrustBar';

/**
 * One-page de la inmobiliaria.
 *
 * `MotionConfig reducedMotion="user"` desactiva automáticamente cualquier
 * animación de transform/layout cuando el sistema pide movimiento reducido,
 * así que ningún componente necesita comprobarlo por su cuenta.
 */
export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      {/* Salto de accesibilidad al contenido principal */}
      <a
        href="#propiedades"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-200 focus:rounded-full focus:bg-ink-900 focus:px-5 focus:py-3 focus:text-sm focus:text-sand-50"
      >
        Saltar al contenido
      </a>

      <Header />

      <main>
        <Hero />
        <TrustBar />
        <FeaturedProperties />
        <Services />
        <About />
        <Testimonials />
        <MapSection />
        <ContactSection />
      </main>

      <Footer />
      <WhatsAppButton />
    </MotionConfig>
  );
}
