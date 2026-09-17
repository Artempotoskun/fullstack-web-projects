import { IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class CreateVehicleMakeDto {
  @IsString() @MinLength(2) name: string;
  @IsString() @MinLength(2) slug: string;
}

export class CreateVehicleModelDto {
  @IsString() makeId: string;
  @IsString() @MinLength(1) name: string;
  @IsString() @MinLength(1) slug: string;
}

export class CreateVehicleEngineDto {
  @IsString() modelId: string;
  @IsString() @MinLength(1) name: string;
  @IsString() @MinLength(2) fuelType: string;
  @IsOptional() @IsInt() @Min(20) @Max(2000) powerHp?: number;
}

export class AddCompatibilityDto {
  @IsString() productId: string;
  @IsString() engineId: string;
  @IsInt() @Min(1900) @Max(2100) fromYear: number;
  @IsInt() @Min(1900) @Max(2100) toYear: number;
}

export class UpdateVehicleMakeDto {
  @IsOptional() @IsString() @MinLength(2) name?: string;
  @IsOptional() @IsString() @MinLength(2) slug?: string;
}

export class UpdateVehicleModelDto {
  @IsOptional() @IsString() @MinLength(1) name?: string;
  @IsOptional() @IsString() @MinLength(1) slug?: string;
}

export class UpdateVehicleEngineDto {
  @IsOptional() @IsString() @MinLength(1) name?: string;
  @IsOptional() @IsString() @MinLength(2) fuelType?: string;
  @IsOptional() @IsInt() @Min(20) @Max(2000) powerHp?: number;
}
