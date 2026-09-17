import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { compare, hash } from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from './dto/auth.dto';

const publicUser = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  role: true,
  createdAt: true,
} as const;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    if (await this.prisma.user.findUnique({ where: { email }, select: { id: true } })) {
      throw new ConflictException('An account with this email already exists');
    }
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash: await hash(dto.password, 12),
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        cart: { create: {} },
      },
      select: publicUser,
    });
    const tokens = await this.issueTokens(user.id, user.email, user.role);
    await this.storeRefreshHash(user.id, tokens.refreshToken);
    return { user, ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.trim().toLowerCase() } });
    if (!user || !user.isActive || !(await compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const tokens = await this.issueTokens(user.id, user.email, user.role);
    await this.storeRefreshHash(user.id, tokens.refreshToken);
    const safe = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
    return { user: safe, ...tokens };
  }

  async refresh(token: string) {
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; email: string; role: Role }>(token, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user?.refreshTokenHash || !user.isActive || this.digest(token) !== user.refreshTokenHash) {
        throw new UnauthorizedException('Session expired');
      }
      const tokens = await this.issueTokens(user.id, user.email, user.role);
      await this.storeRefreshHash(user.id, tokens.refreshToken);
      return tokens;
    } catch {
      throw new UnauthorizedException('Session expired');
    }
  }

  async logout(userId: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { refreshTokenHash: null } });
    return { success: true };
  }

  async requestPasswordReset(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    let developmentToken: string | undefined;
    if (user) {
      const token = randomBytes(32).toString('hex');
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          resetTokenHash: this.digest(token),
          resetTokenExpires: new Date(Date.now() + 30 * 60_000),
        },
      });
      if (this.config.get('NODE_ENV') === 'development') developmentToken = token;
    }
    return {
      message: 'If the account exists, password reset instructions have been created.',
      ...(developmentToken ? { developmentToken } : {}),
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: { resetTokenHash: this.digest(dto.token), resetTokenExpires: { gt: new Date() } },
    });
    if (!user) throw new UnauthorizedException('Reset token is invalid or expired');
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hash(dto.password, 12),
        resetTokenHash: null,
        resetTokenExpires: null,
        refreshTokenHash: null,
      },
    });
    return { success: true };
  }

  private async issueTokens(userId: string, email: string, role: Role): Promise<TokenPair> {
    const payload = { sub: userId, email, role };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get('ACCESS_TOKEN_TTL', '15m'),
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('REFRESH_TOKEN_TTL', '7d'),
      }),
    ]);
    return { accessToken, refreshToken };
  }

  private storeRefreshHash(userId: string, token: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: this.digest(token) },
    });
  }

  private digest(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }
}
