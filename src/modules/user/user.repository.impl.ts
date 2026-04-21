import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { BaseRepositoryImpl } from '../../common/repositories/base.repository.impl';
import { IUserRepository } from './user.repository.interface';
import { User, Prisma, Role } from 'generated/prisma/client';

@Injectable()
export class UserRepositoryImpl
  extends BaseRepositoryImpl<
    Prisma.UserDelegate,
    User,
    Prisma.UserCreateInput,
    Prisma.UserUpdateInput
  >
  implements IUserRepository
{
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, prisma.user);
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.modelDelegate.findUnique({ where: { phone } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.modelDelegate.findUnique({ where: { email } });
  }

  async updateRefreshToken(
    userId: string,
    refreshToken: string | null,
  ): Promise<User> {
    return this.modelDelegate.update({
      where: { id: userId },
      data: { refreshToken },
    });
  }
}
