/**
 * Base Repository Implementation.
 *
 * This class implements IBaseRepository and provides common CRUD operations.
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
  ) {}

  async findById(
    id: string,
    include?: Record<string, boolean>,
  ): Promise<TModel | null> {
    // @ts-expect-error - Prisma delegate types are complex; runtime works
    return this.modelDelegate.findUnique({
      where: { id },
      include,
    });
  }

  async findOne(options: FindOneOptions): Promise<TModel | null> {
    // @ts-expect-error
    return this.modelDelegate.findFirst(options);
  }

  async findMany(options: FindManyOptions): Promise<TModel[]> {
    // @ts-expect-error
    return this.modelDelegate.findMany(options);
  }

  async count(where?: any): Promise<number> {
    // @ts-expect-error
    return this.modelDelegate.count({ where });
  }

  async create(data: TCreateInput): Promise<TModel> {
    // @ts-expect-error
    return this.modelDelegate.create({ data });
  }

  async update(id: string, data: TUpdateInput): Promise<TModel> {
    // @ts-expect-error
    return this.modelDelegate.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<TModel> {
    // @ts-expect-error
    return this.modelDelegate.delete({ where: { id } });
  }

  async exists(where: any): Promise<boolean> {
    const count = await this.count(where);
    return count > 0;
  }
}
