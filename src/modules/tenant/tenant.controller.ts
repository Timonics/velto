import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { ITenantService } from './services/tenant.service.interface';
import { CreateTenantDto, UpdateTenantDto } from './dto';
import { TenantSerializer, TenantResponse } from '../../serializers/tenant.serializer';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { TenantOwnerGuard } from '../../common/guards/tenant-owner.guard';
import { createSuccessResponse, ApiResponse } from '../../common/dto/api-response.dto';
import { NotFoundError } from 'src/common/errors/app-error';

@Controller('tenants')
export class TenantController {
  private readonly serializer = new TenantSerializer();

  constructor(private readonly tenantService: ITenantService) {}

  /**
   * Public route – Get tenant storefront by slug (from subdomain)
   * Used by subdomain middleware to render storefront
   */
  @Public()
  @Get('storefront/:slug')
  async getStorefront(@Param('slug') slug: string): Promise<ApiResponse<TenantResponse>> {
    const tenant = await this.tenantService.getStorefront(slug);
    if (!tenant) {
      // Will be caught by global filter as NotFoundError
      throw new NotFoundError('Tenant', slug);
    }
    return createSuccessResponse(this.serializer.serialize(tenant, { includeTimestamps: true }));
  }

  /**
   * Public route – Search tenants (marketplace)
   */
  @Public()
  @Get('search')
  async search(
    @Query('q') query: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<ApiResponse<TenantResponse[]>> {
    const tenants = await this.tenantService.searchTenants(
      query,
      skip ? parseInt(skip, 10) : 0,
      take ? parseInt(take, 10) : 20,
    );
    return createSuccessResponse(this.serializer.serializeMany(tenants));
  }

  /**
   * Public route – Get tenants by category
   */
  @Public()
  @Get('category/:category')
  async getByCategory(
    @Param('category') category: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<ApiResponse<TenantResponse[]>> {
    const tenants = await this.tenantService.getByCategory(
      category,
      skip ? parseInt(skip, 10) : 0,
      take ? parseInt(take, 10) : 20,
    );
    return createSuccessResponse(this.serializer.serializeMany(tenants));
  }

  /**
   * Public route – Get tenants by business type
   */
  @Public()
  @Get('type/:businessType')
  async getByBusinessType(
    @Param('businessType') businessType: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<ApiResponse<TenantResponse[]>> {
    const tenants = await this.tenantService.getByBusinessType(
      businessType,
      skip ? parseInt(skip, 10) : 0,
      take ? parseInt(take, 10) : 20,
    );
    return createSuccessResponse(this.serializer.serializeMany(tenants));
  }

  /**
   * Protected route – Create a tenant (requires authentication)
   * User must be logged in. After creation, user role becomes TENANT_ADMIN.
   */
  @Post()
  @UseGuards(AuthGuard)
  async create(
    @Body() data: CreateTenantDto,
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: Request,
  ): Promise<ApiResponse<TenantResponse>> {
    // Pass userId to service
    const tenant = await this.tenantService.create({ ...data, userId: user.id });
    // Optionally update user role to TENANT_ADMIN (could be done in service or separate step)
    // For simplicity, we assume a separate endpoint or auto-update.
    return createSuccessResponse(this.serializer.serialize(tenant));
  }

  /**
   * Protected route – Update tenant (requires tenant ownership)
   */
  @Patch(':id')
  @UseGuards(AuthGuard, TenantOwnerGuard)
  async update(
    @Param('id') id: string,
    @Body() data: UpdateTenantDto,
  ): Promise<ApiResponse<TenantResponse>> {
    const tenant = await this.tenantService.update(id, data);
    return createSuccessResponse(this.serializer.serialize(tenant));
  }

  /**
   * Protected route – Delete tenant (soft delete, requires tenant ownership)
   */
  @Delete(':id')
  @UseGuards(AuthGuard, TenantOwnerGuard)
  async delete(@Param('id') id: string): Promise<ApiResponse<null>> {
    await this.tenantService.delete(id);
    return createSuccessResponse(null, 'Tenant deactivated successfully');
  }

  /**
   * Get current tenant from subdomain (useful for storefront API)
   */
  @Public()
  @Get('current')
  async getCurrentTenant(@CurrentTenant() tenant: any): Promise<ApiResponse<TenantResponse>> {
    return createSuccessResponse(this.serializer.serialize(tenant));
  }
}