import { Inject, Injectable } from '@nestjs/common';
import { IFollowRepository } from '../repository/follow.repository.interface';
import { IFollowService } from './follow.service.interface';
import { ConflictError, NotFoundError } from '../../../common/errors/app-error';
import { LoggerService } from '../../../common/logger/logger.service';
import { EventBus } from '../../../domain/events/event-bus.service';
import { FOLLOW_EVENTS } from '../../../domain/events/event-types';
import { ILogger } from 'src/common/logger/logger.interface';

@Injectable()
export class FollowServiceImpl implements IFollowService {
  private readonly logger: ILogger;

  constructor(
    private readonly followRepository: IFollowRepository,
    private readonly eventBus: EventBus,
    logger: LoggerService,
  ) {
    this.logger = logger.child('FollowService');
  }

  async follow(followerId: string, tenantId: string): Promise<void> {
    const existing = await this.followRepository.findByFollowerAndTenant(
      followerId,
      tenantId,
    );
    if (existing) throw new ConflictError('Already following this tenant');

    await this.followRepository.create({
      follower: { connect: { id: followerId } },
      tenant: { connect: { id: tenantId } },
    });

    await this.eventBus.emit({
      name: FOLLOW_EVENTS.FOLLOWED,
      payload: { followerId, tenantId },
    });
    this.logger.info(`User ${followerId} followed tenant ${tenantId}`);
  }

  async unfollow(followerId: string, tenantId: string): Promise<void> {
    const existing = await this.followRepository.findByFollowerAndTenant(
      followerId,
      tenantId,
    );
    if (!existing) throw new NotFoundError('Follow relationship');

    await this.followRepository.delete(existing.id);
    await this.eventBus.emit({
      name: FOLLOW_EVENTS.UNFOLLOWED,
      payload: { followerId, tenantId },
    });
    this.logger.info(`User ${followerId} unfollowed tenant ${tenantId}`);
  }

  async isFollowing(followerId: string, tenantId: string): Promise<boolean> {
    const follow = await this.followRepository.findByFollowerAndTenant(
      followerId,
      tenantId,
    );
    return !!follow;
  }

  async getFollowedTenantIds(followerId: string): Promise<string[]> {
    return this.followRepository.findFollowedTenantIds(followerId);
  }

  async getTenantFollowersCount(tenantId: string): Promise<number> {
    return this.followRepository.countTenantFollowers(tenantId);
  }
}
