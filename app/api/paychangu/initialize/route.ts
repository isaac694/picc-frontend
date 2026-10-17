import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { createPaychanguService } from '@/lib/paychangu-node-service';
import {
  resolveBackendApiBaseUrl,
  resolveMobileMoneyOperatorRefId,
  resolvePaychanguSecretKey,
} from '@/lib/paychangu-server';

export const runtime = 'nodejs';

function isMobileMoneyMethod(paymentMethod: unknown): paymentMethod is 'airtel' | 'mpamba' {
  return paymentMethod === 'airtel' || paymentMethod === 'mpamba';
}

function appOrigin(request: Request): string {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  if (host) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '') || 'https://piccworldwide.org';
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const paymentMethod = body.paymentMethod;
  const account = body.account;
  const service = createPaychanguService(account);

  if (isMobileMoneyMethod(paymentMethod)) {
    const amount = body.amount;
    const firstName = body.firstName;
    const lastName = body.lastName;
    const phone = body.phone;
    const givingId = body.givingId;

    if (!amount || !firstName || !lastName || !phone || !givingId) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const operatorRefId = resolveMobileMoneyOperatorRefId(body);
    if (!operatorRefId) {
      return NextResponse.json(
        { error: 'Missing mobile money operator reference ID.' },
        { status: 400 },
      );
    }

    if (!service) {
      return NextResponse.json(
        {
          error:
            'PayChangu secret key is not configured. Set PAYCHANGU_SECRET_KEY_MAIN on the web app.',
        },
        { status: 500 },
      );
    }

    const chargeId = `PICC-${givingId}-${randomUUID()}`;

    try {
      const data = await service.initializeMobileMoneyPayment({
        mobile: String(phone),
        amount: Number(amount),
        mobile_money_operator_ref_id: operatorRefId,
        charge_id: chargeId,
        first_name: String(firstName),
        last_name: String(lastName),
      });
      return NextResponse.json({ data, chargeId });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'PayChangu request failed.';
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  if (paymentMethod === 'bank' || paymentMethod === 'card') {
    const amount = body.amount;
    const firstName = body.firstName;
    const lastName = body.lastName;
    const email = body.email;
    const givingId = body.givingId;
    const reason = typeof body.reason === 'string' ? body.reason : 'Payment';

    if (!amount || !firstName || !lastName || !email || !givingId) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    if (!service) {
      return NextResponse.json(
        { error: 'PayChangu secret key is not configured.' },
        { status: 500 },
      );
    }

    const origin = appOrigin(request);
    const txRef = `PICC-${givingId}-${randomUUID()}`;

    try {
      const payload = await service.initiatePayment({
        amount: Number(amount),
        email: String(email),
        first_name: String(firstName),
        last_name: String(lastName),
        description: reason,
        callbackUrl: `${origin}/give?paychangu=callback`,
        returnUrl: `${origin}/give?paychangu=return`,
      });

      const record = payload as Record<string, unknown>;
      const nested = record.data as Record<string, unknown> | undefined;
      const checkoutUrl =
        (typeof nested?.checkout_url === 'string' && nested.checkout_url) ||
        (typeof record.checkout_url === 'string' && record.checkout_url) ||
        null;

      return NextResponse.json({
        checkoutUrl,
        txRef,
        bankTransfer: record.bankTransfer || nested?.bankTransfer || null,
        data: payload,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'PayChangu request failed.';
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  if (!resolvePaychanguSecretKey(account)) {
    const backendBase = resolveBackendApiBaseUrl();
    try {
      const proxyResponse = await fetch(`${backendBase}/api/paychangu/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
      });
      const proxyData = await proxyResponse.json().catch(() => ({}));
      return NextResponse.json(proxyData, { status: proxyResponse.status });
    } catch {
      return NextResponse.json({ error: 'Unable to reach payment server.' }, { status: 503 });
    }
  }

  return NextResponse.json({ error: 'Unsupported payment method.' }, { status: 400 });
}
