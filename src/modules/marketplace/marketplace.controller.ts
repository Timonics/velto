import { Controller, Get, Query, Inject } from '@nestjs/common';
import { SearchQueryDto } from './dto/search-query.dto';
import {
  TenantSerializer,
  TenantResponse,
} from '../../serializers/tenant.serializer';
import {
  ProductSerializer,
  ProductResponse,
} from '../../serializers/product.serializer';
import {
  ServiceSerializer,
  ServiceResponse,
} from '../../serializers/service.serializer';
import { Public } from '../../common/decorators/public.decorator';
import {
  createSuccessResponse,
  ApiResponse,
} from '../../common/dto/api-response.dto';
import { MarketplaceServiceImpl } from './marketplace.service.impl';
import { EnvironmentService } from 'src/config/env/env.service';

@Controller('marketplace')
@Public()
export class MarketplaceController {
  private readonly tenantSerializer: TenantSerializer;
  private readonly productSerializer = new ProductSerializer();
  private readonly serviceSerializer = new ServiceSerializer();

  constructor(
    private readonly marketplaceService: MarketplaceServiceImpl,
    private readonly env: EnvironmentService,
  ) {
    this.tenantSerializer = new TenantSerializer(this.env.get('APP_DOMAIN'));
  }

  @Get('tenants')
  async searchTenants(
    @Query() query: SearchQueryDto,
  ): Promise<ApiResponse<{ items: TenantResponse[]; total: number }>> {
    const result = await this.marketplaceService.searchTenants(query);
    return createSuccessResponse({
      items: this.tenantSerializer.serializeMany(result.items),
      total: result.total,
    });
  }

  @Get('products')
  async searchProducts(
    @Query() query: SearchQueryDto,
  ): Promise<ApiResponse<{ items: ProductResponse[]; total: number }>> {
    const result = await this.marketplaceService.searchProducts(query);
    return createSuccessResponse({
      items: this.productSerializer.serializeMany(result.items),
      total: result.total,
    });
  }

  @Get('services')
  async searchServices(
    @Query() query: SearchQueryDto,
  ): Promise<ApiResponse<{ items: ServiceResponse[]; total: number }>> {
    const result = await this.marketplaceService.searchServices(query);
    return createSuccessResponse({
      items: this.serviceSerializer.serializeMany(result.items),
      total: result.total,
    });
  }
}
