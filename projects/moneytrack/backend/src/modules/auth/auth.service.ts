import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CategoryKind } from '@prisma/client';
import { compare, hash } from 'bcryptjs';
import { createHash, randomUUID } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './auth.dto';

const defaultCategories = [
  ['Food', CategoryKind.EXPENSE, '#f59e0b'], ['Housing', CategoryKind.EXPENSE, '#8b5cf6'],
  ['Car', CategoryKind.EXPENSE, '#06b6d4'], ['Shopping', CategoryKind.EXPENSE, '#ec4899'],
  ['Entertainment', CategoryKind.EXPENSE, '#f97316'], ['Health', CategoryKind.EXPENSE, '#10b981'],
  ['Education', CategoryKind.EXPENSE, '#3b82f6'], ['Subscriptions', CategoryKind.EXPENSE, '#6366f1'],
  ['Travel', CategoryKind.EXPENSE, '#14b8a6'], ['Other', CategoryKind.EXPENSE, '#64748b'],
  ['Salary', CategoryKind.INCOME, '#22c55e'], ['Other income', CategoryKind.INCOME, '#84cc16'],
] as const;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    if (await this.prisma.user.findUnique({ where: { email } })) throw new ConflictException('Email is already registered');
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash: await hash(dto.password, 12),
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        primaryCurrency: dto.primaryCurrency ?? 'UAH',
        preferredLanguage: dto.preferredLanguage ?? 'EN',
        categories: { create: defaultCategories.map(([name, kind, color]) => ({ name, kind, color, isSystem: true })) },
      },
      select: { id: true, email: true, firstName: true, lastName: true, primaryCurrency: true, preferredLanguage: true },
    });
    await this.audit.record({ userId: user.id, action: 'USER_REGISTERED', entityType: 'User', entityId: user.id });
    return { user, ...(await this.issueTokens(user.id, user.email)) };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.trim().toLowerCase() } });
    if (!user || !(await compare(dto.password, user.passwordHash))) throw new UnauthorizedException('Invalid email or password');
    await this.audit.record({ userId: user.id, action: 'LOGIN_SUCCEEDED', entityType: 'User', entityId: user.id });
    return { user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName }, ...(await this.issueTokens(user.id, user.email)) };
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string; email: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, { secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET') });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const tokenHash = this.digest(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored || stored.revokedAt || stored.expiresAt <= new Date()) throw new UnauthorizedException('Refresh token is no longer valid');
    await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
    return this.issueTokens(payload.sub, payload.email);
  }

  async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) return;
    await this.prisma.refreshToken.updateMany({ where: { tokenHash: this.digest(refreshToken), revokedAt: null }, data: { revokedAt: new Date() } });
  }

  private async issueTokens(userId: string, email: string) {
    const accessToken = await this.jwt.signAsync({ sub: userId, email }, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<string>('ACCESS_TOKEN_TTL', '15m') as never,
    });
    const refreshToken = await this.jwt.signAsync({ sub: userId, email, jti: randomUUID() }, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get<string>('REFRESH_TOKEN_TTL', '7d') as never,
    });
    const decoded = this.jwt.decode<{ exp: number }>(refreshToken);
    await this.prisma.refreshToken.create({
      data: { userId, tokenHash: this.digest(refreshToken), expiresAt: new Date(decoded.exp * 1000) },
    });
    return { accessToken, refreshToken };
  }

  private digest(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }
}
