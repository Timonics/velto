import { BaseSerializer, SerializerOptions } from './base.serializer';
import { Post } from '@prisma/client';

export interface PostResponse {
  id: string;
  mediaUrl: string;
  mediaType: string;
  caption: string | null;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isPublished: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  tenant: {
    businessName: string;
    slug: string;
    logoUrl: string | null;
  } | null;
}

export class PostSerializer extends BaseSerializer<Post, PostResponse> {
  serialize(post: any, options?: SerializerOptions): PostResponse {
    return {
      id: post.id,
      mediaUrl: this.sanitizeUrl(post.mediaUrl) as string,
      mediaType: post.mediaType,
      caption: post.caption,
      likesCount: post.likesCount,
      commentsCount: post.commentsCount,
      sharesCount: post.sharesCount,
      isPublished: post.isPublished,
      createdAt: options?.includeTimestamps
        ? this.formatDate(post.createdAt)
        : null,
      updatedAt: options?.includeTimestamps
        ? this.formatDate(post.updatedAt)
        : null,
      tenant: post.tenant
        ? {
            businessName: post.tenant.businessName,
            slug: post.tenant.slug,
            logoUrl: this.sanitizeUrl(post.tenant.logoUrl),
          }
        : null,
    };
  }
}
