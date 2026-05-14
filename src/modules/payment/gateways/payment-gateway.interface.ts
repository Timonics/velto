export interface InitializePaymentParams {
  amount: number;
  reference: string;
  email: string;
  callbackUrl?: string;
  metadata?: any;
  splitConfig?: {
    subaccount: string;
    split: Array<{ subaccount: string; amount: number }>;
  };
}

export interface PaymentVerificationResult {
  status: 'success' | 'failed' | 'pending';
  transactionId: string;
  amount: number;
  currency: string;
  channel?: string;
  rawData: any;
}

export const PAYMENT_GATEWAY = 'PAYMENT_GATEWAY';

export interface IPaymentGateway {
  /**
   * Initialize a payment transaction.
   * Returns authorization URL and reference.
   */
  initializePayment(params: InitializePaymentParams): Promise<{
    authorizationUrl: string;
    reference: string;
  }>;

  /**
   * Verify payment status using reference.
   */
  verifyPayment(reference: string): Promise<PaymentVerificationResult>;

  /**
   * Get the gateway name (e.g., 'paystack', 'flutterwave')
   */
  getGatewayName(): string;
}
