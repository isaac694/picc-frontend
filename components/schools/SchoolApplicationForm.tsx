'use client';

import { useState, type ReactNode } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';

/**
 * Sends a school's application form to the registrations register, filed under the chosen intake.
 * Fields are read by their `name`; put a SchoolIntakeGate inside for the intake picker and submit button.
 */
export default function SchoolApplicationForm({
  schoolKey,
  requiredFields,
  successTitle = 'Application received',
  children,
}: {
  schoolKey: string;
  requiredFields: string[];
  successTitle?: string;
  children: ReactNode;
}) {
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ id: string; intakeLabel?: string } | null>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    const form = event.currentTarget;
    const payload = Object.fromEntries(
      [...new FormData(form).entries()].map(([key, value]) => [key, String(value).trim()]),
    );
    if (requiredFields.some((key) => !payload[key])) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!payload.intakeId) {
      setError('Please choose an intake before submitting.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const response = await apiFetch(`/api/schools/${schoolKey}/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data?.error || 'Unable to submit your application. Please try again.');
        return;
      }
      form.reset();
      setDone({ id: data.id, intakeLabel: data.intakeLabel });
    } catch {
      setError('Unable to connect. Please try again in a moment.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="bg-white px-8 py-12 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
        <h4 className="mt-4 font-serif text-xl font-semibold text-[#0d1f3c]">{successTitle}</h4>
        <p className="mt-2 text-sm text-slate-600">
          {done.intakeLabel ? `You are registered for ${done.intakeLabel}. ` : ''}We will contact you with the next steps.
        </p>
        <p className="mt-3 text-xs text-slate-400">Reference: {done.id}</p>
        <button type="button" onClick={() => setDone(null)} className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-[#0d1f3c] underline">
          Submit another application
        </button>
      </div>
    );
  }

  return (
    <form className="bg-white px-8 py-8" onSubmit={submit} aria-busy={submitting}>
      {children}
      {error ? <p className="mt-4 text-sm font-medium text-red-600" role="alert">{error}</p> : null}
      {submitting ? <p className="mt-4 text-sm text-slate-500">Sending your application…</p> : null}
    </form>
  );
}
