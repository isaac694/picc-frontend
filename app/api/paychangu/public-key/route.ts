import { NextResponse } from 'next/server';
import { resolvePaychanguPublicKey } from '@/lib/paychangu-server';

export const runtime = 'nodejs';

/** Supplies PayChangu publishable key to the browser popup (safe to expose). */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const account = searchParams.get('account') || 'main';
  const publicKey = resolvePaychanguPublicKey(account);

  if (!publicKey) {
    return NextResponse.json(
      {
        error:
          'PayChangu public key is not configured. Add PAYCHANGU_PUBLIC_KEY_MAIN or NEXT_PUBLIC_PAYCHANGU_PUBLIC_KEY_MAIN to .env (from PayChangu dashboard — not the secret key).',
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ publicKey, account });
}
