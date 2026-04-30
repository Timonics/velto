/**
 * EnvironmentService – Singleton that provides validated environment variables.
 * 
 * This service loads and validates environment variables exactly once.
 * It can be used both with NestJS DI and via static getInstance().
 * 
 * USAGE:
 *   const env = EnvironmentService.getInstance();
 *   const port = env.get('PORT');
 *   if (env.isProduction()) { ... }
 */

import { Injectable, Logger } from '@nestjs/common';
import { EnvironmentVariables, Environment, validate } from './env.validation';

@Injectable()
export class EnvironmentService {
  private static instance: EnvironmentService;
  private static validatedConfig: EnvironmentVariables;
  private readonly logger = new Logger(EnvironmentService.name);
  private readonly config: EnvironmentVariables;

  /**
   * Private constructor – uses the already‑validated static config.
   */
  private constructor() {
    // Ensure validation has run
    if (!EnvironmentService.validatedConfig) {
      EnvironmentService.initialize();
    }
    this.config = EnvironmentService.validatedConfig;
    this.logConfiguration();
  }

  /**
   * Initialize the service: load dotenv and validate.
   * This runs once when the class is first accessed.
   */
  private static initialize(): void {
    // Load dotenv if not already loaded (safe to call multiple times)
    try {
      require('dotenv/config');
    } catch (e) {
      // dotenv may already be loaded; ignore
    }

    // Validate and freeze the config
    this.validatedConfig = validate(process.env);
  }

  /**
   * Get the singleton instance.
   */
  static getInstance(): EnvironmentService {
    if (!EnvironmentService.instance) {
      EnvironmentService.instance = new EnvironmentService();
    }
    return EnvironmentService.instance;
  }

  /**
   * For NestJS DI – returns the same singleton.
   */
  static forRoot(): EnvironmentService {
    return EnvironmentService.getInstance();
  }

  private logConfiguration(): void {
    this.logger.log(`✅ Environment: ${this.config.NODE_ENV}`);
    this.logger.log(`✅ Port: ${this.config.PORT}`);
    this.logger.log(`✅ API Domain: ${this.config.APP_DOMAIN}`);
    if (this.isProduction()) {
      this.logger.log('🚀 Running in production mode');
    }
    if (!this.config.CLOUDINARY_CLOUD_NAME) {
      this.logger.warn('⚠️ Cloudinary not configured – media uploads will fail');
    }
    if (!this.config.TWILIO_ACCOUNT_SID) {
      this.logger.warn('⚠️ Twilio not configured – WhatsApp notifications will be disabled');
    }
  }

  // ---------- Public API ----------
  get<K extends keyof EnvironmentVariables>(key: K): EnvironmentVariables[K] {
    return this.config[key];
  }

  isDevelopment(): boolean {
    return this.config.NODE_ENV === Environment.Development;
  }

  isProduction(): boolean {
    return this.config.NODE_ENV === Environment.Production;
  }

  isTest(): boolean {
    return this.config.NODE_ENV === Environment.Test;
  }

  isFileLoggingEnabled(): boolean {
    return this.config.LOG_FILE_ENABLED;
  }

  getJwtSecret(): string {
    return this.config.JWT_SECRET;
  }

  getJwtAccessExpires(): string {
    return this.config.JWT_ACCESS_EXPIRES;
  }

  getJwtRefreshExpires(): string {
    return this.config.JWT_REFRESH_EXPIRES;
  }

  isCloudinaryConfigured(): boolean {
    return !!(
      this.config.CLOUDINARY_CLOUD_NAME &&
      this.config.CLOUDINARY_API_KEY &&
      this.config.CLOUDINARY_API_SECRET
    );
  }

  isTwilioConfigured(): boolean {
    return !!(
      this.config.TWILIO_ACCOUNT_SID &&
      this.config.TWILIO_AUTH_TOKEN &&
      this.config.TWILIO_WHATSAPP_FROM
    );
  }
}

// Provider for EnvironmentService
export const EnvironmentServiceProvider = {
  provide: EnvironmentService,
  useFactory: () => EnvironmentService.getInstance(),
};