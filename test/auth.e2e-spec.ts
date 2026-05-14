import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/database/prisma.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

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
    // Clean up test users
    await prisma.user.deleteMany({ where: { phone: { startsWith: '+234' } } });
  });

  const registerDto = {
    phone: '+2348012345678',
    password: 'secret123',
    email: 'e2e@example.com',
    name: 'E2E User',
  };

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.userId).toBeDefined();
      expect(res.body.data.role).toBe('CUSTOMER');
    });

    it('should reject duplicate phone', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto);
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(409);
      expect(res.body.error.code).toBe('GEN_006');
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto);
    });

    it('should login and set cookies', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ phone: registerDto.phone, password: registerDto.password })
        .expect(200);
      expect(res.body.success).toBe(true);
      const cookies = res.headers['set-cookie'];
      const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
      expect(
        cookieArray.some((c: string) => c.startsWith('accessToken=')),
      ).toBe(true);
      expect(
        cookieArray.some((c: string) => c.startsWith('refreshToken=')),
      ).toBe(true);
    });

    it('should reject wrong password', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ phone: registerDto.phone, password: 'wrong' })
        .expect(401);
      expect(res.body.error.code).toBe('GEN_004');
    });
  });

  describe('POST /auth/logout', () => {
    it('should clear cookies', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto);
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ phone: registerDto.phone, password: registerDto.password });
      const cookies = loginRes.headers['set-cookie'];

      const logoutRes = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', cookies)
        .expect(200);
      expect(logoutRes.body.success).toBe(true);
      const clearCookies = logoutRes.headers['set-cookie'];
      const clearCookieArray = Array.isArray(clearCookies)
        ? clearCookies
        : [clearCookies];
      expect(
        clearCookieArray.some((c: string) => c.includes('accessToken=;')),
      ).toBe(true);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh access token', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto);
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ phone: registerDto.phone, password: registerDto.password });
      const refreshCookie = loginRes.headers['set-cookie'].find((c: string) =>
        c.startsWith('refreshToken='),
      );

      const refreshRes = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', [refreshCookie])
        .expect(200);
      expect(refreshRes.body.success).toBe(true);
      const newAccessCookie = refreshRes.headers['set-cookie'].find(
        (c: string) => c.startsWith('accessToken='),
      );
      expect(newAccessCookie).toBeDefined();
    });
  });
});
