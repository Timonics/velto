import { Injectable } from '@nestjs/common';
import { IUserService } from './user.service.interface';
import { Prisma, User } from 'generated/prisma/client';
import { LoggerService } from '../../../common/logger/logger.service';
import { ILogger } from '../../../common/logger/logger.interface';
import { BaseServiceImpl } from '../../../common/services/base.service.impl';
import { IUserRepository } from '../repository/user.repository.interface';

@Injectable()
export class UserServiceImpl
  extends BaseServiceImpl<User, Prisma.UserCreateInput, Prisma.UserUpdateInput>
  implements IUserService
{
  protected readonly logger: ILogger;
  protected readonly entityName = 'User';

  constructor(
    protected readonly repository: IUserRepository,
    logger: LoggerService,
  ) {
    super(repository);
    this.logger = logger.child('UserService');
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.repository.findByPhone(phone);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findByEmail(email);
  }

  async updateRefreshToken(
    userId: string,
    refreshToken: string | null,
  ): Promise<User> {
    return this.repository.updateRefreshToken(userId, refreshToken);
  }
}
