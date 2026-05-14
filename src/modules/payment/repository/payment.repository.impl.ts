import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { BaseRepositoryImpl } from '../../../common/repositories/base.repository.impl';
import { IPaymentRepository } from './payment.repository.interface';
import { Payment, Prisma } from 'generated/prisma/client';

@Injectable()
export class PaymentRepositoryImpl
  extends BaseRepositoryImpl<
    Prisma.PaymentDelegate,
    Payment,
    Prisma.PaymentCreateInput,
    Prisma.PaymentUpdateInput
  >
  implements IPaymentRepository
{
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, prisma.payment, 'payment');
  }

  async findByReference(reference: string, tx?: any): Promise<Payment | null> {
    const delegate = this.getDelegate(tx);
    return delegate.findUnique({
      where: { reference },
    });
  }

  async findByOrderId(orderId: string, tx?: any): Promise<Payment[]> {
    const delegate = this.getDelegate(tx);
    return delegate.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, status: string, tx?: any): Promise<Payment> {
    const delegate = this.getDelegate(tx);
    return delegate.update({
      where: { id },
      data: { status },
    });
  }
}
