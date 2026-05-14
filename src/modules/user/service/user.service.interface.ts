import { Prisma, User } from 'generated/prisma/client';
import { IBaseService } from '../../../common/services/base.service.interface';

export interface IUserService extends IBaseService<
  User,
  Prisma.UserCreateInput,
  Prisma.UserUpdateInput
> {
  findByPhone(phone: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  updateRefreshToken(
    userId: string,
    refreshToken: string | null,
  ): Promise<User>;
  // add other business methods as needed
}
