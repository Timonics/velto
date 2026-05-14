import { IBaseRepository } from '../../../common/repositories/base.repository.interface';
import { Payment, Prisma } from 'generated/prisma/client';

export interface IPaymentRepository extends IBaseRepository<
  Payment,
  Prisma.PaymentCreateInput,
  Prisma.PaymentUpdateInput
> {
  /**
   * Find a payment by its unique Paystack reference.
   * @param reference - The Paystack transaction reference.
   * @param tx - Optional transactional client.
   */
  findByReference(reference: string, tx?: any): Promise<Payment | null>;

  /**
   * Find all payments for a specific order.
   * @param orderId - The order ID.
   * @param tx - Optional transactional client.
   */
  findByOrderId(orderId: string, tx?: any): Promise<Payment[]>;

  /**
   * Update the status of a payment.
   * @param id - Payment ID.
   * @param status - New status (e.g., 'PAID').
   * @param tx - Optional transactional client.
   */
  updateStatus(id: string, status: string, tx?: any): Promise<Payment>;
}