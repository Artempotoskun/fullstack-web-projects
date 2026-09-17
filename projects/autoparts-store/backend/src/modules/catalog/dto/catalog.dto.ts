import { ApiPropertyOptional } from '@nestjs/swagger';
import { Locale } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export enum ProductSort {
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  NEWEST = 'newest',
  POPULARITY = 'popularity',
  NAME = 'name',
}

export class ProductQueryDto {
  @IsOptional() @IsString() @MaxLength(100) search?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() manufacturer?: string;
  @IsOptional() @IsString() engineId?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1900) @Max(2100) year?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) minPrice?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) maxPrice?: number;
  @IsOptional() @Transform(({ value }) => value === 'true') @IsBoolean() inStock?: boolean;
  @IsOptional() @Transform(({ value }) => value === 'true') @IsBoolean() discounted?: boolean;
  @IsOptional() @IsEnum(ProductSort) sort: ProductSort = ProductSort.POPULARITY;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(60) limit = 12;
  @IsOptional() @IsEnum(Locale) locale: Locale = Locale.EN;
}

export class TranslationDto {
  @IsEnum(Locale) locale: Locale;
  @IsString() @MinLength(2) @MaxLength(180) name: string;
  @IsString() @MinLength(2) @MaxLength(5000) description: string;
}

export class CategoryTranslationDto {
  @IsEnum(Locale) locale: Locale;
  @IsString() @MinLength(2) @MaxLength(180) name: string;
}

export class CompatibilityDto {
  @IsString() engineId: string;
  @IsInt() @Min(1900) @Max(2100) fromYear: number;
  @IsInt() @Min(1900) @Max(2100) toYear: number;
}

export class CreateProductDto {
  @IsString() @MinLength(3) @MaxLength(50) sku: string;
  @IsString() @MinLength(2) @MaxLength(80) oemNumber: string;
  @IsString() manufacturerId: string;
  @IsString() categoryId: string;
  @IsNumber() @Min(0) price: number;
  @IsOptional() @IsInt() @Min(0) @Max(90) discountPercent = 0;
  @IsInt() @Min(0) stockQuantity: number;
  @IsArray() @ArrayMaxSize(8) @IsUrl({}, { each: true }) images: string[];
  @IsObject() specifications: Record<string, string | number | boolean>;
  @IsArray() @ValidateNested({ each: true }) @Type(() => TranslationDto) translations: TranslationDto[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CompatibilityDto)
  compatibility?: CompatibilityDto[];
}

export class UpdateProductDto {
  @IsOptional() @IsString() @MinLength(3) @MaxLength(50) sku?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(80) oemNumber?: string;
  @IsOptional() @IsString() manufacturerId?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsNumber() @Min(0) price?: number;
  @IsOptional() @IsInt() @Min(0) @Max(90) discountPercent?: number;
  @IsOptional() @IsInt() @Min(0) stockQuantity?: number;
  @IsOptional() @IsArray() @ArrayMaxSize(8) @IsUrl({}, { each: true }) images?: string[];
  @IsOptional() @IsObject() specifications?: Record<string, string | number | boolean>;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => TranslationDto)
  translations?: TranslationDto[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CompatibilityDto)
  compatibility?: CompatibilityDto[];
}

export class CreateCategoryDto {
  @IsString() @MinLength(2) slug: string;
  @IsOptional() @IsString() icon?: string;
  @IsOptional() @IsInt() sortOrder = 0;
  @IsArray() @ValidateNested({ each: true }) @Type(() => CategoryTranslationDto) translations: CategoryTranslationDto[];
}

export class UpdateCategoryDto {
  @IsOptional() @IsString() @MinLength(2) slug?: string;
  @IsOptional() @IsString() icon?: string;
  @IsOptional() @IsInt() sortOrder?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CategoryTranslationDto)
  translations?: CategoryTranslationDto[];
}

export class CreateManufacturerDto {
  @IsString() @MinLength(2) name: string;
  @IsString() @MinLength(2) slug: string;
  @IsOptional() @IsString() country?: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl() logoUrl?: string;
}

export class UpdateManufacturerDto {
  @IsOptional() @IsString() @MinLength(2) name?: string;
  @IsOptional() @IsString() @MinLength(2) slug?: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsUrl() logoUrl?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
