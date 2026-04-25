import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { ITenantRepository } from '../../modules/tenant/repository/tenant.repository.interface';

@Injectable()
export class TenantOwnerGuard implements CanActivate {
  constructor(private readonly tenantRepository: ITenantRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenant = request.tenant; // Set by TenantMiddleware

    if (!user) throw new ForbiddenException('Authentication required');
    if (user.role !== 'TENANT_ADMIN')
      throw new ForbiddenException(
        'Only tenant admins can access this resource',
      );

    if (tenant && user.tenantId !== tenant.id) {
      throw new ForbiddenException('You do not own this tenant');
    }
    // If tenant is in params, we could check that too, but for MVP, assume request.tenant is set.

    return true;
  }
}
