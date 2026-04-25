/**
 * Base Service Implementation – Abstract class with common business logic.
 *
 * Features:
 * - Automatic NotFoundException when entity missing.
 * - Logging hooks (override sanitizeForLog).
 * - Standard CRUD operations.
 * - Mapping functions for create/update (allows DTO → Prisma input conversion).
 *
 * @template TModel - The Prisma model type (e.g., Tenant, Post)
 * @template TCreateDto - DTO for creation (e.g., CreateTenantDto)
 * @template TUpdateDto - DTO for update (e.g., UpdateTenantDto)
 * @template TCreateInput - Prisma create input type (e.g., Prisma.TenantCreateInput)
 * @template TUpdateInput - Prisma update input type (e.g., Prisma.TenantUpdateInput)
 */

import { IBaseService } from './base.service.interface';
import { IBaseRepository } from '../repositories/base.repository.interface';
import { NotFoundError } from '../errors/app-error';
import { ILogger } from '../logger/logger.interface';

export abstract class BaseServiceImpl<
  TModel,
  TCreateDto,
  TUpdateDto,
  TCreateInput = TCreateDto,
  TUpdateInput = TUpdateDto,
> implements IBaseService<TModel, TCreateDto, TUpdateDto>
{
  protected abstract readonly logger: ILogger;
  protected abstract readonly entityName: string;

  constructor(
    protected readonly repository: IBaseRepository<TModel, TCreateInput, TUpdateInput>,
  ) {}

  async findAll(skip = 0, take = 20, where?: any): Promise<TModel[]> {
    this.logger.debug(`Finding all ${this.entityName}s`, { skip, take });
    return this.repository.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<TModel> {
    this.logger.debug(`Finding ${this.entityName} by ID`, { id });
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new NotFoundError(this.entityName, id);
    }
    return entity;
  }

  async create(data: TCreateDto): Promise<TModel> {
    this.logger.info(`Creating new ${this.entityName}`, {
      data: this.sanitizeForLog(data),
    });
    const input = this.mapToCreateInput(data);
    return this.repository.create(input);
  }

  async update(id: string, data: TUpdateDto): Promise<TModel> {
    this.logger.info(`Updating ${this.entityName}`, {
      id,
      data: this.sanitizeForLog(data),
    });
    await this.findById(id); // ensure exists
    const input = this.mapToUpdateInput(data);
    return this.repository.update(id, input);
  }

  async delete(id: string): Promise<TModel> {
    this.logger.info(`Deleting ${this.entityName}`, { id });
    await this.findById(id);
    return this.repository.delete(id);
  }

  async count(where?: any): Promise<number> {
    return this.repository.count(where);
  }

  /**
   * Override in child classes to remove sensitive data from logs.
   */
  protected sanitizeForLog(data: any): any {
    return data;
  }

  /**
   * Map create DTO to repository create input.
   * Override when the DTO does not match the repository input type.
   */
  protected mapToCreateInput(dto: TCreateDto): TCreateInput {
    return dto as unknown as TCreateInput;
  }

  /**
   * Map update DTO to repository update input.
   * Override when the DTO does not match the repository input type.
   */
  protected mapToUpdateInput(dto: TUpdateDto): TUpdateInput {
    return dto as unknown as TUpdateInput;
  }
}