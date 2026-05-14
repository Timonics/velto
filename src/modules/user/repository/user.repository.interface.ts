import { IBaseRepository } from '../../../common/repositories/base.repository.interface';
import { User, Prisma } from 'generated/prisma/client';

export interface IUserRepository extends IBaseRepository<
  User,
  Prisma.UserCreateInput,
  Prisma.UserUpdateInput
> {
  /**
   * Find a user by phone number (unique).
   */
  findByPhone(phone: string): Promise<User | null>;

  /**
   * Find a user by email (optional, unique).
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Update refresh token (used during login/logout).
   */
  updateRefreshToken(
    userId: string,
    refreshToken: string | null,
  ): Promise<User>;
}
