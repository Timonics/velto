/**
 * LoggerService – Production-ready logger using Winston.
 *
 * Key features:
 * - Scope.TRANSIENT: each service gets its own instance with its own context name
 * - AsyncLocalStorage integration: automatically attaches correlation ID from RequestContext
 * - Daily rotating files in production, human-readable colors in development
 * - Separate error log file (kept longer)
 * - Uses EnvironmentService for configuration (no direct process.env access)
 *
 * Usage in any service:
 *   constructor(private readonly logger: LoggerService) {
 *     this.logger = logger.child('AuthService');
 *   }
 *   this.logger.info('User logged in', { userId: 123 });
 */

import { Injectable, Scope } from '@nestjs/common';
import {
  createLogger,
  format,
  transports,
  Logger as WinstonLoggerType,
} from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { ILogger, LogContext } from './logger.interface';
import { RequestContext } from '../../core/context/request-context';
import { EnvironmentService } from '../../config/env/env.service';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements ILogger {
  private logger!: WinstonLoggerType;
  private context: string = 'Application';
  private env: EnvironmentService;

  constructor() {
    this.env = EnvironmentService.getInstance();
    this.initializeLogger();
  }

  /**
   * Initialize Winston logger with environment-specific configuration.
   * - Development: human-readable, colored, debug level
   * - Production: JSON format, warn level, file rotation
   */
  private initializeLogger(): void {
    const isProduction = this.env.isProduction();
    const logLevel = isProduction ? 'warn' : 'debug';

    this.logger = createLogger({
      level: logLevel,
      defaultMeta: {
        service: 'velto-api',
        environment: this.env.get('NODE_ENV'),
        version: process.env.npm_package_version || '1.0.0',
      },
      format: this.getLogFormat(isProduction),
      transports: this.getTransports(isProduction),
    });
  }

  /**
   * Get the appropriate log format based on environment.
   * - Development: human-readable with colors for easy debugging
   * - Production: JSON for log aggregation (ELK, Datadog, Splunk)
   */
  private getLogFormat(isProduction: boolean) {
    if (!isProduction) {
      // Development: colorful, timestamped, easy to read
      return format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.colorize({ all: true }),
        format.printf(
          ({ timestamp, level, message, context, correlationId, ...meta }) => {
            const correlation = correlationId ? `[${correlationId}] ` : '';
            const contextStr = context ? `[${context}] ` : '';
            const metaStr = Object.keys(meta).length
              ? `\n${JSON.stringify(meta, null, 2)}`
              : '';
            return `${timestamp} ${level}: ${correlation}${contextStr}${message}${metaStr}`;
          },
        ),
      );
    }
    // Production: JSON format, includes stack traces for errors
    return format.combine(
      format.timestamp(),
      format.errors({ stack: true }),
      format.json(),
    );
  }

  /**
   * Configure log transports (where logs are sent).
   * - Console: always enabled (visible in Docker/k8s logs)
   * - File rotation: enabled in production or when LOG_FILE_ENABLED=true
   */
  private getTransports(isProduction: boolean) {
    const transportsList: any[] = [
      new transports.Console({
        handleExceptions: true, // Catch uncaught exceptions
        handleRejections: true, // Catch unhandled promise rejections
      }),
    ];

    if (this.env.isFileLoggingEnabled()) {
      const logFilePath = this.env.get('LOG_FILE_PATH') || './logs';

      // General log – rotates daily, keeps 14 days
      transportsList.push(
        new DailyRotateFile({
          filename: `${logFilePath}/velto-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          format: format.combine(format.timestamp(), format.json()),
        }),
      );

      // Error-only log – kept longer (30 days) for post-mortem debugging
      transportsList.push(
        new DailyRotateFile({
          filename: `${logFilePath}/velto-error-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxSize: '20m',
          maxFiles: '30d',
          format: format.combine(format.timestamp(), format.json()),
        }),
      );
    }
    return transportsList;
  }

  /**
   * Set the module/class name for this logger instance.
   * Used by child() method to create context-specific loggers.
   */
  setContext(context: string): void {
    this.context = context;
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, trace?: string, context?: LogContext): void {
    this.log('error', message, context, trace);
  }

  /**
   * Create a child logger with a fixed context (module/class name).
   * This avoids passing context repeatedly and ensures consistency.
   *
   * @example
   * const authLogger = logger.child('AuthService');
   * authLogger.info('User logged in'); // Automatically includes context: 'AuthService'
   */
  child(module: string): ILogger {
    const childLogger = new LoggerService();
    childLogger.setContext(module);
    return childLogger;
  }

  /**
   * Core logging method that handles all log levels.
   * Automatically fetches correlation ID from AsyncLocalStorage.
   *
   * Why private?
   * - Internal implementation detail
   * - Public interface uses level-specific methods for clarity
   */
  private log(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    context?: LogContext,
    trace?: string,
  ): void {
    // Automatically fetch correlation ID from request context
    const correlationId =
      context?.correlationId ?? RequestContext.getCorrelationId();

    const fullContext = {
      context: this.context,
      correlationId,
      ...context,
    };

    // Attach stack trace for errors
    if (trace && level === 'error') {
      fullContext['stack'] = trace;
    }

    // Remove undefined values to keep logs clean
    Object.keys(fullContext).forEach(
      (key) => fullContext[key] === undefined && delete fullContext[key],
    );

    this.logger.log(level, message, fullContext);
  }
}
