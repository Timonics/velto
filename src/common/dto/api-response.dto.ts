/**
 * Standard API response wrapper.
 * Used by TransformInterceptor to format all successful responses.
 */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
  correlationId?: string;
  meta?: Record<string, any>;
}

export function createSuccessResponse<T>(
  data: T,
  message?: string,
  meta?: Record<string, any>,
): ApiResponse<T> {
  return {
    success: true,
    data,
    ...(message && { message }),
    ...(meta && { meta }),
    timestamp: new Date().toISOString(),
  };
}

export function createErrorResponse(
  message: string,
  code?: string,
  details?: any,
): any {
  // This is typically handled by GlobalExceptionFilter, but kept here for consistency.
  return {
    success: false,
    error: {
      code: code || 'UNKNOWN_ERROR',
      message,
      details,
      timestamp: new Date().toISOString(),
    },
  };
}
