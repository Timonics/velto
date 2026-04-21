/**
 * Logger Interface – Contract for all loggers in the application.
 */

export interface LogContext {
  [key: string]: any;
  correlationId?: string;
}

export interface ILogger {
  /**
   * Debug level – Detailed information for debugging.
   * Not logged in production by default.
   */
  debug(message: string, context?: LogContext): void;

  /**
   * Info level – Normal application flow (user actions, background jobs).
   * Always logged.
   */
  info(message: string, context?: LogContext): void;

  /**
   * Warn level – Unexpected but handled issues (retries, rate limits).
   * Always logged.
   */
  warn(message: string, context?: LogContext): void;

  /**
   * Error level – Failures that need attention.
   * Always logged, includes stack trace.
   */
  error(message: string, trace?: string, context?: LogContext): void;

  /**
   * Create a child logger with a fixed context (module/class name).
   * Eliminates repetitive context passing.
   */
  child(module: string): ILogger;

  /**
   * Set the context for this logger instance.
   * Used by child() to assign a module name.
   */
  setContext(context: string): void;
}