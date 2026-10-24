import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Analytics } from '@vercel/analytics/react';

import App from '@/App';
import '@/index.css';

/**
 * Cliente de TanStack Query compartido por toda la app.
 * Con `staleTime` de 5 minutos, "Propiedades destacadas" y el mapa
 * comparten una única petición durante toda la visita.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const container = document.getElementById('root');
if (!container) {
  throw new Error('No se ha encontrado el elemento #root en index.html');
}

const app = (
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Analytics />
    </QueryClientProvider>
  </StrictMode>
);

// En producción el HTML viene pre-renderizado (scripts/prerender.mjs): se hidrata.
// En desarrollo (`vite dev`) el #root está vacío y se renderiza desde cero.
if (container.hasChildNodes()) {
  hydrateRoot(container, app);
} else {
  createRoot(container).render(app);
}
