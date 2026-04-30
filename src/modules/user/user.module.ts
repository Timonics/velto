import { Module, Global } from '@nestjs/common';
import { UserRepositoryImpl } from './user.repository.impl';
import { UserServiceImpl } from './user.service.impl';
import { IUserRepository } from './user.repository.interface';
import { LoggerService } from 'src/common/logger/logger.service';

@Global()
@Module({
  providers: [
    { provide: 'IUserRepository', useClass: UserRepositoryImpl },
    {
      provide: UserServiceImpl,
      useFactory: (repo: IUserRepository, logger: LoggerService) =>
        new UserServiceImpl(repo, logger),
      inject: ['IUserRepository', LoggerService],
    },
  ],
  exports: [UserServiceImpl, 'IUserRepository'],
})
export class UserModule {}
