/**
 * Environment Variables Validation Schema
 *
 * This file is the single source of truth for all environment variables.
 * It uses class-validator and class-transformer to validate and transform
 * raw process.env into a typed, validated configuration object.
 *
 * WHY THIS APPROACH?
 * - Centralized, declarative validation (no manual if/else)
 * - Automatic type conversion (string "3000" → number 3000)
 * - Conditional validation (cross-field rules)
 * - Clear, formatted error messages
 * - Can be used outside NestJS (workers, scripts, tests)
 *
 * USAGE:
 *   import { validate } from './env.validation';
 *   const config = validate(process.env); // throws if invalid
 *   export const env = config; // then use anywhere
 */

import { plainToClass } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsUrl,
  Min,
  Max,
  IsBoolean,
  IsNotEmpty,
  validateSync,
  ValidationError,
} from 'class-validator';
import { Transform } from 'class-transformer';

// ========== Enums ==========
export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

// ========== Validation Class ==========
export class EnvironmentVariables {
  // ---------- App Configuration ----------
  @IsEnum(Environment)
  NODE_ENV!: Environment;

  @IsNumber()
  @Min(1)
  @Max(65535)
  @Transform(({ value }) => parseInt(value, 10))
  PORT!: number;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  APP_DOMAIN!: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  COOKIE_DOMAIN!: string;

  // ---------- Database ----------
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  DATABASE_URL!: string;

  // ---------- JWT ----------
  @IsString()
  @IsNotEmpty()
  JWT_SECRET!: string;

  @IsString()
  @IsOptional()
  JWT_ACCESS_EXPIRES: string = '15m';

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRES: string = '7d';

  // ---------- Cloudinary (optional during development) ----------
  @IsString()
  @IsOptional()
  CLOUDINARY_CLOUD_NAME!: string;

  @IsString()
  @IsOptional()
  CLOUDINARY_API_KEY!: string;

  @IsString()
  @IsOptional()
  CLOUDINARY_API_SECRET!: string;

  // ---------- Twilio (WhatsApp) – optional during development ----------
  @IsString()
  @IsOptional()
  TWILIO_ACCOUNT_SID!: string;

  @IsString()
  @IsOptional()
  TWILIO_AUTH_TOKEN!: string;

  @IsString()
  @IsOptional()
  TWILIO_WHATSAPP_FROM!: string;

  // ---------- Logging ----------
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === '1')
  LOG_FILE_ENABLED: boolean = false;

  @IsString()
  @IsOptional()
  LOG_FILE_PATH: string = './logs';

  // ---------- Redis ----------
  @IsString()
  @IsOptional()
  REDIS_HOST!: string;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  REDIS_PORT!: number;

  @IsString()
  @IsNotEmpty()
  @IsUrl({ require_tld: false, protocols: ['redis'] })
  REDIS_URL!: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(15)
  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  REDIS_DB?: number;

  @IsString()
  @IsOptional()
  REDIS_PASSWORD?: string;

  // ---------- Send Grid ----------
  @IsString()
  @IsOptional()
  SENDGRID_API_KEY!: string;

  @IsString()
  @IsOptional()
  SENDGRID_FROM_EMAIL!: string;

  @IsString()
  @IsOptional()
  SENDGRID_FROM_NAME!: string;

  @IsString()
  @IsOptional()
  FRONTEND_URL!: string;

  // Optional template IDs
  @IsString()
  @IsOptional()
  SENDGRID_VERIFICATION_TEMPLATE_ID?: string;

  @IsString()
  @IsOptional()
  SENDGRID_PASSWORD_RESET_TEMPLATE_ID?: string;

  @IsString()
  @IsOptional()
  SENDGRID_WELCOME_TEMPLATE_ID?: string;

  @IsString()
  @IsOptional()
  SENDGRID_ORDER_CONFIRMATION_TEMPLATE_ID?: string;

  @IsString()
  @IsOptional()
  SENDGRID_SHIPPING_UPDATE_TEMPLATE_ID?: string;

  @IsString()
  @IsOptional()
  SENDGRID_ORDER_CANCELLATION_TEMPLATE_ID?: string;

  @IsString()
  @IsOptional()
  SENDGRID_VENDOR_APPROVAL_TEMPLATE_ID?: string;

  @IsString()
  @IsOptional()
  SENDGRID_VENDOR_REJECTION_TEMPLATE_ID?: string;

  /**
   * Cross‑field validation (called after basic validation)
   * Throws an error if a condition is violated.
   */
  postValidate(): void {
    // Cloudinary: either provide all three or none
    const cloudinaryKeys = [
      this.CLOUDINARY_CLOUD_NAME,
      this.CLOUDINARY_API_KEY,
      this.CLOUDINARY_API_SECRET,
    ];
    const hasAny = cloudinaryKeys.some((k) => k !== undefined && k !== '');
    const hasAll = cloudinaryKeys.every((k) => k !== undefined && k !== '');
    if (hasAny && !hasAll) {
      throw new Error(
        'Cloudinary: either provide all three (CLOUDINARY_CLOUD_NAME, API_KEY, API_SECRET) or none.',
      );
    }

    // Twilio: either provide all three or none
    const twilioKeys = [
      this.TWILIO_ACCOUNT_SID,
      this.TWILIO_AUTH_TOKEN,
      this.TWILIO_WHATSAPP_FROM,
    ];
    const hasAnyTwilio = twilioKeys.some((k) => k !== undefined && k !== '');
    const hasAllTwilio = twilioKeys.every((k) => k !== undefined && k !== '');
    if (hasAnyTwilio && !hasAllTwilio) {
      throw new Error(
        'Twilio: either provide all three (ACCOUNT_SID, AUTH_TOKEN, WHATSAPP_FROM) or none.',
      );
    }
  }
}

// ========== Helper: Format Validation Errors ==========
function formatValidationErrors(errors: ValidationError[]): string {
  return errors
    .map((error) => {
      const constraints = Object.values(error.constraints || {});
      return `  • ${error.property}: ${constraints.join(', ')}`;
    })
    .join('\n');
}

// ========== Public Validation Function ==========
/**
 * Validates and transforms raw process.env.
 *
 * @param config - Raw process.env object
 * @returns Validated and typed EnvironmentVariables (frozen)
 * @throws Error with formatted message if validation fails
 */
export function validate(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
    whitelist: true,
  });

  if (errors.length > 0) {
    const formattedErrors = formatValidationErrors(errors);
    throw new Error(`❌ Environment validation failed:\n${formattedErrors}`);
  }

  validatedConfig.postValidate();

  // Freeze the object to prevent accidental mutations
  return Object.freeze(validatedConfig);
}
