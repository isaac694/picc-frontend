'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';

export type EventCouponQuote = {
  code: string;
  label: string;
  subtotal: number;
  discount: number;
  amount: number;
  currency: string;
};

type EventCouponFieldProps = {
  eventId: string;
  ticketKey?: string;
  quantity: number;
  applied: EventCouponQuote | null;
  onApplied: (quote: EventCouponQuote | null) => void;
  tone?: 'light' | 'dark';
};

export default function EventCouponField({
  eventId,
  ticketKey,
  quantity,
  applied,
  onApplied,
  tone = 'light',
}: EventCouponFieldProps) {
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const dark = tone === 'dark';

  const applyCoupon = async () => {
    const nextCode = code.trim();
    if (!nextCode) {
      setError('Enter a coupon code.');
      onApplied(null);
      return;
    }
    setChecking(true);
    setError('');
    try {
      const response = await apiFetch(`/api/events/${eventId}/coupon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: nextCode, ticketKey, quantity }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        onApplied(null);
        setError(data.error || 'This coupon cannot be used.');
        return;
      }
      onApplied({
        code: String(data.code || nextCode),
        label: String(data.label || 'Coupon'),
        subtotal: Number(data.subtotal || 0),
        discount: Number(data.discount || 0),
        amount: Number(data.amount || 0),
        currency: String(data.currency || 'MWK'),
      });
      setCode(String(data.code || nextCode));
    } catch {
      onApplied(null);
      setError('Unable to check that coupon.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className={`grid gap-1 text-sm ${dark ? 'text-white' : 'text-foreground'}`}>
        <span className={dark ? 'text-white/80' : 'text-foreground/80'}>Coupon code</span>
        <span className="flex gap-2">
          <input
            value={applied?.code || code}
            onChange={(event) => {
              setCode(event.target.value.toUpperCase());
              setError('');
              if (applied) onApplied(null);
            }}
            placeholder="Enter code"
            className={dark
              ? 'min-w-0 flex-1 rounded-xl border border-white/20 bg-white px-3 py-2 text-sm uppercase text-[#10233f]'
              : 'min-w-0 flex-1 rounded-md border border-border px-3 py-2 text-sm uppercase'}
          />
          <button
            type="button"
            onClick={() => void applyCoupon()}
            disabled={checking}
            className={dark
              ? 'rounded-xl bg-white px-3 py-2 text-sm font-medium text-[#10233f] disabled:opacity-60'
              : 'rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground disabled:opacity-60'}
          >
            {checking ? 'Checking...' : 'Apply'}
          </button>
        </span>
      </label>
      {applied ? (
        <p className={`text-sm ${dark ? 'text-emerald-200' : 'text-emerald-700'}`}>
          {applied.label} applied. {applied.currency} {applied.discount.toLocaleString('en-US')} off
          {applied.amount <= 0 ? '. This coupon covers the full price.' : '.'}
        </p>
      ) : null}
      {error ? <p className={`text-sm ${dark ? 'text-red-200' : 'text-red-600'}`}>{error}</p> : null}
    </div>
  );
}
