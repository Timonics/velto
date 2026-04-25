import { Module, Global } from '@nestjs/common';
import { UserRepositoryImpl } from './user.repository.impl';
import { UserServiceImpl } from './user.service.impl';

@Global()
@Module({
  providers: [UserRepositoryImpl, UserServiceImpl],
  exports: [UserServiceImpl, UserRepositoryImpl],
})
export class UserModule {}
