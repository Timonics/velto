import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

export interface CurrentUserPayload {
  id: string;
  phone: string;
  email?: string;
  role: string;
  tenantId?: string;
}

/**
 * Extracts the authenticated user from the request (set by AuthGuard).
 * 
 * @example
 * @Get('profile')
 * getProfile(@CurrentUser() user: CurrentUserPayload) {
 *   return user;
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }
    return user;
  },
);