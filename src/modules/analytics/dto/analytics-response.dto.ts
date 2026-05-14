export interface RevenueBySourceItem {
  source: string;
  revenue: number;
  orders: number;
}

export interface RevenueBySourceSummary {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
}

export interface RevenueBySourceResponse {
  sources: RevenueBySourceItem[];
  summary: RevenueBySourceSummary;
}

export interface TopProductResponse {
  productId: string;
  name: string;
  totalSold: number;
  revenue: number;
}

export interface OrderCountResponse {
  totalOrders: number;
}
