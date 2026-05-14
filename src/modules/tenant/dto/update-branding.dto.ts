import {
  IsString,
  IsOptional,
  IsHexColor,
  MaxLength,
  IsObject,
} from 'class-validator';

export class UpdateBrandingDto {
  @IsHexColor()
  @IsOptional()
  primaryColor?: string;

  @IsHexColor()
  @IsOptional()
  secondaryColor?: string;

  @IsHexColor()
  @IsOptional()
  accentColor?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  fontFamily?: string;

  @IsObject()
  @IsOptional()
  socialLinks?: Record<string, string>;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  heroTitle?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  heroSubtitle?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  footerText?: string;
}
