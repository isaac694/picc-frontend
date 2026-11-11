'use client';

import type { ReactNode } from 'react';
import { REFERENCE_HINTS } from '@/lib/store-receipt';
import { PAYMENT_METHODS } from '@/lib/store-documents';
import { cn } from '@/lib/utils';

export const inputClass = 'mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground';
export const labelClass = 'block text-xs font-medium text-muted-foreground';
export const todayInput = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const TONES = {
  sky: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200',
  green: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  red: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
  grey: 'bg-muted text-muted-foreground',
  violet: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200',
} as const;
export type Tone = keyof typeof TONES;

export function Pill({ tone, children, className }: { tone: Tone; children: ReactNode; className?: string }) {
  return <span className={cn('inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold', TONES[tone], className)}>{children}</span>;
}

/** Choice chips for how money was paid, plus the reference field every method except cash needs. */
export function PaymentMethodFields({
  method,
  reference,
  onMethod,
  onReference,
}: {
  method: string;
  reference: string;
  onMethod: (method: string) => void;
  onReference: (reference: string) => void;
}) {
  return (
    <>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Paid by">
        {PAYMENT_METHODS.map((entry) => (
          <button
            key={entry}
            type="button"
            role="radio"
            aria-checked={method === entry}
            onClick={() => onMethod(entry)}
            className={cn('rounded-full border px-3 py-1 text-xs font-medium', method === entry ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-foreground/70 hover:bg-muted')}
          >
            {entry}
          </button>
        ))}
      </div>
      {method !== 'Cash' ? (
        <label className={labelClass}>
          {REFERENCE_HINTS[method] || 'Payment reference'} (required)
          <input value={reference} onChange={(event) => onReference(event.target.value)} maxLength={120} required className={`${inputClass} font-mono`} />
        </label>
      ) : null}
    </>
  );
}

/** Label / value rows in a muted box, for the sums shown before saving. */
export function SumRows({ rows }: { rows: Array<[ReactNode, ReactNode, ('strong' | 'muted')?]> }) {
  return (
    <dl className="space-y-1 rounded-lg bg-muted/50 p-3 text-sm">
      {rows.map(([label, value, style], index) => (
        <div key={index} className={cn('flex justify-between gap-3', style === 'strong' && 'border-t border-border pt-1 font-semibold', style === 'muted' && 'text-muted-foreground')}>
          <dt>{label}</dt>
          <dd className="tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
