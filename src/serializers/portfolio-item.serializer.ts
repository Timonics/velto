import { BaseSerializer } from './base.serializer';
import { PortfolioItem } from 'generated/prisma/client';

export interface PortfolioItemResponse {
  id: string;
  mediaUrl: string;
  caption: string | null;
  createdAt: string | null;
//   updatedAt: string | null;
}

export class PortfolioItemSerializer extends BaseSerializer<PortfolioItem, PortfolioItemResponse> {
  serialize(item: PortfolioItem): PortfolioItemResponse {
    return {
      id: item.id,
      mediaUrl: this.sanitizeUrl(item.mediaUrl) as string,
      caption: item.caption,
      createdAt: this.formatDate(item.createdAt),
    //   updatedAt: this.formatDate(item.updatedAt),
    };
  }
}