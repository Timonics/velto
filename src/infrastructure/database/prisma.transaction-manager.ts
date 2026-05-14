import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import {
  ITransactionManager,
  TransactionContext,
} from '../../common/transactions/transaction-manager.interface';

@Injectable()
export class PrismaTransactionManager implements ITransactionManager {
  constructor(private readonly prisma: PrismaService) {}

  async runInTransaction<T>(
    callback: (context: TransactionContext) => Promise<T>,
  ): Promise<T> {
    // Prisma's $transaction automatically wraps all operations in a single transaction
    return this.prisma.$transaction(async (prismaTx) => {
      const context: TransactionContext = { client: prismaTx };
      return callback(context);
    });
  }
}
