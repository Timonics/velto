import { Module } from '@nestjs/common';
import { SeoController } from './seo.controller';
import { SeoService } from './seo.service';
import { TenantModule } from '../tenant/tenant.module';
import { ProductModule } from '../product/product.module';
import { LoggerModule } from '../../common/logger/logger.module';
import { EnvironmentModule } from '../../config/env/env.module';

@Module({
  imports: [TenantModule, ProductModule, LoggerModule, EnvironmentModule],
  controllers: [SeoController],
  providers: [SeoService],
  exports: [SeoService],
})
export class SeoModule {}
