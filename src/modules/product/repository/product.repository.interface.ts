import { IBaseRepository } from '../../../common/repositories/base.repository.interface';
import { Product, Prisma } from 'generated/prisma/client';

export interface IProductRepository extends IBaseRepository<
  Product,
  Prisma.ProductCreateInput,
  Prisma.ProductUpdateInput
> {
  findByTenantId(
    tenantId: string,
    skip?: number,
    take?: number,
  ): Promise<Product[]>;
  findByCategory(
    category: string,
    skip?: number,
    take?: number,
  ): Promise<Product[]>;
  updateStock(productId: string, quantity: number, tx?: any): Promise<Product>;
}
