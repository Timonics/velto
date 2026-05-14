import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { TenantServiceImpl } from '../tenant/services/tenant.service.impl';
import { VerifyTenantDto } from '../tenant/dto/verify-tenant.dto';
import {
  createSuccessResponse,
  ApiResponse,
} from '../../common/dto/api-response.dto';
import {
  TenantSerializer,
  TenantResponse,
} from '../../serializers/tenant.serializer';
import { Roles } from 'src/common/decorators/roles.decorator';
import { EnvironmentService } from 'src/config/env/env.service';

@Controller('admin')
@Roles('ADMIN')
export class AdminController {
  private readonly serializer: TenantSerializer;

  constructor(
    private readonly tenantService: TenantServiceImpl,
    private readonly env: EnvironmentService,
  ) {
    this.serializer = new TenantSerializer(this.env.get('APP_DOMAIN'));
  }

  @Post('tenants/verify')
  async verifyTenant(
    @Body() dto: VerifyTenantDto,
  ): Promise<ApiResponse<TenantResponse>> {
    const tenant = await this.tenantService.verifyTenant(
      dto.tenantId,
      dto.isVerified,
    );
    return createSuccessResponse(
      this.serializer.serialize(tenant, { includeTimestamps: true }),
    );
  }
}
