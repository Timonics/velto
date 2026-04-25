import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepositoryImpl } from './user.repository.impl';
import { IUserService } from './user.service.interface';
import { Prisma, User } from 'generated/prisma/client';
import { LoggerService } from '../../common/logger/logger.service';
import { ILogger } from '../../common/logger/logger.interface';

@Injectable()
export class UserServiceImpl implements IUserService {
  private readonly logger: ILogger;

  constructor(
    private readonly userRepository: UserRepositoryImpl,
    logger: LoggerService,
  ) {
    this.logger = logger.child('UserService');
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.userRepository.create(data);
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return user;
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.userRepository.findByPhone(phone);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async updateRefreshToken(
    userId: string,
    refreshToken: string | null,
  ): Promise<User> {
    return this.userRepository.updateRefreshToken(userId, refreshToken);
  }
}
