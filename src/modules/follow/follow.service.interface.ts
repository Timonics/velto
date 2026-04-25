export interface IFollowService {
  follow(followerId: string, tenantId: string): Promise<void>;
  unfollow(followerId: string, tenantId: string): Promise<void>;
  isFollowing(followerId: string, tenantId: string): Promise<boolean>;
  getFollowedTenantIds(followerId: string): Promise<string[]>;
  getTenantFollowersCount(tenantId: string): Promise<number>;
}
