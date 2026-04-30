import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, MaxLength, IsBoolean } from 'class-validator';
// import { Category } from '@prisma/client';

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsBoolean()
  @IsOptional()
  negotiable?: boolean;

  @IsString()
  @IsOptional()
  duration?: string; // e.g., "1 hour", "30 mins"

  @IsOptional()
  mediaUrls?: string[];
}