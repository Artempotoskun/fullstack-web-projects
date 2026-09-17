import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Locale, Role } from '@prisma/client';
import { hash } from 'bcryptjs';
import { AuthService } from '../src/modules/auth/auth.service';
import { PrismaService } from '../src/modules/prisma/prisma.service';

describe('AuthService', () => {
  it('rejects an incorrect password without revealing account state', async () => {
    const passwordHash = await hash('CorrectPass123!', 4);
    const prisma = { user: { findUnique: jest.fn().mockResolvedValue({ id: 'u1', email: 'driver@example.com', passwordHash, firstName: 'A', lastName: 'Driver', role: Role.USER, locale: Locale.EN, isActive: true }) } } as unknown as PrismaService;
    const config = new ConfigService({ JWT_ACCESS_SECRET: 'a'.repeat(40), JWT_REFRESH_SECRET: 'b'.repeat(40) });
    const service = new AuthService(prisma, new JwtService(), config);
    await expect(service.login({ email: 'driver@example.com', password: 'WrongPass123!' })).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
