/**
 * Base Service Interface – Contract for all business services.
 */

export interface IBaseService<TModel, TCreateDto, TUpdateDto> {
  findAll(skip?: number, take?: number, where?: any): Promise<TModel[]>;
  findById(id: string): Promise<TModel>;
  create(data: TCreateDto): Promise<TModel>;
  update(id: string, data: TUpdateDto): Promise<TModel>;
  delete(id: string): Promise<TModel>;
  count(where?: any): Promise<number>;
}
