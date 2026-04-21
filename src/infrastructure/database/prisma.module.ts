/**
 * Prisma Module – Global module that provides PrismaService.
 * 
 * Marked as @Global() so that any service can inject PrismaService without importing.
 * This is convenient for repositories that need database access.
 */

import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}