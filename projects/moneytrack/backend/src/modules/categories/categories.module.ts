import { Body, ConflictException, Controller, Delete, Get, Injectable, Module, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { CategoryKind } from '@prisma/client';
import { IsHexColor, IsIn, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

class CategoryDto {
  @IsString() @Length(1, 80) name: string;
  @IsIn(['INCOME', 'EXPENSE']) kind: CategoryKind;
  @IsOptional() @IsUUID() parentId?: string;
  @IsOptional() @IsHexColor() color?: string;
  @IsOptional() @IsString() icon?: string;
}

class UpdateCategoryDto {
  @IsOptional() @IsString() @Length(1, 80) name?: string;
  @IsOptional() @IsHexColor() color?: string;
  @IsOptional() @IsString() icon?: string;
}

@Injectable()
class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}
  list(userId: string) { return this.prisma.category.findMany({ where: { userId, archivedAt: null }, include: { children: true }, orderBy: [{ kind: 'asc' }, { name: 'asc' }] }); }
  async create(userId: string, dto: CategoryDto) {
    if (dto.parentId) {
      const parent = await this.prisma.category.findFirst({ where: { id: dto.parentId, userId, archivedAt: null } });
      if (!parent || parent.kind !== dto.kind) throw new ConflictException('Parent category must exist and have the same type');
    }
    return this.prisma.category.create({ data: { ...dto, userId, name: dto.name.trim() } });
  }
  async update(userId: string, id: string, dto: UpdateCategoryDto) {
    await this.owned(userId, id);
    return this.prisma.category.update({ where: { id }, data: { ...dto, name: dto.name?.trim() } });
  }
  async archive(userId: string, id: string) {
    const category = await this.owned(userId, id);
    if (category.isSystem) throw new ConflictException('Default categories cannot be deleted');
    await this.prisma.category.update({ where: { id }, data: { archivedAt: new Date() } });
    return { archived: true };
  }
  private async owned(userId: string, id: string) {
    const category = await this.prisma.category.findFirst({ where: { id, userId, archivedAt: null } });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }
}

@Controller('categories')
class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}
  @Get() list(@CurrentUser() user: AuthUser) { return this.categories.list(user.id); }
  @Post() create(@CurrentUser() user: AuthUser, @Body() dto: CategoryDto) { return this.categories.create(user.id, dto); }
  @Patch(':id') update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateCategoryDto) { return this.categories.update(user.id, id, dto); }
  @Delete(':id') archive(@CurrentUser() user: AuthUser, @Param('id') id: string) { return this.categories.archive(user.id, id); }
}

@Module({ controllers: [CategoriesController], providers: [CategoriesService] })
export class CategoriesModule {}
