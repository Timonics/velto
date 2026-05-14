import { IsString, IsNotEmpty, IsArray, ValidateNested, IsNumber, Min, IsUUID, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @IsUUID()
  @IsNotEmpty()
  productId!: string;

  @IsNumber()
  @Min(1)
  quantity!: number;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @IsString()
  @IsNotEmpty()
  deliveryAddress!: string;

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  deliveryFee?: number; // optional, will default to 0

  @IsString()
  @IsOptional()
  source?: string; // attribution: instagram, whatsapp, etc.

  // Attribution fields
  @IsString()
  @IsOptional()
  utmSource?: string;

  @IsString()
  @IsOptional()
  utmMedium?: string;

  @IsString()
  @IsOptional()
  utmCampaign?: string;

  @IsString()
  @IsOptional()
  utmTerm?: string;

  @IsString()
  @IsOptional()
  utmContent?: string;
}