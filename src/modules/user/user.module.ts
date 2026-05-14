import { Module, Global } from '@nestjs/common';
import { UserRepositoryImpl } from './repository/user.repository.impl';
import { UserServiceImpl } from './service/user.service.impl';
import { IUserRepository } from './repository/user.repository.interface';
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
