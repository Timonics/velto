/**
 * PrismaService – Wrapper around PrismaClient to integrate with NestJS lifecycle.
 *
 * Why a custom service?
 * - Automatically connects on module init and disconnects on app shutdown
 * - Makes PrismaClient injectable across the application (via @Global() module)
 * - Allows mocking for unit tests
 * - Single place to add logging, soft-delete hooks, etc.
 */

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { EnvironmentService } from 'src/config/env/env.service';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // Get the validated environment configuration
    const env = EnvironmentService.getInstance();
    const databaseUrl = env.get('DATABASE_URL');

    console.log(databaseUrl);

    // Create PostgreSQL connection pool
    const pool = new Pool({ connectionString: databaseUrl });
    const adapter = new PrismaPg(pool);

    // Configure PrismaClient with the adapter and logging
    super({
      adapter,
      log: env.isDevelopment() ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }

  /**
   * Called when the module is initialized.
   * Establishes the database connection.
   */
  async onModuleInit() {
    await this.$connect();
  }

  /**
   * Called when the application is shutting down.
   * Gracefully closes the database connection.
   */
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
