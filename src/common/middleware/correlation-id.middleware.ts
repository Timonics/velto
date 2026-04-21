/**
 * CorrelationIdMiddleware – Generates or forwards a correlation ID
 * and stores it in AsyncLocalStorage for the entire request lifetime.
 * 
 * Why correlation ID?
 * - Trace a single request across multiple services, logs, and events
 * - Debug complex issues by filtering logs by correlationId
 * - Frontend can send their own ID for end-to-end tracing
 * 
 * How it works:
 * 1. Takes `x-correlation-id` header if present (for distributed tracing)
 * 2. Otherwise generates a new UUID
 * 3. Sets it as response header `X-Correlation-Id`
 * 4. Stores it in RequestContext for the entire request lifecycle
 * 
 * This middleware MUST be the first middleware in the chain
 * so that all subsequent code has access to the correlation ID.
 */

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { RequestContext } from '../../core/context/request-context';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // Use existing header or generate new UUID
    const correlationId = (req.headers['x-correlation-id'] as string) || uuidv4();
    
    // Attach to request object (for debugging)
    req['correlationId'] = correlationId;
    
    // Set response header so client can trace requests
    res.setHeader('X-Correlation-Id', correlationId);
    
    // Run the rest of the request inside an AsyncLocalStorage context
    RequestContext.run(req, () => {
      RequestContext.set('correlationId', correlationId);
      next();
    });
  }
}