import { IsDateString, IsString, Matches } from 'class-validator';

export class AvailabilityQueryDto {
  @IsString() serviceId: string;
  @IsString() locationId: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) date: string;
  @IsString() vehicleId: string;
}

export class AvailabilityCalendarQueryDto {
  @IsString() serviceId: string;
  @IsString() locationId: string;
  @IsDateString() from: string;
  @IsDateString() to: string;
}
