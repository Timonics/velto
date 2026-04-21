/**
 * AuthModule – Wiring for authentication components.
 * 
 * Imports JwtModule asynchronously to use validated environment variables.
 * Registers AuthService, AuthController, and binds IUserRepository to UserRepositoryImpl.
 * 
 * The UserRepositoryImpl is provided by the global UserModule, so we don't need to
 * explicitly provide it here if UserModule is imported. But we keep explicit for clarity.
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { IUserRepository } from '../user/user.repository.interface';
import { UserRepositoryImpl } from '../user/user.repository.impl';
import { EnvironmentService } from '../../config/env/env.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [EnvironmentService],
      useFactory: (env: EnvironmentService) => ({
        secret: env.getJwtSecret(),
        signOptions: { expiresIn: env.get('JWT_ACCESS_EXPIRES') },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: IUserRepository,
      useClass: UserRepositoryImpl,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}