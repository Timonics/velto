/**
 * Environment Module – Global module that provides the validated EnvironmentService.
 * 
 * Marked as @Global() so that any module can inject EnvironmentService without importing.
 * This is safe because environment configuration is truly application-wide.
 */

import { Global, Module } from '@nestjs/common';
import { EnvironmentService, EnvironmentServiceProvider } from './env.service';

@Global()
@Module({
  providers: [EnvironmentServiceProvider],
  exports: [EnvironmentService],
})
export class EnvironmentModule {}