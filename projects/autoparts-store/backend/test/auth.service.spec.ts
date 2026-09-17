import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { hash } from 'bcryptjs';
import { AuthService } from '../src/modules/auth/auth.service';

describe('AuthService', () => {
  const prisma: any = {
    user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  };
  const jwt = { signAsync: jest.fn().mockResolvedValueOnce('access').mockResolvedValueOnce('refresh') } as unknown as JwtService;
  const config = { getOrThrow: jest.fn((key: string) => `${key}-a-secret-value-that-is-long-enough`), get: jest.fn((_key: string, fallback: string) => fallback) } as unknown as ConfigService;

  beforeEach(() => jest.clearAllMocks());

  it('rejects duplicate registrations', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'existing' });
    const service = new AuthService(prisma, jwt, config);
    await expect(service.register({ email: 'USER@example.com', password: 'StrongPass123!', firstName: 'Ada', lastName: 'Driver' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects an incorrect password without leaking which credential failed', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'u@x.dev', passwordHash: await hash('CorrectPass123!', 4), role: Role.USER, isActive: true });
    const service = new AuthService(prisma, jwt, config);
    await expect(service.login({ email: 'u@x.dev', password: 'WrongPass123!' })).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
