import axios, { type AxiosInstance } from 'axios';
import { resolvePaychanguSecretKey } from '@/lib/paychangu-server';

export type MobileMoneyInitializeParams = {
  mobile: string;
  amount: number;
  mobile_money_operator_ref_id: string;
  charge_id: string;
  first_name: string;
  last_name: string;
};

export type PiccPaychanguService = {
  initiatePayment: (options: {
    amount: number;
    email: string;
    first_name: string;
    last_name: string;
    description: string;
    callbackUrl: string;
    returnUrl: string;
  }) => Promise<unknown>;
  verifyPayment: (txRef: string) => Promise<unknown>;
  listMobileMoneyOperators: () => Promise<unknown>;
  initializeMobileMoneyPayment: (params: MobileMoneyInitializeParams) => Promise<unknown>;
};

function createHttp(apiKey: string): AxiosInstance {
  return axios.create({
    baseURL: 'https://api.paychangu.com',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Server PayChangu client — same endpoints as the `paychangu` npm package
 * (avoids bundling that package's broken uuid dependency in Next.js).
 */
export function createPaychanguService(account?: unknown): PiccPaychanguService | null {
  const apiKey = resolvePaychanguSecretKey(account);
  if (!apiKey) return null;

  const http = createHttp(apiKey);

  return {
    initiatePayment: async (options) => {
      const response = await http.post('/payment', {
        amount: options.amount,
        email: options.email,
        first_name: options.first_name,
        last_name: options.last_name,
        description: options.description,
        callback_url: options.callbackUrl,
        return_url: options.returnUrl,
        currency: 'MWK',
      });
      return response.data;
    },
    verifyPayment: async (txRef) => {
      const response = await http.get(`/verify-payment/${encodeURIComponent(txRef)}`);
      return response.data;
    },
    listMobileMoneyOperators: async () => {
      const response = await http.get('/mobile-money/');
      return response.data;
    },
    initializeMobileMoneyPayment: async (params) => {
      const response = await http.post('/mobile-money/payments/initialize', params);
      return response.data;
    },
  };
}
