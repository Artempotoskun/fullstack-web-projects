import { Body, ConflictException, Controller, Delete, Get, Injectable, Module, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { AccountType, Currency, Prisma } from '@prisma/client';
import { IsIn, IsNumber, IsOptional, IsString, Length } from 'class-validator';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

class CreateAccountDto {
  @IsString() @Length(1, 80) name: string;
  @IsIn(['BANK', 'CASH', 'SAVINGS', 'OTHER']) type: AccountType;
  @IsIn(['UAH', 'USD', 'EUR']) currency: Currency;
  @IsNumber({ maxDecimalPlaces: 2 }) initialBalance: number;
  @IsOptional() @IsString() @Length(0, 300) description?: string;
}

class UpdateAccountDto {
  @IsOptional() @IsString() @Length(1, 80) name?: string;
  @IsOptional() @IsIn(['BANK', 'CASH', 'SAVINGS', 'OTHER']) type?: AccountType;
  @IsOptional() @IsString() @Length(0, 300) description?: string;
}

@Injectable()
class AccountsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  list(userId: string) {
    return this.prisma.account.findMany({ where: { userId, archivedAt: null }, orderBy: { createdAt: 'asc' } });
  }

  async create(userId: string, dto: CreateAccountDto) {
    const account = await this.prisma.account.create({ data: { ...dto, userId, name: dto.name.trim(), initialBalance: new Prisma.Decimal(dto.initialBalance), currentBalance: new Prisma.Decimal(dto.initialBalance) } });
    await this.audit.record({ userId, action: 'ACCOUNT_CREATED', entityType: 'Account', entityId: account.id, metadata: { currency: account.currency, type: account.type } });
    return account;
  }

  async update(userId: string, id: string, dto: UpdateAccountDto) {
    await this.owned(userId, id);
    return this.prisma.account.update({ where: { id }, data: { ...dto, name: dto.name?.trim() } });
  }

  async archive(userId: string, id: string) {
    const account = await this.owned(userId, id);
    const active = await this.prisma.recurringPayment.count({ where: { accountId: id, enabled: true } });
    if (active) throw new ConflictException('Disable recurring payments before archiving this account');
    await this.prisma.account.update({ where: { id }, data: { archivedAt: new Date() } });
    await this.audit.record({ userId, action: 'ACCOUNT_ARCHIVED', entityType: 'Account', entityId: account.id });
    return { archived: true };
  }

  private async owned(userId: string, id: string) {
    const account = await this.prisma.account.findFirst({ where: { id, userId, archivedAt: null } });
    if (!account) throw new NotFoundException('Account not found');
    return account;
  }
}

@Controller('accounts')
class AccountsController {
  constructor(private readonly accounts: AccountsService) {}
  @Get() list(@CurrentUser() user: AuthUser) { return this.accounts.list(user.id); }
  @Post() create(@CurrentUser() user: AuthUser, @Body() dto: CreateAccountDto) { return this.accounts.create(user.id, dto); }
  @Patch(':id') update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateAccountDto) { return this.accounts.update(user.id, id, dto); }
  @Delete(':id') archive(@CurrentUser() user: AuthUser, @Param('id') id: string) { return this.accounts.archive(user.id, id); }
}

@Module({ controllers: [AccountsController], providers: [AccountsService], exports: [AccountsService] })
export class AccountsModule {}
