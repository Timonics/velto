import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductRepositoryImpl } from './repository/product.repository.impl';
import { ProductServiceImpl } from './service/product.service.impl';
import { LoggerService } from 'src/common/logger/logger.service';

@Module({
  controllers: [ProductController],
  providers: [
    {
      provide: 'IProductRepository',
      useClass: ProductRepositoryImpl,
    },
    {
      provide: ProductServiceImpl,
      useFactory: (repo: ProductRepositoryImpl, logger: LoggerService) => {
        return new ProductServiceImpl(repo, logger);
      },
      inject: ['IProductRepository', LoggerService],
    },
  ],
  exports: [ProductServiceImpl, 'IProductRepository'],
})
export class ProductModule {}
