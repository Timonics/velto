export class PaystackWebhookDto {
  event!: string; // e.g., 'charge.success'
  data!: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    currency: string;
    gateway_response: string;
    paid_at: string;
    channel: string;
    ip_address: string;
    metadata?: any;
    customer: {
      id: number;
      email: string;
      customer_code: string;
    };
  };
}