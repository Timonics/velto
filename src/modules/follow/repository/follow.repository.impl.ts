import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { BaseRepositoryImpl } from '../../../common/repositories/base.repository.impl';
import { IFollowRepository } from './follow.repository.interface';
import { Follow, Prisma } from 'generated/prisma/client';

@Injectable()
export class FollowRepositoryImpl
  extends BaseRepositoryImpl<
    Prisma.FollowDelegate,
    Follow,
    Prisma.FollowCreateInput,
    Prisma.FollowUpdateInput
  >
  implements IFollowRepository
{
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, prisma.follow);
  }

  async findByFollowerAndTenant(
    followerId: string,
    tenantId: string,
  ): Promise<Follow | null> {
    return this.modelDelegate.findUnique({
      where: { followerId_tenantId: { followerId, tenantId } },
    });
  }

  async findFollowedTenantIds(followerId: string): Promise<string[]> {
    const follows = await this.modelDelegate.findMany({
      where: { followerId },
      select: { tenantId: true },
    });
    return follows.map((f) => f.tenantId);
  }

  async countTenantFollowers(tenantId: string): Promise<number> {
    return this.modelDelegate.count({ where: { tenantId } });
  }
}
