/**
 * RequestContext – AsyncLocstoragetorage wrapper for request-scoped storage.
 *
 * Why AsyncLocalStorage?
 * - Provides automatic propagation of context across async operations (Promises, callbacks)
 * - No need to manually pass correlationId down the call stack
 * - Thread-safe and works with NestJS DI
 * - Each HTTP request gets its own isolated context
 *
 * Usage in middleware:
 *   RequestContext.run(() => {
 *     RequestContext.set('correlationId', uuid());
 *     next();
 *   });
 *
 * Usage in service/logger:
 *   const cid = RequestContext.getCorrelationId();
 *
 * This pattern is essential for logging, tracing, and debugging in concurrent environments.
 */

import { AsyncLocalStorage } from 'async_hooks';
import { Request } from 'express';

export class RequestContext {
  private static storage = new AsyncLocalStorage<Map<string, any>>();

  /**
   * Run a function within a new context.
   * All code executed inside this callback will have access to stored values.
   * Must be called at the beginning of each request (in middleware).
   */
  static run(req: Request, callback: () => void): void {
    const contextMap = new Map<string, any>();

    // If user is authenticated, store user ID for context
    if ((req['user'] as any)?.id) {
      contextMap.set('userId', (req['user'] as any).id);
    }

    contextMap.set('ipAddr', req.ip);

    this.storage.run(contextMap, callback);
  }

  /**
   * Set a key-value pair in the current context.
   * Must be called inside a `RequestContext.run()` callback.
   */
  static set(key: string, value: any): void {
    const store = this.storage.getStore();
    if (store) {
      store.set(key, value);
    }
  }

  /**
   * Retrieve a value from the current context.
   * Returns undefined if no context or key missing.
   */
  static get<T = any>(key: string): T | undefined {
    const store = this.storage.getStore();
    return store ? store.get(key) : undefined;
  }

  /**
   * Convenience method to get the correlation ID.
   * Used by the logger to automatically attach the ID to every log entry.
   */
  static getCorrelationId(): string | undefined {
    return this.get('correlationId');
  }

  /**
   * Get the current user ID from context
   */
  static getUserId(): string | undefined {
    return RequestContext.get<string>('userId');
  }

  static getIpAddress() {
    return RequestContext.get('ipAddr');
  }
}
