import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthUser } from '../../common/types/auth-user';
import { AuthService } from './auth.service';
import { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public() @Throttle({ default: { limit: 5, ttl: 60_000 } }) @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.auth.register(dto); this.setCookie(response, result.refreshToken); return { user: result.user, accessToken: result.accessToken };
  }

  @Public() @Throttle({ default: { limit: 5, ttl: 60_000 } }) @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.auth.login(dto); this.setCookie(response, result.refreshToken); return { user: result.user, accessToken: result.accessToken };
  }

  @Public() @Post('refresh')
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const result = await this.auth.refresh(request.cookies?.refresh_token as string | undefined); this.setCookie(response, result.refreshToken); return { accessToken: result.accessToken };
  }

  @Post('logout')
  async logout(@CurrentUser() user: AuthUser, @Res({ passthrough: true }) response: Response) {
    response.clearCookie('refresh_token', { path: '/api/auth' }); return this.auth.logout(user.id);
  }

  @Public() @Throttle({ default: { limit: 3, ttl: 60_000 } }) @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) { return this.auth.requestPasswordReset(dto); }

  @Public() @Throttle({ default: { limit: 3, ttl: 60_000 } }) @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) { return this.auth.resetPassword(dto); }

  private setCookie(response: Response, token: string) {
    response.cookie('refresh_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/api/auth', maxAge: 7 * 24 * 60 * 60 * 1000 });
  }
}
