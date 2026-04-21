import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { BusinessType, Category } from 'generated/prisma/client';

export class UpdateTenantDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  businessName?: string;

  @IsEnum(BusinessType)
  @IsOptional()
  businessType?: BusinessType;

  @IsEnum(Category)
  @IsOptional()
  category?: Category;

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
  logoUrl?: string;

  @IsString()
  @IsOptional()
  bannerUrl?: string;
}