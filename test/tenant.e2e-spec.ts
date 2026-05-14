import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/database/prisma.service';
import { BusinessType, Category } from 'generated/prisma/client';

describe('TenantController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authCookie: string;

  const testUser = {
    phone: '+2348012345678',
    password: 'secret123',
    email: 'tenant@example.com',
    name: 'Tenant User',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    // Clean up
    await prisma.tenant.deleteMany({ where: { slug: { contains: 'test' } } });
    await prisma.user.deleteMany({ where: { phone: { startsWith: '+234' } } });

    // Register and login to get cookies
    await request(app.getHttpServer()).post('/auth/register').send(testUser);
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ phone: testUser.phone, password: testUser.password });
    const cookies = loginRes.headers['set-cookie'];
    authCookie = Array.isArray(cookies) ? cookies[0] : cookies;
  });

  const createTenantDto = {
    businessName: 'Test Store',
    businessType: BusinessType.PRODUCT_SELLER,
    category: Category.FASHION,
    description: 'A test store',
    location: 'Lagos',
    lga: 'Ikeja',
    contactPhone: '+2348012345678',
  };

  describe('POST /tenants', () => {
    it('should create a tenant for authenticated user', async () => {
      const res = await request(app.getHttpServer())
        .post('/tenants')
        .set('Cookie', authCookie)
        .send(createTenantDto)
        .expect(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.businessName).toBe(createTenantDto.businessName);
      expect(res.body.data.slug).toBe('test-store');
    });

    it('should reject duplicate business name', async () => {
      await request(app.getHttpServer())
        .post('/tenants')
        .set('Cookie', authCookie)
        .send(createTenantDto);
      const res = await request(app.getHttpServer())
        .post('/tenants')
        .set('Cookie', authCookie)
        .send(createTenantDto)
        .expect(409);
      expect(res.body.error.code).toBe('GEN_006');
    });
  });

  describe('GET /tenants/search', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/tenants')
        .set('Cookie', authCookie)
        .send(createTenantDto);
    });

    it('should search tenants by query', async () => {
      const res = await request(app.getHttpServer())
        .get('/tenants/search?q=Test')
        .expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].businessName).toContain('Test');
    });
  });

  describe('GET /tenants/category/:category', () => {
    it('should return tenants by category', async () => {
      await request(app.getHttpServer())
        .post('/tenants')
        .set('Cookie', authCookie)
        .send(createTenantDto);
      const res = await request(app.getHttpServer())
        .get('/tenants/category/FASHION')
        .expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /tenants/storefront/:slug', () => {
    it('should return public storefront data', async () => {
      await request(app.getHttpServer())
        .post('/tenants')
        .set('Cookie', authCookie)
        .send(createTenantDto);
      const res = await request(app.getHttpServer())
        .get('/tenants/storefront/test-store')
        .expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.businessName).toBe('Test Store');
    });
  });

  describe('PATCH /tenants/:id', () => {
    it('should update tenant (owner only)', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/tenants')
        .set('Cookie', authCookie)
        .send(createTenantDto);
      const tenantId = createRes.body.data.id;

      const updateRes = await request(app.getHttpServer())
        .patch(`/tenants/${tenantId}`)
        .set('Cookie', authCookie)
        .send({ description: 'Updated description' })
        .expect(200);
      expect(updateRes.body.data.description).toBe('Updated description');
    });
  });

  describe('DELETE /tenants/:id', () => {
    it('should soft delete tenant', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/tenants')
        .set('Cookie', authCookie)
        .send(createTenantDto);
      const tenantId = createRes.body.data.id;

      const deleteRes = await request(app.getHttpServer())
        .delete(`/tenants/${tenantId}`)
        .set('Cookie', authCookie)
        .expect(200);
      expect(deleteRes.body.success).toBe(true);

      // Verify tenant is no longer returned in search
      const searchRes = await request(app.getHttpServer())
        .get('/tenants/search?q=Test')
        .expect(200);
      expect(searchRes.body.data.some((t: any) => t.id === tenantId)).toBe(
        false,
      );
    });
  });
});
