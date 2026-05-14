/**
 * Base Repository Implementation.
 *
 * Specific repositories extend this class and add custom methods.
 *
 * @template TDelegate - Prisma model delegate (e.g., prisma.user)
 * @template TModel - Prisma model type
 * @template TCreateInput - Prisma create input type
 * @template TUpdateInput - Prisma update input type
 */

import { PrismaService } from '../../infrastructure/database/prisma.service';
import {
  IBaseRepository,
  FindManyOptions,
  FindOneOptions,
} from './base.repository.interface';

export abstract class BaseRepositoryImpl<
  TDelegate,
  TModel,
  TCreateInput,
  TUpdateInput,
> implements IBaseRepository<TModel, TCreateInput, TUpdateInput> {
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly modelDelegate: TDelegate,
    protected readonly delegateName: string,
  ) {}

  /**
   * Returns the correct delegate: the transactional client if provided, else the default.
   */
  protected getDelegate(tx?: any): any {
    if (tx) {
      // Transactional client has the same shape, with all models available.
      return tx[this.delegateName];
    }
    return this.modelDelegate;
  }

  async findById(
    id: string,
    include?: Record<string, boolean>,
    tx?: any,
  ): Promise<TModel | null> {
    const delegate = this.getDelegate(tx);
    return delegate.findUnique({
      where: { id },
      include,
    });
  }

  async findOne(options: FindOneOptions, tx?: any): Promise<TModel | null> {
    const delegate = this.getDelegate(tx);
    return delegate.findFirst(options);
  }

  async findMany(options: FindManyOptions, tx?: any): Promise<TModel[]> {
    const delegate = this.getDelegate(tx);
    return delegate.findMany(options);
  }

  async count(where?: any, tx?: any): Promise<number> {
    const delegate = this.getDelegate(tx);
    return delegate.count({ where });
  }

  async create(data: TCreateInput, tx?: any): Promise<TModel> {
    const delegate = this.getDelegate(tx);
    return delegate.create({ data });
  }

  async update(id: string, data: TUpdateInput, tx?: any): Promise<TModel> {
    const delegate = this.getDelegate(tx);
    return delegate.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, tx?: any): Promise<TModel> {
    const delegate = this.getDelegate(tx);
    return delegate.delete({ where: { id } });
  }

  async exists(where: any, tx?: any): Promise<boolean> {
    const count = await this.count(where, tx);
    return count > 0;
  }
}
