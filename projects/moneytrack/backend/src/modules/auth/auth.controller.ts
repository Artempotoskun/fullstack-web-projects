import { Body, Controller, HttpCode, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { LoginDto, RegisterDto, ResetPasswordRequestDto } from './auth.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly config: ConfigService) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.auth.register(dto);
    this.setCookies(response, result.accessToken, result.refreshToken);
    return { user: result.user };
  }

  @Public()
  @HttpCode(200)
  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.auth.login(dto);
    this.setCookies(response, result.accessToken, result.refreshToken);
    return { user: result.user };
  }

  @Public()
  @HttpCode(200)
  @Post('refresh')
  async refresh(@Req() request: Request & { cookies?: Record<string, string> }, @Res({ passthrough: true }) response: Response) {
    const result = await this.auth.refresh(request.cookies?.refresh_token ?? '');
    this.setCookies(response, result.accessToken, result.refreshToken);
    return { refreshed: true };
  }

  @Public()
  @HttpCode(200)
  @Post('logout')
  async logout(@Req() request: Request & { cookies?: Record<string, string> }, @Res({ passthrough: true }) response: Response) {
    await this.auth.logout(request.cookies?.refresh_token);
    response.clearCookie('access_token');
    response.clearCookie('refresh_token', { path: '/api/auth' });
    return { loggedOut: true };
  }

  @Public()
  @HttpCode(202)
  @Post('password-reset/request')
  requestReset(@Body() dto: ResetPasswordRequestDto) {
    void dto;
    return { accepted: true, message: 'If the account exists, reset instructions will be sent.' };
  }

  private setCookies(response: Response, accessToken: string, refreshToken: string): void {
    const secure = this.config.get('NODE_ENV') === 'production';
    response.cookie('access_token', accessToken, { httpOnly: true, secure, sameSite: 'lax', maxAge: 15 * 60 * 1000 });
    response.cookie('refresh_token', refreshToken, { httpOnly: true, secure, sameSite: 'strict', path: '/api/auth', maxAge: 7 * 24 * 60 * 60 * 1000 });
  }
}
