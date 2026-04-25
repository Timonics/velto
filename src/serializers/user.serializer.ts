import { BaseSerializer, SerializerOptions } from './base.serializer';
import { User } from 'generated/prisma/client';

export interface UserResponse {
  id: string;
  phone: string;
  email: string | null;
  role: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export class UserSerializer extends BaseSerializer<User, UserResponse> {
  serialize(user: User, options?: SerializerOptions): UserResponse {
    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      role: user.role,
      createdAt: options?.includeTimestamps
        ? this.formatDate(user.createdAt)
        : null,
      updatedAt: options?.includeTimestamps
        ? this.formatDate(user.updatedAt)
        : null,
    };
  }
}
