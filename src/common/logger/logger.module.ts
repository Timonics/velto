import { Global, Module } from '@nestjs/common';
import { LoggerService } from './logger.service';

/**
 * LoggerModule – Global module that provides LoggerService everywhere.
 * 
 * Using @Global() makes LoggerService available to all modules without importing.
 */
@Global()
@Module({
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}