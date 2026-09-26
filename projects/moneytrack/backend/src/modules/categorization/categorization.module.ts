import { Body, Controller, Delete, Get, Injectable, Module, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { PartialType } from '@nestjs/mapped-types';
import { MatchField, MatchOperator } from '@prisma/client';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, IsUUID, Length, Min } from 'class-validator';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { matchCategory } from '../../domain/finance';
import { PrismaService } from '../prisma/prisma.service';

class RuleDto {
  @IsUUID() categoryId: string;
  @IsIn(['DESCRIPTION', 'MERCHANT']) matchField: MatchField;
  @IsIn(['CONTAINS', 'EQUALS', 'STARTS_WITH']) operator: MatchOperator;
  @IsString() @Length(1, 120) matchValue: string;
  @IsOptional() @IsInt() @Min(1) priority?: number;
  @IsOptional() @IsBoolean() enabled?: boolean;
}

class UpdateRuleDto extends PartialType(RuleDto) {}

@Injectable()
export class CategorizationService {
  constructor(private readonly prisma: PrismaService) {}
  list(userId: string) { return this.prisma.categorizationRule.findMany({ where: { userId }, include: { category: true }, orderBy: { priority: 'asc' } }); }
  create(userId: string, dto: RuleDto) { return this.prisma.categorizationRule.create({ data: { ...dto, userId, matchValue: dto.matchValue.trim() } }); }
  async update(userId: string, id: string, dto: UpdateRuleDto) {
    await this.owned(userId, id);
    return this.prisma.categorizationRule.update({ where: { id }, data: dto });
  }
  async remove(userId: string, id: string) { await this.owned(userId, id); await this.prisma.categorizationRule.delete({ where: { id } }); return { deleted: true }; }
  async resolve(userId: string, description: string, merchant?: string) {
    const rules = await this.prisma.categorizationRule.findMany({ where: { userId, enabled: true }, orderBy: { priority: 'asc' } });
    return matchCategory({ description, merchant }, rules);
  }
  private async owned(userId: string, id: string) {
    const rule = await this.prisma.categorizationRule.findFirst({ where: { id, userId } });
    if (!rule) throw new NotFoundException('Categorization rule not found');
    return rule;
  }
}

@Controller('categorization-rules')
class CategorizationController {
  constructor(private readonly rules: CategorizationService) {}
  @Get() list(@CurrentUser() user: AuthUser) { return this.rules.list(user.id); }
  @Post() create(@CurrentUser() user: AuthUser, @Body() dto: RuleDto) { return this.rules.create(user.id, dto); }
  @Patch(':id') update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateRuleDto) { return this.rules.update(user.id, id, dto); }
  @Delete(':id') remove(@CurrentUser() user: AuthUser, @Param('id') id: string) { return this.rules.remove(user.id, id); }
}

@Module({ controllers: [CategorizationController], providers: [CategorizationService], exports: [CategorizationService] })
export class CategorizationModule {}
