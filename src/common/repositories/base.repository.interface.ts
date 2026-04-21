/**
 * Base Repository Interface – Defines the contract for all repositories.
 * 
 * Why an interface?
 * - Business logic depends on abstractions, not concrete implementations.
 * - Allows swapping Prisma for another ORM later.
 * - Makes unit testing easy (mock the interface).
 * - Forces consistent API across all repositories.
 * 
 * @template TModel - The Prisma model type (e.g., User, Tenant)
 * @template TCreateInput - Prisma create input type
 * @template TUpdateInput - Prisma update input type
 */

export interface FindManyOptions<T = any> {
  where?: T;
  skip?: number;
  take?: number;
  orderBy?: Record<string, 'asc' | 'desc'>;
  include?: Record<string, boolean>;
}

export interface FindOneOptions<T = any> {
  where: T;
  include?: Record<string, boolean>;
}

export interface IBaseRepository<TModel, TCreateInput, TUpdateInput> {
  /**
   * Find a record by its unique ID.
   * Returns null if not found.
   */
  findById(id: string, include?: Record<string, boolean>): Promise<TModel | null>;

  /**
   * Find a single record matching criteria.
   */
  findOne(options: FindOneOptions): Promise<TModel | null>;

  /**
   * Find multiple records with pagination and filtering.
   */
  findMany(options: FindManyOptions): Promise<TModel[]>;

  /**
   * Count records matching criteria.
   */
  count(where?: any): Promise<number>;

  /**
   * Create a new record.
   */
  create(data: TCreateInput): Promise<TModel>;

  /**
   * Update a record by ID.
   */
  update(id: string, data: TUpdateInput): Promise<TModel>;

  /**
   * Delete a record by ID (hard delete).
   * Override in child classes for soft delete.
   */
  delete(id: string): Promise<TModel>;

  /**
   * Check if a record exists matching criteria.
   */
  exists(where: any): Promise<boolean>;
}