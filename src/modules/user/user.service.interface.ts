import { Prisma, User } from 'generated/prisma/client';

export interface IUserService {
  create(data: Prisma.UserCreateInput): Promise<User>;
  findById(id: string): Promise<User>;
  findByPhone(phone: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  updateRefreshToken(userId: string, refreshToken: string | null): Promise<User>;
  // add other business methods as needed
}