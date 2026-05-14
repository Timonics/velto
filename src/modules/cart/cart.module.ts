import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { ProductModule } from '../product/product.module';
import { CacheModule } from '../../infrastructure/cache/cache.module';
import { OrderModule } from '../order/order.module'; // import OrderModule

@Module({
  imports: [ProductModule, CacheModule, OrderModule],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
