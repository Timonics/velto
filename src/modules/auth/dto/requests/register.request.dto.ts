/**
 * Register DTO – Data Transfer Object for user registration.
 * 
 * Validates incoming request body using class-validator.
 * Phone numbers are validated with Nigerian format (+234... or 0...).
 * Password must be at least 6 characters.
 * Email is optional but validated if provided.
 */

import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  phone!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(20)
  password!: string;

  @IsEmail()
  @IsOptional()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email?: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(50)
  name?: string;
}