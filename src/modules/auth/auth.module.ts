import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserServiceImpl } from '../user/user.service.impl';
import { EnvironmentService } from '../../config/env/env.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [EnvironmentService],
      useFactory: (env: EnvironmentService) => ({
        secret: env.get('JWT_SECRET'),
        signOptions: { expiresIn: env.get('JWT_ACCESS_EXPIRES') as any },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}