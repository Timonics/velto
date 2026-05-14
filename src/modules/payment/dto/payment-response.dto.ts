export interface PaymentResponseDto {
  authorizationUrl: string;
  reference: string;
  orderId: string;
  amount: number;
}