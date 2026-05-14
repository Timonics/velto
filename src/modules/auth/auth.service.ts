import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserServiceImpl } from '../user/service/user.service.impl';
import { EventBus } from '../../domain/events/event-bus.service';
import { USER_EVENTS } from '../../domain/events/event-types';
import {
  UnauthorizedError,
  ConflictError,
} from '../../common/errors/app-error';
import { EnvironmentService } from '../../config/env/env.service';
import { LoggerService } from '../../common/logger/logger.service';
import { ILogger } from '../../common/logger/logger.interface';
import { LoginDto } from './dto/requests/login.request.dto';
import { RegisterDto } from './dto/requests/register.request.dto';

@Injectable()
export class AuthService {
  private readonly logger: ILogger;

  constructor(
    private readonly userService: UserServiceImpl,
    private readonly jwtService: JwtService,
    private readonly eventBus: EventBus,
    private readonly env: EnvironmentService,
    logger: LoggerService,
  ) {
    this.logger = logger.child('AuthService');
  }

  async register(dto: RegisterDto) {
    const { phone, password, email, name } = dto;

    const existingByPhone = await this.userService.findByPhone(phone);
    if (existingByPhone)
      throw new ConflictError('Phone number already registered', {
        field: 'phone',
      });
    if (email) {
      const existingByEmail = await this.userService.findByEmail(email);
      if (existingByEmail)
        throw new ConflictError('Email already registered', { field: 'email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.userService.create({
      phone,
      email,
      passwordHash: hashedPassword,
      role: 'CUSTOMER',
      customer: { create: {} },
    });

    await this.eventBus.emit({
      name: USER_EVENTS.REGISTERED,
      payload: {
        userId: user.id,
        email: user.email!,
        phone: user.phone,
        name: name || 'User',
        verificationToken: '',
      },
    });

    this.logger.info('User registered', { userId: user.id });
    return { userId: user.id, role: user.role };
  }

  async login(dto: LoginDto) {
    const { phone, password } = dto;
    const user = await this.userService.findByPhone(phone);
    if (!user) throw new UnauthorizedError('Invalid phone or password');

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) throw new UnauthorizedError('Invalid phone or password');

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateAndStoreRefreshToken(user);
    return { user, accessToken, refreshToken };
  }

  async logout(userId: string) {
    await this.userService.updateRefreshToken(userId, null);
    this.logger.info('User logged out', { userId });
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.env.get('JWT_SECRET'),
      });
      const user = await this.userService.findById(payload.id);
      if (!user || user.refreshToken !== refreshToken)
        throw new UnauthorizedError('Invalid refresh token');
      const newAccessToken = this.generateAccessToken(user);
      return { accessToken: newAccessToken, userId: user.id };
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }

  private generateAccessToken(user: any): string {
    return this.jwtService.sign(
      { id: user.id, phone: user.phone, role: user.role },
      {
        secret: this.env.get('JWT_SECRET'),
        expiresIn: this.env.get('JWT_ACCESS_EXPIRES') as any,
      },
    );
  }

  private async generateAndStoreRefreshToken(user: any): Promise<string> {
    const refreshToken = this.jwtService.sign(
      { id: user.id },
      {
        secret: this.env.get('JWT_SECRET'),
        expiresIn: this.env.get('JWT_REFRESH_EXPIRES') as any,
      },
    );
    await this.userService.updateRefreshToken(user.id, refreshToken);
    return refreshToken;
  }
}
