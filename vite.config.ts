import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Tailwind CSS v4 se integra como plugin de Vite (sin postcss.config ni tailwind.config).
    tailwindcss(),
  ],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  build: {
    target: 'es2022',
    cssCodeSplit: true,
    // Aviso a partir de 400 kB para vigilar el presupuesto de bundle.
    chunkSizeWarningLimit: 400,
    rollupOptions: {
      output: {
        // Separamos vendors pesados para que el chunk inicial siga siendo pequeño.
        // `vendor-maps` y `vendor-forms` sólo los referencian módulos cargados
        // con React.lazy, así que Rollup los sirve bajo demanda.
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react/jsx-runtime', 'react-dom/client'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-motion': ['motion'],
          'vendor-maps': ['@react-google-maps/api'],
          'vendor-forms': ['react-hook-form', '@hookform/resolvers/zod'],
        },
      },
    },
  },
});
