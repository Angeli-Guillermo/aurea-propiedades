import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

// El formulario de contacto es el flujo que genera leads: si se rompe, se
// pierden consultas sin que nadie se entere. Estos tests NO envían nada.

test('el formulario de contacto se muestra', async ({ app, screen }) => {
  await app.open('/#contacto');

  await expect(screen.getByLabel('Nombre y apellidos')).toBeVisible();
  await expect(screen.getByLabel('Email')).toBeVisible();
  await expect(screen.getByRole('button', 'Solicitar tasación gratuita')).toBeVisible();
});

test('enviar vacío muestra los errores de validación y no envía', async ({ app, screen }) => {
  await app.open('/#contacto');

  await screen.getByRole('button', 'Solicitar tasación gratuita').click();

  await expect(screen.getByText('Necesitamos tu nombre para poder llamarte.')).toBeVisible();
  await expect(screen.getByText('Necesitamos tu consentimiento para poder contactarte.')).toBeVisible();
});

test('un email inválido se rechaza', async ({ app, screen }) => {
  await app.open('/#contacto');

  await screen.getByLabel('Email').fill('no-es-un-email');
  await screen.getByRole('button', 'Solicitar tasación gratuita').click();

  await expect(screen.getByText('Revisá el email: no parece una dirección válida.')).toBeVisible();
});
