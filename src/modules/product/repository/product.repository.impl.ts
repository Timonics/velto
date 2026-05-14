import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { BaseRepositoryImpl } from '../../../common/repositories/base.repository.impl';
import { IProductRepository } from './product.repository.interface';
import { Product, Prisma, Category } from 'generated/prisma/client';

@Injectable()
export class ProductRepositoryImpl
  extends BaseRepositoryImpl<
    Prisma.ProductDelegate,
    Product,
    Prisma.ProductCreateInput,
    Prisma.ProductUpdateInput
  >
  implements IProductRepository
{
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, prisma.product, 'product');
  }

  async findByTenantId(
    tenantId: string,
    skip = 0,
    take = 20,
  ): Promise<Product[]> {
    return this.modelDelegate.findMany({
      where: { tenantId, isAvailable: true },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByCategory(
    category: Category,
    skip = 0,
    take = 20,
  ): Promise<Product[]> {
    return this.modelDelegate.findMany({
      where: { category, isAvailable: true },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStock(
    productId: string,
    quantity: number,
    tx?: any,
  ): Promise<Product> {
    const delegate = this.getDelegate(tx);
    return delegate.update({
      where: { id: productId },
      data: { stock: { decrement: quantity } },
    });
  }
}
