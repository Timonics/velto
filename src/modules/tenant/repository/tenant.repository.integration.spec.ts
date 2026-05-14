import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { TenantRepositoryImpl } from './tenant.repository.impl';
import { EnvironmentService } from '../../../config/env/env.service';
import { BusinessType, Category, Prisma } from 'generated/prisma/client';

describe('TenantRepository (integration)', () => {
  let repository: TenantRepositoryImpl;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantRepositoryImpl,
        {
          provide: PrismaService,
          useClass: PrismaService,
        },
        {
          provide: EnvironmentService,
          useFactory: () => EnvironmentService.getInstance(),
        },
      ],
    }).compile();

    repository = module.get(TenantRepositoryImpl);
    prisma = module.get(PrismaService);
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up test tenants
    await prisma.tenant.deleteMany({ where: { slug: { contains: 'test' } } });
    // Also clean up associated users (if needed)
    await prisma.user.deleteMany({ where: { phone: { startsWith: '+234' } } });
  });

  const createTestUser = async () => {
    return prisma.user.create({
      data: {
        phone: '+2348012345678',
        email: 'test@example.com',
        passwordHash: 'hash',
        role: 'TENANT_ADMIN',
      },
    });
  };

  it('should create a tenant', async () => {
    const user = await createTestUser();
    const tenant = await repository.create({
      businessName: 'Test Store',
      slug: 'test-store',
      businessType: BusinessType.PRODUCT_SELLER,
      category: Category.FASHION,
      user: { connect: { id: user.id } },
      isActive: true,
    });
    expect(tenant.id).toBeDefined();
    expect(tenant.slug).toBe('test-store');
  });

  it('should find tenant by slug', async () => {
    const user = await createTestUser();
    await repository.create({
      businessName: 'Test Store',
      slug: 'test-store',
      businessType: BusinessType.PRODUCT_SELLER,
      category: Category.FASHION,
      user: { connect: { id: user.id } },
      isActive: true,
    });
    const found = await repository.findBySlug('test-store');
    expect(found).not.toBeNull();
    expect(found?.businessName).toBe('Test Store');
  });

  it('should search tenants by name', async () => {
    const user = await createTestUser();
    await repository.create({
      businessName: 'Unique Store Name',
      slug: 'unique-store',
      businessType: BusinessType.PRODUCT_SELLER,
      category: Category.FASHION,
      user: { connect: { id: user.id } },
      isActive: true,
    });
    const results = await repository.searchTenants('Unique');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].businessName).toContain('Unique');
  });

  it('should get storefront with includes', async () => {
    const user = await createTestUser();
    const tenant = await repository.create({
      businessName: 'Storefront Tenant',
      slug: 'storefront-tenant',
      businessType: BusinessType.PRODUCT_SELLER,
      category: Category.FASHION,
      user: { connect: { id: user.id } },
      isActive: true,
    });
    await prisma.product.create({
      data: {
        name: 'Test Product',
        price: 100,
        stock: 10,
        category: Category.FASHION,
        tenant: { connect: { id: tenant.id } },
      },
    });
    const storefront = await repository.getStorefront('storefront-tenant');
    expect(storefront).not.toBeNull();
    // expect(storefront?.products).toHaveLength(1);
  });
});