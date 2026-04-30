import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { BaseServiceImpl } from '../../../common/services/base.service.impl';
import { IProductService } from './product.service.interface';
import { IProductRepository } from '../repository/product.repository.interface';
import { Product, Prisma } from 'generated/prisma/client';
import { CreateProductDto, UpdateProductDto } from '../dto';
import { LoggerService } from '../../../common/logger/logger.service';
import { ILogger } from '../../../common/logger/logger.interface';

@Injectable()
export class ProductServiceImpl
  extends BaseServiceImpl<
    Product,
    CreateProductDto,
    UpdateProductDto,
    Prisma.ProductCreateInput,
    Prisma.ProductUpdateInput
  >
  implements IProductService
{
  protected readonly logger: ILogger;
  protected readonly entityName = 'Product';

  constructor(
    @Inject('IProductRepository')
    protected readonly repository: IProductRepository,
    logger: LoggerService,
  ) {
    super(repository);
    this.logger = logger.child('ProductService');
  }

  // Mapping methods for cases where DTO doesn't exactly match Prisma input (they do, so no mapping needed here, but override if necessary)
  protected mapToCreateInput(
    dto: CreateProductDto & { tenantId: string },
  ): Prisma.ProductCreateInput {
    return {
      name: dto.name,
      description: dto.description,
      price: dto.price,
      stock: dto.stock,
      category: dto.category,
      mediaUrls: dto.mediaUrls || [],
      isAvailable: true,
      tenant: { connect: { id: dto.tenantId } },
    };
  }

  async getProductsByTenant(
    tenantId: string,
    skip = 0,
    take = 20,
  ): Promise<Product[]> {
    return this.repository.findByTenantId(tenantId, skip, take);
  }

  async getProductsByCategory(
    category: string,
    skip = 0,
    take = 20,
  ): Promise<Product[]> {
    return this.repository.findByCategory(category, skip, take);
  }

  async updateStock(productId: string, quantity: number): Promise<Product> {
    const product = await this.findById(productId);
    if (product.stock < quantity) {
      throw new Error('Insufficient stock');
    }
    return this.repository.updateStock(productId, quantity);
  }

  async create(
    data: CreateProductDto & { tenantId: string },
  ): Promise<Product> {
    const input = this.mapToCreateInput(data);
    return this.repository.create(input);
  }
}
