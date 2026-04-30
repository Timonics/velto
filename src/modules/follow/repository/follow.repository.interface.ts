import { IBaseRepository } from '../../../common/repositories/base.repository.interface';
import { Follow, Prisma } from 'generated/prisma/client';

export interface IFollowRepository extends IBaseRepository<
  Follow,
  Prisma.FollowCreateInput,
  Prisma.FollowUpdateInput
> {
  findByFollowerAndTenant(
    followerId: string,
    tenantId: string,
  ): Promise<Follow | null>;
  findFollowedTenantIds(followerId: string): Promise<string[]>;
  countTenantFollowers(tenantId: string): Promise<number>;
}
