import { Body, Controller, Delete, Get, Injectable, Module, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { PartialType } from '@nestjs/mapped-types';
import { Currency, Prisma } from '@prisma/client';
import { IsDateString, IsIn, IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

class GoalDto {
  @IsString() @Length(1, 100) name: string;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) targetAmount: number;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) currentAmount?: number;
  @IsIn(['UAH', 'USD', 'EUR']) currency: Currency;
  @IsOptional() @IsDateString() targetDate?: string;
  @IsOptional() @IsString() @Length(0, 500) description?: string;
}

class UpdateGoalDto extends PartialType(GoalDto) {}

@Injectable()
class GoalsService {
  constructor(private readonly prisma: PrismaService) {}
  list(userId: string) { return this.prisma.financialGoal.findMany({ where: { userId, archivedAt: null }, orderBy: { createdAt: 'asc' } }); }
  create(userId: string, dto: GoalDto) { return this.prisma.financialGoal.create({ data: { ...dto, userId, targetAmount: new Prisma.Decimal(dto.targetAmount), currentAmount: new Prisma.Decimal(dto.currentAmount ?? 0), targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined } }); }
  async update(userId: string, id: string, dto: UpdateGoalDto) { await this.owned(userId, id); return this.prisma.financialGoal.update({ where: { id }, data: { ...dto, targetAmount: dto.targetAmount !== undefined ? new Prisma.Decimal(dto.targetAmount) : undefined, currentAmount: dto.currentAmount !== undefined ? new Prisma.Decimal(dto.currentAmount) : undefined, targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined } }); }
  async archive(userId: string, id: string) { await this.owned(userId, id); await this.prisma.financialGoal.update({ where: { id }, data: { archivedAt: new Date() } }); return { archived: true }; }
  private async owned(userId: string, id: string) { const goal = await this.prisma.financialGoal.findFirst({ where: { id, userId, archivedAt: null } }); if (!goal) throw new NotFoundException('Financial goal not found'); return goal; }
}

@Controller('goals')
class GoalsController {
  constructor(private readonly goals: GoalsService) {}
  @Get() list(@CurrentUser() user: AuthUser) { return this.goals.list(user.id); }
  @Post() create(@CurrentUser() user: AuthUser, @Body() dto: GoalDto) { return this.goals.create(user.id, dto); }
  @Patch(':id') update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateGoalDto) { return this.goals.update(user.id, id, dto); }
  @Delete(':id') archive(@CurrentUser() user: AuthUser, @Param('id') id: string) { return this.goals.archive(user.id, id); }
}

@Module({ controllers: [GoalsController], providers: [GoalsService] })
export class GoalsModule {}
