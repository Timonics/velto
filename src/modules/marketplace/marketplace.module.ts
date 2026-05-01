import { Module } from '@nestjs/common';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceServiceImpl } from './marketplace.service.impl';
import { TenantModule } from '../tenant/tenant.module';
import { ProductModule } from '../product/product.module';
import { ServiceModule } from '../service/service.module';
import { ITenantRepository } from '../tenant/repository/tenant.repository.interface';
import { IServiceRepository } from '../service/repository/service.repository.interface';
import { IProductRepository } from '../product/repository/product.repository.interface';

@Module({
  imports: [TenantModule, ProductModule, ServiceModule],
  controllers: [MarketplaceController],
  providers: [
    {
      provide: MarketplaceServiceImpl,
      useFactory: (
        tenantRepo: ITenantRepository,
        productRepo: IProductRepository,
        serviceRepo: IServiceRepository,
      ) => new MarketplaceServiceImpl(tenantRepo, productRepo, serviceRepo),
      inject: ['ITenantRepository', 'IProductRepository', 'IServiceRepository'],
    },
  ],
  exports: [MarketplaceServiceImpl],
})
export class MarketplaceModule {}
