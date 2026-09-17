import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Locale, Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuditService } from '../../common/services/audit.service';
import { AuthUser } from '../../common/types/auth-user';
import { CatalogService } from './catalog.service';
import {
  CreateCategoryDto,
  CreateManufacturerDto,
  CreateProductDto,
  ProductQueryDto,
  UpdateCategoryDto,
  UpdateManufacturerDto,
  UpdateProductDto,
} from './dto/catalog.dto';

@ApiTags('catalog')
@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService, private readonly audit: AuditService) {}

  @Public()
  @Get('products')
  products(@Query() query: ProductQueryDto) {
    return this.catalog.findProducts(query);
  }

  @Public()
  @Get('products/suggestions')
  suggestions(@Query('q') q = '', @Query('locale') locale: Locale = Locale.EN) {
    return this.catalog.suggestions(q, locale);
  }

  @Public()
  @Get('products/:id')
  product(@Param('id') id: string, @Query('locale') locale: Locale = Locale.EN) {
    return this.catalog.findProduct(id, locale);
  }

  @Public()
  @Get('categories')
  categories(@Query('locale') locale: Locale = Locale.EN) {
    return this.catalog.categories(locale);
  }

  @Public()
  @Get('manufacturers')
  manufacturers() {
    return this.catalog.manufacturers();
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Post('products')
  async createProduct(@Body() dto: CreateProductDto, @CurrentUser() user: AuthUser) {
    const product = await this.catalog.createProduct(dto);
    await this.audit.record({ actorId: user.id, action: 'PRODUCT_CREATED', entityType: 'Product', entityId: product.id });
    return product;
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Patch('products/:id')
  async updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto, @CurrentUser() user: AuthUser) {
    const product = await this.catalog.updateProduct(id, dto);
    await this.audit.record({ actorId: user.id, action: 'PRODUCT_UPDATED', entityType: 'Product', entityId: id });
    return product;
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Delete('products/:id')
  async deactivateProduct(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const product = await this.catalog.deactivateProduct(id);
    await this.audit.record({ actorId: user.id, action: 'PRODUCT_DEACTIVATED', entityType: 'Product', entityId: id });
    return product;
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.catalog.createCategory(dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Post('manufacturers')
  createManufacturer(@Body() dto: CreateManufacturerDto) {
    return this.catalog.createManufacturer(dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.catalog.updateCategory(id, dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Delete('categories/:id')
  deactivateCategory(@Param('id') id: string) {
    return this.catalog.deactivateCategory(id);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Patch('manufacturers/:id')
  updateManufacturer(@Param('id') id: string, @Body() dto: UpdateManufacturerDto) {
    return this.catalog.updateManufacturer(id, dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Delete('manufacturers/:id')
  deactivateManufacturer(@Param('id') id: string) {
    return this.catalog.deactivateManufacturer(id);
  }
}
