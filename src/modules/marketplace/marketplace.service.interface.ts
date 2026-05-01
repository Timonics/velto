import { SearchQueryDto } from './dto/search-query.dto';

export interface SearchResult<T> {
  items: T[];
  total: number;
  skip?: number;
  take?: number;
}

export interface IMarketplaceService {
  searchTenants(query: SearchQueryDto): Promise<SearchResult<any>>;
  searchProducts(query: SearchQueryDto): Promise<SearchResult<any>>;
  searchServices(query: SearchQueryDto): Promise<SearchResult<any>>;
}
