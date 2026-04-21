/**
 * Global Exception Filter – Catches every unhandled exception and returns a uniform JSON error response.
 *
 * This filter runs for all exceptions thrown by controllers, services, or middleware.
 * It handles:
 * - Our custom AppError instances (formatted with error codes)
 * - NestJS built-in HttpException (converted to our format)
 * - Any other unexpected errors (fallback to InternalServerError)
 *
 * The error response format:
 * {
 *   "success": false,
 *   "error": {
 *     "code": "AUTH_100",
 *     "message": "Invalid phone or password",
 *     "details": { ... },          // optional
 *     "timestamp": "2025-...",
 *     "path": "/auth/login",
 *     "correlationId": "uuid"
 *   }
 * }
 *
 * It also logs errors with Winston, including the correlation ID.
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppError } from '../errors/app-error';
import { ErrorCode } from '../errors/error-codes';
import { LoggerService } from '../logger/logger.service';
import { RequestContext } from '../../core/context/request-context';
import { ILogger } from '../logger/logger.interface';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger: ILogger;
  constructor(logger: LoggerService) {
    this.logger = logger.child(GlobalExceptionFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Get correlation ID from request context
    const correlationId =
      RequestContext.getCorrelationId() || request['correlationId'];

    let statusCode: number;
    let errorCode: ErrorCode;
    let message: string;
    let details: any = null;

    // 1. Our custom AppError
    if (exception instanceof AppError) {
      statusCode = exception.statusCode;
      errorCode = exception.code;
      message = exception.message;
      details = exception.details;

      // Log based on severity
      if (statusCode >= 500) {
        this.logger.error(exception.message, exception.stack, {
          errorCode,
          correlationId,
          details,
        });
      } else {
        this.logger.warn(exception.message, {
          errorCode,
          correlationId,
          details,
          statusCode,
        });
      }
    }
    // 2. NestJS built-in HttpException
    else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message || exception.message;
      details =
        typeof exceptionResponse === 'object' ? exceptionResponse : undefined;
      errorCode = this.mapHttpStatusToErrorCode(statusCode);

      this.logger.warn(`NestJS HttpException: ${message}`, {
        statusCode,
        errorCode,
        correlationId,
        stack: exception.stack,
      });
    }
    // 3. Unknown error (programming error, should never happen in production)
    else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      errorCode = ErrorCode.INTERNAL_SERVER_ERROR;
      message =
        exception instanceof Error
          ? exception.message
          : 'Internal server error';
      details =
        process.env.NODE_ENV === 'development'
          ? { originalError: String(exception) }
          : null;

      this.logger.error(
        'Unhandled exception',
        exception instanceof Error ? exception.stack : String(exception),
        {
          errorCode,
          correlationId,
        },
      );
    }

    // Build the error response
    const errorResponse = {
      success: false,
      error: {
        code: errorCode,
        message,
        ...(details && { details }),
        timestamp: new Date().toISOString(),
        path: request.url,
        correlationId,
      },
    };

    response.status(statusCode).json(errorResponse);
  }

  private mapHttpStatusToErrorCode(statusCode: number): ErrorCode {
    switch (statusCode) {
      case 400:
        return ErrorCode.BAD_REQUEST;
      case 401:
        return ErrorCode.UNAUTHORIZED;
      case 403:
        return ErrorCode.FORBIDDEN;
      case 404:
        return ErrorCode.RESOURCE_NOT_FOUND;
      case 409:
        return ErrorCode.CONFLICT;
      case 422:
        return ErrorCode.VALIDATION_FAILED;
      case 429:
        return ErrorCode.TOO_MANY_REQUESTS;
      default:
        return ErrorCode.INTERNAL_SERVER_ERROR;
    }
  }
}
