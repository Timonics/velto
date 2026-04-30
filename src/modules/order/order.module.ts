import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderRepositoryImpl } from './repository/order.repository.impl';
import { OrderServiceImpl } from './service/order.service.impl';
import { ProductModule } from '../product/product.module'; // for IProductRepository
import { IOrderRepository } from './repository/order.repository.interface';
import { IProductRepository } from '../product/repository/product.repository.interface';
import { EventBus } from 'src/domain/events/event-bus.service';
import { LoggerService } from 'src/common/logger/logger.service';
import { IUserRepository } from '../user/user.repository.interface';
import { UserModule } from '../user/user.module';

@Module({
  imports: [ProductModule, UserModule],
  controllers: [OrderController],
  providers: [
    {
      provide: 'IOrderRepository',
      useClass: OrderRepositoryImpl,
    },
    {
      provide: OrderServiceImpl,
      useFactory: (
        repo: IOrderRepository,
        productRepo: IProductRepository,
        userRepo: IUserRepository,
        eventBus: EventBus,
        logger: LoggerService,
      ) => new OrderServiceImpl(repo, productRepo, userRepo, eventBus, logger),
      inject: [
        'IOrderRepository',
        'IProductRepository',
        'IUserRepository',
        EventBus,
        LoggerService,
      ],
    },
  ],
  exports: ['IOrderRepository'],
})
export class OrderModule {}
