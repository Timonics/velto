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
  Inject,
} from '@nestjs/common';
import { IPortfolioService } from './portfolio.service.interface';
import { CreatePortfolioItemDto, UpdatePortfolioItemDto } from './dto';
import {
  PortfolioItemSerializer,
  PortfolioItemResponse,
} from '../../serializers/portfolio-item.serializer';
import { TenantOwnerGuard } from '../../common/guards/tenant-owner.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Public } from '../../common/decorators/public.decorator';
import {
  createSuccessResponse,
  ApiResponse,
} from '../../common/dto/api-response.dto';
import { Tenant } from 'generated/prisma/client';
import { PortfolioServiceImpl } from './portfolio.service.impl';

@Controller('portfolio')
export class PortfolioController {
  private readonly serializer = new PortfolioItemSerializer();

  constructor(
    private readonly portfolioService: PortfolioServiceImpl,
  ) {}

  @Public()
  @Get('tenant/:tenantId')
  async getByTenant(
    @Param('tenantId') tenantId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<ApiResponse<PortfolioItemResponse[]>> {
    const items = await this.portfolioService.getPortfolioByTenant(
      tenantId,
      skip ? parseInt(skip, 10) : 0,
      take ? parseInt(take, 10) : 20,
    );
    return createSuccessResponse(this.serializer.serializeMany(items));
  }

  @Post()
  @UseGuards(TenantOwnerGuard)
  async create(
    @Body() dto: CreatePortfolioItemDto,
    @CurrentTenant() tenant: Tenant,
  ): Promise<ApiResponse<PortfolioItemResponse>> {
    const item = await this.portfolioService.create({
      ...dto,
      tenantId: tenant.id,
    });
    return createSuccessResponse(this.serializer.serialize(item));
  }

  @Patch(':id')
  @UseGuards(TenantOwnerGuard)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePortfolioItemDto,
  ): Promise<ApiResponse<PortfolioItemResponse>> {
    const item = await this.portfolioService.update(id, dto);
    return createSuccessResponse(this.serializer.serialize(item));
  }

  @Delete(':id')
  @UseGuards(TenantOwnerGuard)
  async delete(@Param('id') id: string): Promise<ApiResponse<null>> {
    await this.portfolioService.delete(id);
    return createSuccessResponse(null, 'Portfolio item deleted');
  }
}
