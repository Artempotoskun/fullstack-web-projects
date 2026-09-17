import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateVehicleDto {
  @IsString() @MaxLength(50) make: string;
  @IsString() @MaxLength(50) model: string;
  @IsInt() @Min(1950) @Max(2100) year: number;
  @IsString() @MaxLength(50) engine: string;
  @IsOptional() @IsString() @MaxLength(17) vin?: string;
  @IsOptional() @IsString() @MaxLength(20) licensePlate?: string;
  @IsInt() @Min(0) @Max(2_000_000) mileage: number;
}

export class UpdateVehicleDto {
  @IsOptional() @IsString() @MaxLength(50) make?: string;
  @IsOptional() @IsString() @MaxLength(50) model?: string;
  @IsOptional() @IsInt() @Min(1950) @Max(2100) year?: number;
  @IsOptional() @IsString() @MaxLength(50) engine?: string;
  @IsOptional() @IsString() @MaxLength(17) vin?: string;
  @IsOptional() @IsString() @MaxLength(20) licensePlate?: string;
  @IsOptional() @IsInt() @Min(0) @Max(2_000_000) mileage?: number;
}
