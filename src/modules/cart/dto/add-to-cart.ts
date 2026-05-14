import { IsUUID, IsNumber, Min, Max } from 'class-validator';

export class AddToCartDto {
  @IsUUID()
  productId!: string;

  @IsNumber()
  @Min(1)
  @Max(99)
  quantity!: number;
}
