/**
 * Transform Interceptor – Wraps all successful responses in a standard format.
 * 
 * - Consistent response structure across all endpoints
 * - Separates success response formatting from controller logic
 * - Automatically adds correlation ID and timestamp
 * - Easy to add metadata (pagination, etc.) globally
 * 
 * Success response format:
 * {
 *   "success": true,
 *   "data": { ... },
 *   "message": "Optional message",
 *   "timestamp": "2025-...",
 *   "correlationId": "uuid",
 *   "meta": { ... }   // for pagination, etc.
 * }
 * 
 * Controllers can return:
 * - Raw data (will be wrapped as { data: ... })
 * - { data, message } (will be merged)
 * - { data, meta } (will be merged)
 * - Already wrapped responses (if they already have 'success' property, they pass through)
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RequestContext } from '../../core/context/request-context';

export interface ResponseWrapper<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
  correlationId?: string;
  meta?: Record<string, any>;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ResponseWrapper<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseWrapper<T>> {
    const request = context.switchToHttp().getRequest();
    const correlationId = RequestContext.getCorrelationId() || request['correlationId'];

    return next.handle().pipe(
      map((responseData) => {
        // If the controller already returned a wrapped response (has 'success'), pass it through
        const isAlreadyWrapped = responseData && typeof responseData === 'object' && 'success' in responseData;
        if (isAlreadyWrapped) {
          // Ensure correlation ID is added if missing
          if (!responseData.correlationId && correlationId) {
            responseData.correlationId = correlationId;
          }
          if (!responseData.timestamp) {
            responseData.timestamp = new Date().toISOString();
          }
          return responseData;
        }

        // Extract optional message and meta from controller responses
        const data = responseData?.data ?? responseData;
        const message = responseData?.message ?? undefined;
        const meta = responseData?.meta ?? undefined;

        return {
          success: true,
          data,
          ...(message && { message }),
          ...(meta && { meta }),
          timestamp: new Date().toISOString(),
          correlationId,
        };
      }),
    );
  }
}