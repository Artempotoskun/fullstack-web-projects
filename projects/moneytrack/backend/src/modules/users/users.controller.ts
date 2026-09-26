import { Body, Controller, Get, Patch } from '@nestjs/common';
import { Currency, Language } from '@prisma/client';
import { IsBoolean, IsIn, IsObject, IsOptional, IsString, Length } from 'class-validator';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

class UpdateSettingsDto {
  @IsOptional() @IsString() @Length(1, 80) firstName?: string;
  @IsOptional() @IsString() @Length(1, 80) lastName?: string;
  @IsOptional() @IsIn(['UAH', 'USD', 'EUR']) primaryCurrency?: Currency;
  @IsOptional() @IsIn(['EN', 'UA', 'RU']) preferredLanguage?: Language;
  @IsOptional() @IsIn(['light', 'dark', 'system']) theme?: string;
  @IsOptional() @IsString() timezone?: string;
  @IsOptional() @IsObject() notificationPreferences?: Record<string, boolean>;
  @IsOptional() @IsBoolean() twoFactorEnabled?: boolean;
}

@Controller('users')
export class UsersController {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { id: true, email: true, firstName: true, lastName: true, primaryCurrency: true, preferredLanguage: true, theme: true, timezone: true, notificationPreferences: true, twoFactorEnabled: true, createdAt: true },
    });
  }

  @Patch('me')
  async update(@CurrentUser() user: AuthUser, @Body() dto: UpdateSettingsDto) {
    const result = await this.prisma.user.update({
      where: { id: user.id },
      data: { ...dto, notificationPreferences: dto.notificationPreferences },
      select: { id: true, email: true, firstName: true, lastName: true, primaryCurrency: true, preferredLanguage: true, theme: true, timezone: true, notificationPreferences: true, twoFactorEnabled: true },
    });
    await this.audit.record({ userId: user.id, action: 'USER_SETTINGS_UPDATED', entityType: 'User', entityId: user.id });
    return result;
  }
}
