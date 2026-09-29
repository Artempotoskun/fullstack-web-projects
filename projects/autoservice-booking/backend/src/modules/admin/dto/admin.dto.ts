import { Locale } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator';

export class TranslationDto {
  @IsEnum(Locale) locale: Locale;
  @IsString() @MaxLength(100) name: string;
  @IsString() @MaxLength(2000) description: string;
}

export class CreateServiceDto {
  @IsString() @MaxLength(100) slug: string;
  @IsString() @MaxLength(100) category: string;
  @IsNumber() @Min(0) price: number;
  @IsInt() @Min(15) @Max(1440) durationMinutes: number;
  @IsOptional() @IsString() icon?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => TranslationDto) translations: TranslationDto[];
  @IsArray() @IsString({ each: true }) locationIds: string[];
}

export class UpdateServiceDto {
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsNumber() @Min(0) price?: number;
  @IsOptional() @IsInt() @Min(15) @Max(1440) durationMinutes?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class BusinessHourDto {
  @IsInt() @Min(0) @Max(6) weekday: number;
  @IsOptional() @IsString() openTime?: string;
  @IsOptional() @IsString() closeTime?: string;
  @IsBoolean() isClosed: boolean;
}

export class UpdateBusinessHoursDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => BusinessHourDto) hours: BusinessHourDto[];
}

export class CreateBlockedPeriodDto {
  @IsString() locationId: string;
  @IsOptional() @IsString() mechanicId?: string;
  @IsOptional() @IsString() serviceBayId?: string;
  @IsDateString() startTime: string;
  @IsDateString() endTime: string;
  @IsString() @MaxLength(300) reason: string;
}

export class CreateMechanicDto {
  @IsString() locationId: string;
  @IsString() @MaxLength(100) name: string;
  @IsString() @MaxLength(120) specialization: string;
  @IsArray() @IsString({ each: true }) serviceIds: string[];
}

export class CreateBayDto {
  @IsString() locationId: string;
  @IsString() @MaxLength(60) name: string;
  @IsString() @MaxLength(60) bayType: string;
}
