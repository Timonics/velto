import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateServiceDto, UpdateServiceDto } from './dto';
import {
  ServiceSerializer,
  ServiceResponse,
} from '../../serializers/service.serializer';
import { TenantOwnerGuard } from '../../common/guards/tenant-owner.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Public } from '../../common/decorators/public.decorator';
import {
  createSuccessResponse,
  ApiResponse,
} from '../../common/dto/api-response.dto';
import { Tenant } from 'generated/prisma/client';
import { ServiceServiceImpl } from './service/service.service.impl';

@Controller('services')
export class ServiceController {
  private readonly serializer = new ServiceSerializer();

  constructor(private readonly serviceService: ServiceServiceImpl) {}

  @Public()
  @Get('tenant/:tenantId')
  async getByTenant(
    @Param('tenantId') tenantId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<ApiResponse<ServiceResponse[]>> {
    const services = await this.serviceService.getServicesByTenant(
      tenantId,
      skip ? parseInt(skip, 10) : 0,
      take ? parseInt(take, 10) : 20,
    );
    return createSuccessResponse(this.serializer.serializeMany(services));
  }

  @Post()
  @UseGuards(TenantOwnerGuard)
  async create(
    @Body() data: CreateServiceDto,
    @CurrentTenant() tenant: Tenant,
  ): Promise<ApiResponse<ServiceResponse>> {
    const service = await this.serviceService.create({
      ...data,
      tenantId: tenant.id,
    });
    return createSuccessResponse(this.serializer.serialize(service));
  }

  @Patch(':id')
  @UseGuards(TenantOwnerGuard)
  async update(
    @Param('id') id: string,
    @Body() data: UpdateServiceDto,
  ): Promise<ApiResponse<ServiceResponse>> {
    const service = await this.serviceService.update(id, data);
    return createSuccessResponse(this.serializer.serialize(service));
  }

  @Delete(':id')
  @UseGuards(TenantOwnerGuard)
  async delete(@Param('id') id: string): Promise<ApiResponse<null>> {
    await this.serviceService.delete(id);
    return createSuccessResponse(null, 'Service deleted successfully');
  }
}
