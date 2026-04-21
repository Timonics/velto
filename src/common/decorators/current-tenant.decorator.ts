/**
 * CurrentTenant Decorator – Extracts tenant from request (set by TenantMiddleware).
 *
 * @example
 * @Get('/storefront')
 * getStorefront(@CurrentTenant() tenant: Tenant) {
 *   return tenant;
 * }
 */

import { createParamDecorator, ExecutionContext, NotFoundException } from '@nestjs/common';

export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const tenant = request.tenant;

    if (!tenant) {
      throw new NotFoundException('Tenant not found in request context');
    }

    return tenant;
  },
);