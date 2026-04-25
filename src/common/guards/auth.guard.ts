import { Injectable, ExecutionContext, CanActivate } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { EnvironmentService } from '../../config/env/env.service';
import { UnauthorizedError } from '../errors/app-error';
import { RequestContext } from '../../core/context/request-context';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly env: EnvironmentService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromCookie(request);
    if (!token) throw new UnauthorizedError('No access token provided');

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.env.getJwtSecret(),
      });
      request.user = payload;
      RequestContext.setUserId(payload.id);
      return true;
    } catch {
      throw new UnauthorizedError('Invalid or expired access token');
    }
  }

  private extractTokenFromCookie(request: Request): string | undefined {
    return request.cookies?.accessToken;
  }
}
