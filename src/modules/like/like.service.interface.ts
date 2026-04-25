export interface ILikeService {
  like(postId: string, userId: string): Promise<void>;
  unlike(postId: string, userId: string): Promise<void>;
  isLiked(postId: string, userId: string): Promise<boolean>;
  getLikeCount(postId: string): Promise<number>;
}
