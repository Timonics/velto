/**
 * AuthController – HTTP endpoints for authentication.
 *
 * Endpoints:
 * - POST /auth/register – create new customer account.
 * - POST /auth/login – authenticate, set HTTP-only cookies.
 * - POST /auth/logout – clear cookies, invalidate refresh token.
 * - POST /auth/refresh – refresh access token using refresh cookie.
 *
 * Cookies are HTTP-only, secure in production, and set on .velto.app domain.
 * This allows the frontend (main domain or subdomains) to read the cookie.
 */

import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/requests/register.request.dto';
import { LoginDto } from './dto/requests/login.request.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthGuard } from '../../common/guards/auth.guard';
import { EnvironmentService } from '../../config/env/env.service';
import { UserSerializer } from '../../serializers/user.serializer';
import {
  createSuccessResponse,
  ApiResponse,
} from '../../common/dto/api-response.dto';
import { UnauthorizedError } from '../../common/errors/app-error';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly env: EnvironmentService,
  ) {}

  /**
   * Register a new customer.
   * Public route – no authentication required.
   */
  @Public()
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
  ): Promise<ApiResponse<{ userId: string; role: string }>> {
    const result = await this.authService.register(dto);
    return createSuccessResponse(result, 'Registration successful');
  }

  /**
   * Login with phone and password.
   * Sets accessToken and refreshToken as HTTP-only cookies.
   * Returns user data (serialized, no password).
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, user } =
      await this.authService.login(dto);
    this.setAuthCookies(res, accessToken, refreshToken);
    const serializer = new UserSerializer();
    return createSuccessResponse(
      serializer.serialize(user),
      'Login successful',
    );
  }

  /**
   * Logout current user.
   * Requires valid access token (AuthGuard).
   * Clears cookies and invalidates refresh token.
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(user.id);
    this.clearAuthCookies(res);
    return createSuccessResponse(null, 'Logout successful');
  }

  /**
   * Refresh access token.
   * Reads refreshToken cookie, validates it, and issues new accessToken cookie.
   * Public because the access token may have expired.
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token missing');
    }
    const { accessToken } = await this.authService.refreshTokens(refreshToken);
    this.setAccessTokenCookie(res, accessToken);
    return createSuccessResponse(null, 'Token refreshed');
  }

  // ---------- Cookie helpers ----------

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    const isProd = this.env.isProduction();
    const domain = this.env.get('COOKIE_DOMAIN');
    const sameSite = isProd ? 'strict' : 'lax';

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite,
      domain,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite,
      domain,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  private setAccessTokenCookie(res: Response, accessToken: string) {
    const isProd = this.env.isProduction();
    const domain = this.env.get('COOKIE_DOMAIN');
    const sameSite = isProd ? 'strict' : 'lax';
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite,
      domain,
      maxAge: 15 * 60 * 1000,
    });
  }

  private clearAuthCookies(res: Response) {
    const domain = this.env.get('COOKIE_DOMAIN');
    res.clearCookie('accessToken', { domain });
    res.clearCookie('refreshToken', { domain });
  }
}
