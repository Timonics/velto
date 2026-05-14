import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserServiceImpl } from '../user/service/user.service.impl';
import { JwtService } from '@nestjs/jwt';
import { EventBus } from '../../domain/events/event-bus.service';
import { EnvironmentService } from '../../config/env/env.service';
import { LoggerService } from '../../common/logger/logger.service';
import {
  ConflictError,
  UnauthorizedError,
} from '../../common/errors/app-error';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let userService: jest.Mocked<UserServiceImpl>;
  let jwtService: jest.Mocked<JwtService>;
  let eventBus: jest.Mocked<EventBus>;
  let envService: jest.Mocked<EnvironmentService>;

  const mockUser = {
    id: 'user-123',
    phone: '+2348012345678',
    email: 'test@example.com',
    passwordHash: 'hashed_password',
    role: 'CUSTOMER',
    refreshToken: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserServiceImpl,
          useValue: {
            findByPhone: jest.fn(),
            findByEmail: jest.fn(),
            create: jest.fn(),
            updateRefreshToken: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('signed-token'),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: EventBus,
          useValue: {
            emit: jest.fn(),
          },
        },
        {
          provide: EnvironmentService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_SECRET') return 'test-secret';
              if (key === 'JWT_ACCESS_EXPIRES') return '15m';
              if (key === 'JWT_REFRESH_EXPIRES') return '7d';
              return null;
            }),
            isProduction: jest.fn().mockReturnValue(false),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            child: jest.fn().mockReturnValue({
              info: jest.fn(),
              warn: jest.fn(),
              debug: jest.fn(),
              error: jest.fn(),
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get(UserServiceImpl) as jest.Mocked<UserServiceImpl>;
    jwtService = module.get(JwtService) as jest.Mocked<JwtService>;
    eventBus = module.get(EventBus) as jest.Mocked<EventBus>;
    envService = module.get(
      EnvironmentService,
    ) as jest.Mocked<EnvironmentService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      phone: '+2348012345678',
      password: 'Password123',
      email: 'newuser@example.com',
      name: 'New User',
    };

    it('should register a new user successfully', async () => {
      userService.findByPhone.mockResolvedValue(null);
      userService.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');

      const createdUser = {
        ...mockUser,
        email: registerDto.email,
        phone: registerDto.phone,
      };
      userService.create.mockResolvedValue(createdUser as any);

      const result = await service.register(registerDto);

      expect(result).toEqual({
        userId: createdUser.id,
        role: createdUser.role,
      });
      expect(userService.create).toHaveBeenCalledWith({
        phone: registerDto.phone,
        email: registerDto.email,
        passwordHash: 'hashed_password',
        role: 'CUSTOMER',
        customer: { create: {} },
      });
      expect(eventBus.emit).toHaveBeenCalledWith({
        name: 'user.registered',
        payload: expect.objectContaining({
          userId: createdUser.id,
          email: registerDto.email,
          phone: registerDto.phone,
          name: registerDto.name,
          verificationToken: expect.any(String),
        }),
      });
    });

    it('should throw ConflictError if phone already exists', async () => {
      userService.findByPhone.mockResolvedValue(mockUser as any);
      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictError,
      );
      expect(userService.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictError if email already exists', async () => {
      userService.findByPhone.mockResolvedValue(null);
      userService.findByEmail.mockResolvedValue(mockUser as any);
      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictError,
      );
      expect(userService.create).not.toHaveBeenCalled();
    });

    it('should allow registration without email', async () => {
      const dtoWithoutEmail = { ...registerDto, email: undefined };
      userService.findByPhone.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      userService.create.mockResolvedValue(mockUser as any);

      await service.register(dtoWithoutEmail);
      expect(userService.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: undefined }),
      );
    });
  });

  describe('login', () => {
    const loginDto = {
      phone: '+2348012345678',
      password: 'Password123',
    };

    it('should return tokens on successful login', async () => {
      userService.findByPhone.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      userService.updateRefreshToken.mockResolvedValue({
        ...mockUser,
        refreshToken: 'refresh-token',
      } as any);
      jwtService.sign.mockReturnValue('access-token');

      const result = await service.login(loginDto);

      expect(result).toEqual({
        user: mockUser,
        accessToken: 'access-token',
        refreshToken: 'access-token', // because sign mock returns same
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.passwordHash,
      );
      expect(userService.updateRefreshToken).toHaveBeenCalledWith(
        mockUser.id,
        expect.any(String),
      );
    });

    it('should throw UnauthorizedError if user not found', async () => {
      userService.findByPhone.mockResolvedValue(null);
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError if password invalid', async () => {
      userService.findByPhone.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('logout', () => {
    it('should update refresh token to null', async () => {
      userService.updateRefreshToken.mockResolvedValue({} as any);
      await service.logout(mockUser.id);
      expect(userService.updateRefreshToken).toHaveBeenCalledWith(
        mockUser.id,
        null,
      );
    });
  });

  describe('refreshTokens', () => {
    const refreshToken = 'valid-refresh-token';

    it('should return new access token', async () => {
      jwtService.verifyAsync.mockResolvedValue({ id: mockUser.id });
      userService.findById.mockResolvedValue({
        ...mockUser,
        refreshToken,
      } as any);
      jwtService.sign.mockReturnValue('new-access-token');

      const result = await service.refreshTokens(refreshToken);
      expect(result).toEqual({
        accessToken: 'new-access-token',
        userId: mockUser.id,
      });
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(refreshToken, {
        secret: 'test-secret',
      });
    });

    it('should throw UnauthorizedError if user not found', async () => {
      jwtService.verifyAsync.mockResolvedValue({ id: mockUser.id });
      userService.findById.mockResolvedValue(null);
      await expect(service.refreshTokens(refreshToken)).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it('should throw UnauthorizedError if stored refresh token does not match', async () => {
      jwtService.verifyAsync.mockResolvedValue({ id: mockUser.id });
      userService.findById.mockResolvedValue({
        ...mockUser,
        refreshToken: 'different-token',
      } as any);
      await expect(service.refreshTokens(refreshToken)).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it('should throw UnauthorizedError if verifyAsync fails', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('invalid token'));
      await expect(service.refreshTokens(refreshToken)).rejects.toThrow(
        UnauthorizedError,
      );
    });
  });
});
