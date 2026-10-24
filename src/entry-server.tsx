import { StrictMode } from 'react';
import { prerender } from 'react-dom/static';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import App from '@/App';

/**
 * Render de la home a HTML para el pre-render de build (scripts/prerender.mjs).
 * No se incluye en el bundle del navegador: solo lo carga Vite en modo SSR.
 *
 * El árbol tiene que ser idéntico al de main.tsx (mismos providers) para que
 * React pueda hidratar sin diferencias. `<Analytics />` no se renderiza acá
 * porque no produce DOM.
 *
 * Se usa `prerender` (React 19) y no `renderToString`: espera a los componentes
 * que cargan bajo demanda (React.lazy: formulario y mapa). Con `renderToString`
 * esas partes quedaban sin renderizar y el navegador registraba el error #419.
 */
export async function render(): Promise<string> {
  const queryClient = new QueryClient();

  const { prelude } = await prerender(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>,
  );

  return new Response(prelude).text();
}
