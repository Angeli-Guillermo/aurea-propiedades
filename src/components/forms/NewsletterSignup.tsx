import { useId, useState } from 'react';
import { CheckCircle2, Loader2, Mail } from 'lucide-react';

import { cn } from '@/lib/cn';

type Status = 'idle' | 'loading' | 'success' | 'error';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Captura de newsletter: un solo campo, sin la maquinaria de React Hook Form + Zod
 * que sí se justifica en `ValuationForm` (múltiples campos, reglas de negocio).
 * Aquí alcanza con `useState` — YAGNI.
 *
 * Reutiliza `VITE_LEADS_API_URL` (mismo endpoint que el formulario principal,
 * con `intent: 'newsletter'`).
 */
export function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const inputId = useId();

  const endpoint = import.meta.env.VITE_LEADS_API_URL;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!EMAIL_PATTERN.test(email)) {
      setStatus('error');
      return;
    }
    if (!endpoint) {
      setStatus('error');
      return;
    }

    setStatus('loading');
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, intent: 'newsletter', source: 'footer' }),
      });
      if (!response.ok) throw new Error('request failed');
      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <p className="flex items-center gap-2 text-sm text-gold-300" role="status">
        <CheckCircle2 className="size-4 shrink-0" aria-hidden />
        Listo, te vamos a escribir cuando tengamos algo nuevo.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-start">
      <div className="flex-1">
        <label htmlFor={inputId} className="sr-only">
          Email para novedades
        </label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-sand-400"
            aria-hidden
          />
          <input
            id={inputId}
            type="email"
            required
            placeholder="tu@email.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (status === 'error') setStatus('idle');
            }}
            aria-invalid={status === 'error'}
            className={cn(
              'h-11 w-full rounded-full border bg-white/5 pl-10 pr-4 text-sm text-sand-50 placeholder:text-sand-400/70',
              'outline-none transition-colors duration-300 focus:border-gold-400/70',
              status === 'error' ? 'border-red-400/60' : 'border-sand-50/15',
            )}
          />
        </div>
        {status === 'error' ? (
          <p role="alert" className="mt-1.5 text-xs text-red-300">
            Poné un email válido para poder avisarte.
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={status === 'loading'}
        className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-gold-500 px-5 text-sm font-medium text-ink-950 transition-colors duration-300 hover:bg-gold-400 disabled:opacity-60"
      >
        {status === 'loading' ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          'Suscribirme'
        )}
      </button>
    </form>
  );
}
