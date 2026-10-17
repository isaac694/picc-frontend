declare module 'paychangu' {
  export default class PaymentsService {
    constructor(options: { apiKey: string; baseURL?: string });
    generateUniqueTransactionReference(): string;
    getMobileMoneyOperatorRefId(mobile: string): string;
    initiatePayment(options: {
      amount: number;
      email: string;
      first_name: string;
      last_name: string;
      description: string;
      callbackUrl: string;
      returnUrl: string;
    }): Promise<unknown>;
    verifyPayment(txRef: string): Promise<unknown>;
    initiateMobileMoneyPayout(options: { mobile: string; amount: number }): Promise<unknown>;
  }
}
