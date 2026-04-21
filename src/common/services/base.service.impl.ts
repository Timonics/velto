/**
 * Base Service Implementation – Abstract class with common business logic.
 *
 * Features:
 * - Automatic NotFoundException when entity missing.
 * - Logging hooks (override sanitizeForLog).
 * - Standard CRUD.
 *
 * Specific services extend this class.
 */

import { NotFoundException } from '@nestjs/common';
import { IBaseService } from './base.service.interface';
import { IBaseRepository } from '../repositories/base.repository.interface';
import { LoggerService } from '../logger/logger.service';

export abstract class BaseServiceImpl<
  TModel,
  TCreateDto,
  TUpdateDto,
> implements IBaseService<TModel, TCreateDto, TUpdateDto> {
  protected abstract readonly logger: LoggerService;
  protected abstract readonly entityName: string;

  constructor(
    protected readonly repository: IBaseRepository<
      TModel,
      TCreateDto,
      TUpdateDto
    >,
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
      throw new NotFoundException(`${this.entityName} with ID ${id} not found`);
    }
    return entity;
  }

  async create(data: TCreateDto): Promise<TModel> {
    this.logger.info(`Creating new ${this.entityName}`, {
      data: this.sanitizeForLog(data),
    });
    return this.repository.create(data);
  }

  async update(id: string, data: TUpdateDto): Promise<TModel> {
    this.logger.info(`Updating ${this.entityName}`, {
      id,
      data: this.sanitizeForLog(data),
    });
    await this.findById(id); // ensure exists
    return this.repository.update(id, data);
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
}
