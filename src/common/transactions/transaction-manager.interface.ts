/**
 * ORM-agnostic transaction context.
 * The actual client is `any` to avoid coupling to Prisma.
 */
export interface TransactionContext {
  client: any;
}

/**
 * Contract for running operations inside a database transaction.
 */
export interface ITransactionManager {
  /**
   * Executes the callback within a transaction.
   * The callback receives a context containing the transactional client.
   * All repository calls inside the callback must pass this client.
   * @param callback - Async function that receives the transaction context.
   * @returns The result of the callback.
   */
  runInTransaction<T>(
    callback: (context: TransactionContext) => Promise<T>,
  ): Promise<T>;
}
