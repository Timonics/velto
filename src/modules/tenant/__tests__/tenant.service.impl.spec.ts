import { Test, TestingModule } from '@nestjs/testing';
import { TenantServiceImpl } from '../services/tenant.service.impl';
import { ITenantRepository } from '../repository/tenant.repository.interface';
import { EventBus } from '../../../domain/events/event-bus.service';
import { PAYMENT_GATEWAY } from '../../payment/gateways/payment-gateway.interface';
import { PaystackGateway } from '../../payment/gateways/paystack.gateway';
import { LoggerService } from '../../../common/logger/logger.service';
import { ConflictError } from '../../../common/errors/app-error';
import { BusinessType, Category } from 'generated/prisma/client';
import { Slug } from '../../../domain/value-objects/slug.vo';

jest.mock('../../../domain/value-objects/slug.vo');

describe('TenantServiceImpl', () => {
  let service: TenantServiceImpl;
  let repository: jest.Mocked<ITenantRepository>;
  let eventBus: jest.Mocked<EventBus>;
  let paystackGateway: jest.Mocked<PaystackGateway>;

  const mockTenant = {
    id: 'tenant-123',
    userId: 'user-123',
    businessName: 'Test Store',
    slug: 'test-store',
    businessType: BusinessType.PRODUCT_SELLER,
    category: Category.FASHION,
    description: 'A test store',
    location: 'Lagos',
    lga: 'Ikeja',
    logoUrl: null,
    bannerUrl: null,
    contactPhone: '+2348012345678',
    isActive: true,
    paystackSubaccountCode: null,
    bankName: null,
    bankAccountNumber: null,
    bankAccountName: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    primaryColor: null,
    secondaryColor: null,
    accentColor: null,
    fontFamily: null,
    socialLinks: null,
    heroTitle: null,
    heroSubtitle: null,
    footerText: null,
    isVerified: false,
    verifiedAt: null,
  };

  beforeEach(async () => {
    repository = {
      findBySlug: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findByBusinessType: jest.fn(),
      searchTenants: jest.fn(),
      getStorefront: jest.fn(),
      findByCategory: jest.fn(),
    } as any;

    eventBus = { emit: jest.fn() } as any;
    paystackGateway = {
      createSubaccount: jest.fn(),
      fetchSubaccount: jest.fn(),
      updateSubaccount: jest.fn(),
    } as any;

    const loggerMock = {
      child: jest.fn().mockReturnValue({
        info: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        error: jest.fn(),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: 'ITenantRepository', useValue: repository },
        { provide: EventBus, useValue: eventBus },
        { provide: PAYMENT_GATEWAY, useValue: paystackGateway },
        { provide: LoggerService, useValue: loggerMock },
        TenantServiceImpl,
      ],
    }).compile();

    service = module.get<TenantServiceImpl>(TenantServiceImpl);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      businessName: 'New Store',
      businessType: BusinessType.PRODUCT_SELLER,
      category: Category.ELECTRONICS,
      description: 'Best electronics',
      location: 'Abuja',
      lga: 'Garki',
      contactPhone: '+2348098765432',
      bankName: 'GTBank',
      bankAccountNumber: '0123456789',
      bankAccountName: 'Store Owner',
    };
    const userId = 'user-123';

    beforeEach(() => {
      (Slug.create as jest.Mock).mockReturnValue({
        isErr: () => false,
        getValue: () => ({ getValue: () => 'new-store' }),
      });
    });

    it('should create tenant without subaccount if no bank details', async () => {
      const dtoWithoutBank = {
        ...createDto,
        bankName: undefined,
        bankAccountNumber: undefined,
        bankAccountName: undefined,
      };
      repository.findBySlug.mockResolvedValue(null);
      repository.create.mockResolvedValue({
        ...mockTenant,
        businessName: 'New Store',
        slug: 'new-store',
      } as any);

      const result = await service.create({ ...dtoWithoutBank, userId });

      expect(result).toBeDefined();
      expect(paystackGateway.createSubaccount).not.toHaveBeenCalled();
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          businessName: 'New Store',
          slug: 'new-store',
          // paystackSubaccountCode: undefined,
        }),
      );
      expect(eventBus.emit).toHaveBeenCalled();
    });

    it('should create tenant with Paystack subaccount when bank details provided', async () => {
      repository.findBySlug.mockResolvedValue(null);
      const mockSubaccount = { subaccount_code: 'sub_abc123' };
      paystackGateway.createSubaccount.mockResolvedValue(mockSubaccount as any);
      repository.create.mockResolvedValue({
        ...mockTenant,
        businessName: 'New Store',
        slug: 'new-store',
        paystackSubaccountCode: 'sub_abc123',
        bankName: createDto.bankName,
        bankAccountNumber: createDto.bankAccountNumber,
        bankAccountName: createDto.bankAccountName,
      } as any);

      const result = await service.create({ ...createDto, userId });

      expect(result).toBeDefined();
      expect(paystackGateway.createSubaccount).toHaveBeenCalledWith({
        businessName: 'New Store',
        bankCode: '058',
        accountNumber: '0123456789',
        percentageCharge: 0,
        description: 'Subaccount for New Store',
      });
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          businessName: 'New Store',
          slug: 'new-store',
          paystackSubaccountCode: 'sub_abc123',
        }),
      );
    });

    it('should throw ConflictError if slug already exists', async () => {
      repository.findBySlug.mockResolvedValue(mockTenant);
      await expect(service.create({ ...createDto, userId })).rejects.toThrow(
        ConflictError,
      );
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const updateDto = { description: 'Updated description' };

    it('should update tenant', async () => {
      repository.findById.mockResolvedValue(mockTenant);
      repository.update.mockResolvedValue({
        ...mockTenant,
        description: 'Updated description',
      } as any);

      const result = await service.update(mockTenant.id, updateDto);
      expect(result.description).toBe('Updated description');
      expect(repository.update).toHaveBeenCalledWith(mockTenant.id, {
        description: 'Updated description',
      });
    });

    it('should ignore businessName changes (no slug update)', async () => {
      repository.findById.mockResolvedValue(mockTenant);
      repository.update.mockResolvedValue(mockTenant as any);
      await service.update(mockTenant.id, { businessName: 'New Name' });
      expect(repository.update).toHaveBeenCalledWith(mockTenant.id, {});
    });
  });

  describe('delete', () => {
    it('should soft delete tenant', async () => {
      repository.findById.mockResolvedValue(mockTenant);
      repository.update.mockResolvedValue({
        ...mockTenant,
        isActive: false,
      } as any);

      const result = await service.delete(mockTenant.id);
      expect(result.isActive).toBe(false);
      expect(repository.update).toHaveBeenCalledWith(mockTenant.id, {
        isActive: false,
      });
    });
  });

  describe('findBySlug', () => {
    it('should return tenant by slug', async () => {
      repository.findBySlug.mockResolvedValue(mockTenant);
      const result = await service.findBySlug('test-store');
      expect(result).toEqual(mockTenant);
    });
  });

  describe('updateBranding', () => {
    const brandingDto = {
      primaryColor: '#FF6600',
      secondaryColor: '#FFFFFF',
      heroTitle: 'Welcome!',
    };

    it('should update branding fields', async () => {
      repository.findById.mockResolvedValue(mockTenant);
      repository.update.mockResolvedValue({
        ...mockTenant,
        ...brandingDto,
      } as any);

      const result = await service.updateBranding(mockTenant.id, brandingDto);
      expect(result.primaryColor).toBe('#FF6600');
      expect(repository.update).toHaveBeenCalledWith(
        mockTenant.id,
        brandingDto,
      );
    });
  });

  describe('verifyTenant', () => {
    it('should set isVerified to true and emit event', async () => {
      repository.findById.mockResolvedValue(mockTenant);
      repository.update.mockResolvedValue({
        ...mockTenant,
        isVerified: true,
        verifiedAt: expect.any(Date),
      } as any);

      const result = await service.verifyTenant(mockTenant.id, true);
      expect(result.isVerified).toBe(true);
      expect(eventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'tenant.verified' }),
      );
    });

    it('should unverify and emit unverified event', async () => {
      repository.findById.mockResolvedValue({
        ...mockTenant,
        isVerified: true,
        verifiedAt: new Date(),
      });
      repository.update.mockResolvedValue({
        ...mockTenant,
        isVerified: false,
        verifiedAt: null,
      } as any);

      const result = await service.verifyTenant(mockTenant.id, false);
      expect(result.isVerified).toBe(false);
      expect(eventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'tenant.unverified' }),
      );
    });
  });
});
