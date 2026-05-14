import { IsString, IsNotEmpty, IsOptional, IsEnum, MinLength, MaxLength } from 'class-validator';
import { BusinessType, Category } from 'generated/prisma/client';

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  businessName!: string;

  @IsEnum(BusinessType)
  businessType!: BusinessType;

  @IsEnum(Category)
  category!: Category;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  location?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  lga?: string;

  @IsString()
  @IsOptional()
  contactPhone?: string;

  @IsString()
  @IsOptional()
  bankName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  bankAccountNumber?: string;

  @IsString()
  @IsOptional()
  bankAccountName?: string;
}