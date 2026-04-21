/**
 * AuthService – Handles business logic for authentication.
 * 
 * Responsibilities:
 * - Register new users (customer role) with password hashing.
 * - Login with phone/password, generating JWT access & refresh tokens.
 * - Logout (invalidate refresh token).
 * - Refresh access token using valid refresh token.
 * 
 * Dependencies:
 * - IUserRepository (abstracts database operations).
 * - JwtService (token generation/verification).
 * - EventBus (emits domain events like user.registered).
 * - EnvironmentService (config).
 * - LoggerService (structured logging).
 * 
 * All errors are thrown as custom AppError subclasses (ConflictError, UnauthorizedError)
 * so that the global exception filter can format them consistently.
 */

import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { IUserRepository } from '../user/user.repository.interface';
import { EventBus } from '../../domain/events/event-bus.service';
import { USER_EVENTS } from '../../domain/events/event-types';
import { UnauthorizedError, ConflictError } from '../../common/errors/app-error';
import { EnvironmentService } from '../../config/env/env.service';
import { LoggerService } from '../../common/logger/logger.service';
import { ILogger } from '../../common/logger/logger.interface';
import { RegisterDto } from './dto/requests/register.request.dto';
import { LoginDto } from './dto/requests/login.request.dto';

@Injectable()
export class AuthService {
  private readonly logger: ILogger;

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
    private readonly eventBus: EventBus,
    private readonly env: EnvironmentService,
    logger: LoggerService,
  ) {
    this.logger = logger.child('AuthService');
  }

  /**
   * Register a new customer.
   * - Validates phone/email uniqueness.
   * - Hashes password.
   * - Creates user and associated customer record.
   * - Emits user.registered event (triggers welcome email).
   */
  async register(dto: RegisterDto) {
    const { phone, password, email, name } = dto;

    // Check if phone already exists
    const existingByPhone = await this.userRepository.findByPhone(phone);
    if (existingByPhone) {
      throw new ConflictError('Phone number already registered', { field: 'phone' });
    }

    // Check email uniqueness if provided
    if (email) {
      const existingByEmail = await this.userRepository.findByEmail(email);
      if (existingByEmail) {
        throw new ConflictError('Email already registered', { field: 'email' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and customer in a transaction (ensures both created)
    const user = await this.userRepository.create({
      phone,
      email,
      passwordHash: hashedPassword,
      role: 'CUSTOMER',
      customer: { create: {} },
    });

    // Emit domain event for side effects (welcome email, etc.)
    await this.eventBus.emit({
      name: USER_EVENTS.REGISTERED,
      payload: {
        userId: user.id,
        email: user.email!,
        phone: user.phone,
        name: name || 'User',
        verificationToken: '', // In production, generate a JWT or random token
      },
    });

    this.logger.info('User registered', { userId: user.id, phone });
    return { userId: user.id, role: user.role };
  }

  /**
   * Authenticate user with phone and password.
   * - Returns user object, access token, and refresh token.
   * - Refresh token is stored hashed in DB (plain for MVP, but should be hashed).
   * - Sets HTTP-only cookies in the controller.
   */
  async login(dto: LoginDto) {
    const { phone, password } = dto;

    const user = await this.userRepository.findByPhone(phone);
    if (!user) {
      throw new UnauthorizedError('Invalid phone or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid phone or password');
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateAndStoreRefreshToken(user);

    this.logger.info('User logged in', { userId: user.id });
    return { user, accessToken, refreshToken };
  }

  /**
   * Logout: clear stored refresh token.
   */
  async logout(userId: string) {
    await this.userRepository.updateRefreshToken(userId, null);
    this.logger.info('User logged out', { userId });
  }

  /**
   * Refresh access token using a valid refresh token.
   * - Verifies refresh token signature.
   * - Checks that it matches stored token.
   * - Issues new access token.
   */
  async refreshTokens(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.env.getJwtSecret(),
      });

      const user = await this.userRepository.findById(payload.id);
      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      const newAccessToken = this.generateAccessToken(user);
      this.logger.debug('Access token refreshed', { userId: user.id });
      return { accessToken: newAccessToken, userId: user.id };
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }

  // ---------- Private helper methods ----------

  private generateAccessToken(user: any): string {
    return this.jwtService.sign(
      { id: user.id, phone: user.phone, role: user.role },
      {
        secret: this.env.getJwtSecret(),
        expiresIn: this.env.get('JWT_ACCESS_EXPIRES'),
      },
    );
  }

  private async generateAndStoreRefreshToken(user: any): Promise<string> {
    const refreshToken = this.jwtService.sign(
      { id: user.id },
      {
        secret: this.env.getJwtSecret(),
        expiresIn: this.env.get('JWT_REFRESH_EXPIRES'),
      },
    );
    // Store plain token in DB (MVP). In production, hash it before storing.
    await this.userRepository.updateRefreshToken(user.id, refreshToken);
    return refreshToken;
  }
}