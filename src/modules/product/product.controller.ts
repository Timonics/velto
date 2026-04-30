import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateProductDto, UpdateProductDto } from './dto';
import {
  ProductSerializer,
  ProductResponse,
} from '../../serializers/product.serializer';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { TenantOwnerGuard } from '../../common/guards/tenant-owner.guard';
import { Public } from '../../common/decorators/public.decorator';
import {
  createSuccessResponse,
  ApiResponse,
} from '../../common/dto/api-response.dto';
import { Tenant } from 'generated/prisma/client';
import { ProductServiceImpl } from './service/product.service.impl';

@Controller('products')
export class ProductController {
  private readonly serializer = new ProductSerializer();

  constructor(
    private readonly productService: ProductServiceImpl,
  ) {}

  @Public()
  @Get('tenant/:tenantId')
  async getByTenant(
    @Param('tenantId') tenantId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<ApiResponse<ProductResponse[]>> {
    const products = await this.productService.getProductsByTenant(
      tenantId,
      skip ? parseInt(skip, 10) : 0,
      take ? parseInt(take, 10) : 20,
    );
    return createSuccessResponse(this.serializer.serializeMany(products));
  }

  @Public()
  @Get('category/:category')
  async getByCategory(
    @Param('category') category: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<ApiResponse<ProductResponse[]>> {
    const products = await this.productService.getProductsByCategory(
      category,
      skip ? parseInt(skip, 10) : 0,
      take ? parseInt(take, 10) : 20,
    );
    return createSuccessResponse(this.serializer.serializeMany(products));
  }

  @Post()
  @UseGuards(TenantOwnerGuard)
  async create(
    @Body() data: CreateProductDto,
    @CurrentTenant() tenant: Tenant,
  ): Promise<ApiResponse<ProductResponse>> {
    const product = await this.productService.create({
      ...data,
      tenantId: tenant.id,
    });
    return createSuccessResponse(this.serializer.serialize(product));
  }

  @Patch(':id')
  @UseGuards(TenantOwnerGuard)
  async update(
    @Param('id') id: string,
    @Body() data: UpdateProductDto,
  ): Promise<ApiResponse<ProductResponse>> {
    const product = await this.productService.update(id, data);
    return createSuccessResponse(this.serializer.serialize(product));
  }

  @Delete(':id')
  @UseGuards(TenantOwnerGuard)
  async delete(@Param('id') id: string): Promise<ApiResponse<null>> {
    await this.productService.delete(id);
    return createSuccessResponse(null, 'Product deleted successfully');
  }
}
