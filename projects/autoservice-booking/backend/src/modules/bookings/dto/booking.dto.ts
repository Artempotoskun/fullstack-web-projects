import { BookingStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateBookingDto {
  @IsString() vehicleId: string;
  @IsString() serviceId: string;
  @IsString() locationId: string;
  @IsDateString() startTime: string;
  @IsOptional() @IsString() @MaxLength(1000) customerNotes?: string;
}

export class AdminCreateBookingDto extends CreateBookingDto { @IsString() userId: string }

export class RescheduleBookingDto { @IsDateString() startTime: string }

export class CancelBookingDto { @IsString() @MaxLength(500) reason: string }

export class ChangeBookingStatusDto {
  @IsEnum(BookingStatus) status: BookingStatus;
  @IsOptional() @IsString() @MaxLength(500) note?: string;
}

export class AssignBookingDto {
  @IsOptional() @IsString() mechanicId?: string;
  @IsOptional() @IsString() serviceBayId?: string;
  @IsOptional() @IsString() @MaxLength(1000) internalNotes?: string;
}
