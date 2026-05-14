import { IsUUID, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class InitializePaymentDto {
  @IsUUID()
  orderId!: string;

  @IsString()
  @IsOptional()
  callbackUrl?: string; // frontend redirect URL after payment
}