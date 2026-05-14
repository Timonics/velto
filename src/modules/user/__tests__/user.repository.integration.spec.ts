import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { UserRepositoryImpl } from '../repository/user.repository.impl';
import { Role } from 'generated/prisma/client';
import { EnvironmentService } from '../../../config/env/env.service';

describe('UserRepository (integration)', () => {
  let repository: UserRepositoryImpl;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepositoryImpl,
        {
          provide: PrismaService,
          useClass: PrismaService, // uses real test database (must be configured)
        },
        {
          provide: EnvironmentService,
          useFactory: () => EnvironmentService.getInstance(),
        },
      ],
    }).compile();

    repository = module.get(UserRepositoryImpl);
    prisma = module.get(PrismaService);
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up test users
    await prisma.user.deleteMany({ where: { phone: { startsWith: '+234' } } });
  });

  const testUser = {
    phone: '+2348012345678',
    email: 'test@example.com',
    passwordHash: 'hashed123',
    role: Role.CUSTOMER ,
  };

  it('should create a user', async () => {
    const user = await repository.create(testUser);
    expect(user.id).toBeDefined();
    expect(user.phone).toBe(testUser.phone);
  });

  it('should find user by phone', async () => {
    await repository.create(testUser);
    const found = await repository.findByPhone(testUser.phone);
    expect(found).not.toBeNull();
    expect(found?.email).toBe(testUser.email);
  });

  it('should find user by email', async () => {
    await repository.create(testUser);
    const found = await repository.findByEmail(testUser.email!);
    expect(found).not.toBeNull();
  });

  it('should update refresh token', async () => {
    const user = await repository.create(testUser);
    const token = 'refreshToken123';
    const updated = await repository.updateRefreshToken(user.id, token);
    expect(updated.refreshToken).toBe(token);
  });

  it('should find user by id', async () => {
    const user = await repository.create(testUser);
    const found = await repository.findById(user.id);
    expect(found?.phone).toBe(testUser.phone);
  });
});