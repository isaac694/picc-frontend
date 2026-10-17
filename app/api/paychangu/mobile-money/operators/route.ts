import { NextResponse } from 'next/server';
import {
  FALLBACK_MOBILE_MONEY_OPERATOR_REFS,
  type MobileMoneyOperator,
} from '@/lib/paychangu-mobile-operators';
import { createPaychanguService } from '@/lib/paychangu-node-service';

export const runtime = 'nodejs';

function fallbackPayload(): MobileMoneyOperator[] {
  return [
    {
      id: 1,
      name: 'TNM Mpamba',
      ref_id: FALLBACK_MOBILE_MONEY_OPERATOR_REFS.tnm,
      short_code: 'tnm',
    },
    {
      id: 2,
      name: 'Airtel Money',
      ref_id: FALLBACK_MOBILE_MONEY_OPERATOR_REFS.airtel,
      short_code: 'airtel',
    },
  ];
}

/** Uses the `paychangu` npm SDK — [Get Operators](https://developer.paychangu.com/reference/get-operator). */
export async function GET() {
  const service = createPaychanguService('main');

  if (service) {
    try {
      const payload = await service.listMobileMoneyOperators();
      if (payload && typeof payload === 'object') {
        return NextResponse.json(payload);
      }
    } catch {
      // fall through to static refs
    }
  }

  return NextResponse.json({
    status: 'success',
    message: 'Supported mobile money operators retrieved successfully.',
    data: fallbackPayload(),
  });
}
