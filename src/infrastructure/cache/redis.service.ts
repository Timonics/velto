import { Injectable, OnModuleDestroy, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { EnvironmentService } from '../../config/env/env.service';
import { LoggerService } from '../../common/logger/logger.service';
import { ILogger } from '../../common/logger/logger.interface';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client!: Redis;
  private readonly logger: ILogger;
  private isConnected = false;

  constructor(
    private readonly env: EnvironmentService,
    logger: LoggerService,
  ) {
    this.logger = logger.child('RedisService');
    this.init();
  }

  private init(): void {
    const redisUrl = this.env.get('REDIS_URL');
    const db = this.env.get('REDIS_DB') || 1; // Use DB 1 for app cache (avoid conflict with Bull's DB 0)

    this.client = new Redis(redisUrl, {
      db,
      lazyConnect: false,
      retryStrategy: (times) => {
        if (times > 10) {
          this.logger.error('Redis connection failed after 10 retries');
          return null;
        }
        return Math.min(times * 100, 3000);
      },
    });

    this.client.on('connect', () => {
      this.isConnected = true;
      this.logger.info('Redis connected (Cache service)');
    });

    this.client.on('error', (err) => {
      this.isConnected = false;
      this.logger.error('Redis error', err.stack);
    });
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.logger.info('Redis connection closed');
    }
  }

  // Public API
  async get(key: string): Promise<string | null> {
    if (!this.isConnected) return null;
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.isConnected) return;
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isConnected) return;
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isConnected) return false;
    const result = await this.client.exists(key);
    return result === 1;
  }

  // For cart: store object as JSON
  async setJSON(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const json = JSON.stringify(value);
    await this.set(key, json, ttlSeconds);
  }

  async getJSON<T = any>(key: string): Promise<T | null> {
    const data = await this.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  // Check health
  isReady(): boolean {
    return this.isConnected;
  }
}
