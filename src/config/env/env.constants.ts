/**
 * Validated Environment Constants
 * 
 * This file exports the validated environment configuration object.
 * It is created by calling validate(process.env) after dotenv is loaded.
 * 
 * WHY A SEPARATE FILE?
 * - Single import for any file that needs env vars (no need for DI)
 * - Guaranteed to be validated and immutable
 * - Can be used in workers, cron jobs, and scripts without NestJS
 * 
 * USAGE:
 *   import { env } from './env.constants';
 *   console.log(env.PORT);
 * 
 * NOTE: This file is only safe to import AFTER validation has run.
 * In main.ts, we validate first, then import everything else.
 */

import { EnvironmentVariables } from './env.validation';

// This will be set by the validate() call in main.ts
// We use a module-level variable that is assigned after validation.
let _env: EnvironmentVariables | null = null;

export function setEnv(validatedEnv: EnvironmentVariables): void {
  _env = validatedEnv;
}

export function getEnv(): EnvironmentVariables {
  if (!_env) {
    throw new Error('Environment not validated yet. Call validate(process.env) in main.ts first.');
  }
  return _env;
}

// Convenience export – but only safe after setEnv has been called.
// We'll export a getter function instead of a constant to avoid timing issues.
export const env = () => getEnv();