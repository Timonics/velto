import { IBaseService } from '../../../common/services/base.service.interface';
import { Product } from 'generated/prisma/client';
import { CreateProductDto, UpdateProductDto } from '../dto';

export interface IProductService extends IBaseService<
  Product,
  CreateProductDto,
  UpdateProductDto
> {
  create(dto: CreateProductDto & { tenantId: string }): Promise<Product>;
  getProductsByTenant(
    tenantId: string,
    skip?: number,
    take?: number,
  ): Promise<Product[]>;
  getProductsByCategory(
    category: string,
    skip?: number,
    take?: number,
  ): Promise<Product[]>;
  updateStock(productId: string, quantity: number): Promise<Product>;
}
