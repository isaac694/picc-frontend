import { NextResponse } from 'next/server';

type PaychanguAccount = 'main' | 'youth';

const getAccountConfig = (account: PaychanguAccount) => {
  if (account === 'youth') {
    return {
      secretKey: process.env.PAYCHANGU_SECRET_KEY_YOUTH,
      airtelRefId: process.env.PAYCHANGU_AIRTEL_REF_ID,
      mpambaRefId: process.env.PAYCHANGU_MPAMBA_REF_ID,
    };
  }

  return {
    secretKey: process.env.PAYCHANGU_SECRET_KEY_MAIN || process.env.PAYCHANGU_SECRET_KEY,
    airtelRefId: process.env.PAYCHANGU_AIRTEL_REF_ID_MAIN || process.env.PAYCHANGU_AIRTEL_REF_ID,
    mpambaRefId: process.env.PAYCHANGU_MPAMBA_REF_ID_MAIN || process.env.PAYCHANGU_MPAMBA_REF_ID,
  };
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const account: PaychanguAccount = body.account === 'youth' ? 'youth' : 'main';
    const { secretKey, airtelRefId, mpambaRefId } = getAccountConfig(account);

    if (!secretKey) {
      return NextResponse.json({ error: 'PayChangu secret key is not configured.' }, { status: 500 });
    }

    const { amount, firstName, lastName, phone, paymentMethod, operatorRefId, givingId } = body;
    if (!amount || !firstName || !lastName || !phone || !givingId) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const mappedRefId =
      paymentMethod === 'airtel'
        ? airtelRefId
        : paymentMethod === 'mpamba'
          ? mpambaRefId
          : operatorRefId;

    if (!mappedRefId && (paymentMethod === 'airtel' || paymentMethod === 'mpamba')) {
      return NextResponse.json({ error: 'Missing mobile money operator reference ID.' }, { status: 400 });
    }

    const chargeId = `PICC-${account.toUpperCase()}-${givingId}-${crypto.randomUUID()}`;
    const response = await fetch('https://api.paychangu.com/mobile-money/payments/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secretKey}`,
      },
      body: JSON.stringify({
        mobile_money_operator_ref_id: mappedRefId,
        mobile: phone,
        amount,
        charge_id: chargeId,
        first_name: firstName,
        last_name: lastName,
      }),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      return NextResponse.json(
        { error: data?.message || 'PayChangu request failed.', data },
        { status: response.status },
      );
    }

    return NextResponse.json({ data, chargeId });
  } catch {
    return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
  }
}
