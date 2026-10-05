import type { E2EConfig } from 'e2e';
import { web } from '@e2e-dev/web';

// Piloto: sin agentes ni modelo. Los tests usan solo locators y aserciones,
// así que no hace falta ninguna API key y el costo es cero.
export default {
  targets: [
    {
      engine: web(),
      app: {
        url: 'http://localhost:5173',
        command: { executable: 'npm', args: ['run', 'dev'], reuseExisting: true },
      },
    },
  ],
} satisfies E2EConfig;
