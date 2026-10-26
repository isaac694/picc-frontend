import { NextResponse } from 'next/server';
import { PAYCHANGU_API_ORIGIN, resolvePaychanguPublicKey } from '@/lib/paychangu-server';

export const runtime = 'nodejs';

function errorText(data: unknown): string {
  if (!data || typeof data !== 'object') return 'PayChangu could not start checkout.';
  const record = data as Record<string, unknown>;
  if (typeof record.message === 'string' && record.message.trim()) return record.message.trim();
  if (record.message && typeof record.message === 'object') {
    const parts = Object.values(record.message as Record<string, unknown>)
      .flat()
      .map((item) => String(item || '').trim())
      .filter(Boolean);
    if (parts.length) return parts.join(' ');
  }
  if (typeof record.error === 'string' && record.error.trim()) return record.error.trim();
  return 'PayChangu could not start checkout.';
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const publicKey = resolvePaychanguPublicKey(body.account);
  if (!publicKey) {
    return NextResponse.json(
      { error: 'PayChangu public key is not configured.' },
      { status: 500 },
    );
  }

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Enter a payment amount greater than 0.' }, { status: 400 });
  }

  const payload = {
    tx_ref: body.tx_ref,
    amount,
    currency: body.currency || 'MWK',
    callback_url: body.callback_url,
    return_url: body.return_url,
    customer: body.customer,
    customization: body.customization,
    meta: body.meta,
  };

  try {
    const response = await fetch(`${PAYCHANGU_API_ORIGIN}/popup_transfer`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${publicKey}`,
      },
      body: JSON.stringify(payload),
    });
    const data = (await response.json().catch(() => null)) as {
      data?: { checkout_url?: string };
      message?: unknown;
    } | null;
    const checkoutUrl = data?.data?.checkout_url;
    if (!response.ok || typeof checkoutUrl !== 'string' || !checkoutUrl) {
      return NextResponse.json({ error: errorText(data) }, { status: response.ok ? 502 : response.status });
    }
    return NextResponse.json({ checkoutUrl });
  } catch {
    return NextResponse.json({ error: 'Unable to reach PayChangu.' }, { status: 502 });
  }
}
