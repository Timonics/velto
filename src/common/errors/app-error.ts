/**
 * AppError – Base custom error class for the entire application.
 * 
 * WHY NOT USE NESTJS HTTPEXCEPTION DIRECTLY?
 * - We need custom error codes for frontend mapping.
 * - We want to attach additional metadata (e.g., field names, validation details).
 * - We want to distinguish between operational (expected) and programming errors.
 * 
 * All application errors should extend this class or one of its subclasses.
 */

import { ErrorCode } from './error-codes';

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: any;
  public readonly isOperational: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    details?: any,
    isOperational: boolean = true,
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;

    // Maintain proper stack trace (only available in V8)
    Error.captureStackTrace(this, this.constructor);
  }
}

// ========== Concrete Error Classes ==========

/**
 * 400 Bad Request – Malformed request, invalid input format.
 */
export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request', details?: any) {
    super(ErrorCode.BAD_REQUEST, message, 400, details);
  }
}

/**
 * 401 Unauthorized – Missing or invalid authentication credentials.
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', details?: any) {
    super(ErrorCode.UNAUTHORIZED, message, 401, details);
  }
}

/**
 * 403 Forbidden – Authenticated but does not have permission.
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', details?: any) {
    super(ErrorCode.FORBIDDEN, message, 403, details);
  }
}

/**
 * 404 Not Found – Requested resource does not exist.
 */
export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string | number) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(ErrorCode.RESOURCE_NOT_FOUND, message, 404);
  }
}

/**
 * 409 Conflict – Resource already exists (e.g., duplicate email, slug).
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists', details?: any) {
    super(ErrorCode.CONFLICT, message, 409, details);
  }
}

/**
 * 422 Unprocessable Entity – Validation failed (business logic, not format).
 */
export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: any) {
    super(ErrorCode.VALIDATION_FAILED, message, 422, details);
  }
}

/**
 * 500 Internal Server Error – Unexpected errors (not operational).
 * These should ideally not be thrown manually; they are the fallback for unhandled exceptions.
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error', details?: any) {
    super(ErrorCode.INTERNAL_SERVER_ERROR, message, 500, details, false);
  }
}