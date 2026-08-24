import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, Loader2, Send, TriangleAlert } from 'lucide-react';

import {
  LEAD_INTENTS,
  LEAD_INTENT_LABELS,
  leadSchema,
  submitLead,
  type LeadFormInput,
  type LeadPayload,
} from '@/api/leads';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { EASE_OUT_EXPO } from '@/lib/motion';

const FIELD_BASE =
  'w-full rounded-xl border bg-white px-4 py-3.5 text-[0.9375rem] text-ink-900 placeholder:text-ink-400 ' +
  'transition-colors duration-300 outline-none focus:border-gold-500';

const DEFAULT_VALUES: LeadFormInput = {
  name: '',
  email: '',
  phone: '',
  intent: 'valorar',
  location: '',
  message: '',
  consent: false,
};

/**
 * Formulario de contacto / valoración.
 *
 * React Hook Form gestiona el estado del formulario, Zod la validación
 * (mismo esquema que valida el payload en `src/api/leads.ts`) y TanStack
 * Query el ciclo de vida del envío (idle → loading → success | error).
 */
export function ValuationForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitted },
  } = useForm<LeadFormInput, unknown, LeadPayload>({
    resolver: zodResolver(leadSchema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onBlur',
  });

  const mutation = useMutation({
    mutationFn: submitLead,
    onSuccess: () => reset(DEFAULT_VALUES),
  });

  // Estado de éxito: sustituye al formulario para cerrar el bucle de conversión.
  if (mutation.isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
        className="flex flex-col items-center rounded-2xl border border-ink-900/10 bg-white px-8 py-16 text-center"
        role="status"
      >
        <span className="grid size-14 place-items-center rounded-full bg-gold-100 text-gold-600">
          <CheckCircle2 className="size-7" aria-hidden />
        </span>
        <h3 className="mt-6 font-display text-2xl font-light text-ink-900">Solicitud recibida</h3>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-600">
          Te llamamos en menos de 24 horas laborables. Si preferís adelantar algo, respondé al email
          de confirmación que acabás de recibir.
        </p>
        <Button variant="outline" className="mt-8" onClick={() => mutation.reset()}>
          Enviar otra consulta
        </Button>
      </motion.div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
      className="rounded-2xl border border-ink-900/10 bg-white p-6 shadow-soft sm:p-9"
    >
      {/* Intención — decide el resto de la conversación comercial */}
      <fieldset>
        <legend className="text-[0.6875rem] uppercase tracking-[0.2em] text-ink-400">
          ¿Qué necesitás?
        </legend>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {LEAD_INTENTS.map((intent) => (
            <label
              key={intent}
              className={cn(
                'cursor-pointer rounded-xl border border-ink-900/12 px-4 py-3 text-center text-sm text-ink-700',
                'transition-colors duration-300 hover:border-ink-900/30',
                'has-[:checked]:border-ink-900 has-[:checked]:bg-ink-900 has-[:checked]:text-sand-50',
              )}
            >
              <input type="radio" value={intent} className="sr-only" {...register('intent')} />
              {LEAD_INTENT_LABELS[intent]}
            </label>
          ))}
        </div>
        <FieldError message={errors.intent?.message} />
      </fieldset>

      {/* Datos de contacto */}
      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <Field label="Nombre y apellidos" htmlFor="name" error={errors.name?.message}>
          <input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Elena Martín"
            aria-invalid={Boolean(errors.name)}
            className={cn(FIELD_BASE, errors.name ? 'border-red-400' : 'border-ink-900/12')}
            {...register('name')}
          />
        </Field>

        <Field label="Teléfono" htmlFor="phone" error={errors.phone?.message}>
          <input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+34 600 00 00 00"
            aria-invalid={Boolean(errors.phone)}
            className={cn(FIELD_BASE, errors.phone ? 'border-red-400' : 'border-ink-900/12')}
            {...register('phone')}
          />
        </Field>

        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="elena@email.com"
            aria-invalid={Boolean(errors.email)}
            className={cn(FIELD_BASE, errors.email ? 'border-red-400' : 'border-ink-900/12')}
            {...register('email')}
          />
        </Field>

        <Field
          label="Zona o dirección"
          htmlFor="location"
          error={errors.location?.message}
        >
          <input
            id="location"
            type="text"
            autoComplete="address-level3"
            placeholder="Belgrano, calle Juramento"
            aria-invalid={Boolean(errors.location)}
            className={cn(FIELD_BASE, errors.location ? 'border-red-400' : 'border-ink-900/12')}
            {...register('location')}
          />
        </Field>
      </div>

      <div className="mt-5">
        <Field
          label="Contanos algo más"
          htmlFor="message"
          optional
          error={errors.message?.message}
        >
          <textarea
            id="message"
            rows={4}
            placeholder="Superficie aproximada, estado, plazos que manejás…"
            aria-invalid={Boolean(errors.message)}
            className={cn(
              FIELD_BASE,
              'resize-y',
              errors.message ? 'border-red-400' : 'border-ink-900/12',
            )}
            {...register('message')}
          />
        </Field>
      </div>

      {/* Consentimiento */}
      <label className="mt-6 flex cursor-pointer items-start gap-3 text-[0.8125rem] leading-relaxed text-ink-600">
        <input
          type="checkbox"
          className="mt-0.5 size-4 shrink-0 rounded border-ink-900/25 accent-ink-900"
          aria-invalid={Boolean(errors.consent)}
          {...register('consent')}
        />
        <span>
          Acepto que se traten mis datos para responder a esta consulta y he leído la{' '}
          <a
            href="/privacidad.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold-600 underline underline-offset-2"
          >
            política de privacidad
          </a>
          .
        </span>
      </label>
      <FieldError message={errors.consent?.message} />

      {/* Error de envío */}
      <AnimatePresence>
        {mutation.isError ? (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            role="alert"
            className="mt-5 flex items-start gap-2.5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            {mutation.error.message}
          </motion.p>
        ) : null}
      </AnimatePresence>

      <Button
        type="submit"
        size="lg"
        disabled={mutation.isPending}
        className="mt-7 w-full sm:w-auto"
      >
        {mutation.isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Enviando…
          </>
        ) : (
          <>
            <Send className="size-4" aria-hidden />
            Solicitar tasación gratuita
          </>
        )}
      </Button>

      <p aria-live="polite" className="sr-only">
        {isSubmitted && Object.keys(errors).length > 0
          ? 'El formulario contiene errores. Revisá los campos marcados.'
          : ''}
      </p>

      <p className="mt-4 text-xs text-ink-400">
        Respondemos en menos de 24 h laborables. Nunca compartimos tus datos con terceros.
      </p>
    </form>
  );
}

/** Envoltorio de campo: etiqueta, contenido y mensaje de error. */
function Field({
  label,
  htmlFor,
  error,
  optional = false,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 flex items-baseline justify-between text-[0.8125rem] font-medium text-ink-700"
      >
        {label}
        {optional ? <span className="text-xs font-normal text-ink-400">Opcional</span> : null}
      </label>
      {children}
      <FieldError message={error} />
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1.5 text-[0.8125rem] text-red-600">
      {message}
    </p>
  );
}
