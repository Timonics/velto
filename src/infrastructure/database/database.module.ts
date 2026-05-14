/**
 * Database Module – Global module that provides PrismaService.
 *
 * Marked as @Global() so that any service can inject PrismaService without importing.
 * This is convenient for repositories that need database access.
 */

import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaTransactionManager } from './prisma.transaction-manager';
import { ITransactionManager } from '../../common/transactions/transaction-manager.interface';

@Global()
@Module({
  providers: [
    PrismaService,
    { provide: 'ITransactionManager', useClass: PrismaTransactionManager },
  ],
  exports: [PrismaService, 'ITransactionManager'],
})
export class DatabaseModule {}
