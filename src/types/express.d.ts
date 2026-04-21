import { Tenant } from 'generated/prisma/client';

declare global {
  namespace Express {
    interface Request {
      tenant?: Tenant;
      user?: any;
      correlationId?: string;
    }
  }
}