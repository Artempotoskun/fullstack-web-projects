import { OrderStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, Length, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum PaymentMethod {
  DEMO_CARD = 'DEMO_CARD',
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY',
}

export class ShippingAddressDto {
  @IsString() @MinLength(2) @MaxLength(50) firstName: string;
  @IsString() @MinLength(2) @MaxLength(50) lastName: string;
  @IsString() @MinLength(7) @MaxLength(30) phone: string;
  @IsString() @MinLength(3) @MaxLength(150) line1: string;
  @IsOptional() @IsString() @MaxLength(150) line2?: string;
  @IsString() @MinLength(2) @MaxLength(80) city: string;
  @IsOptional() @IsString() @MaxLength(80) region?: string;
  @IsString() @MinLength(3) @MaxLength(20) postalCode: string;
  @IsString() @Length(2, 2) country: string;
}

export class CreateOrderDto {
  @ValidateNested() @Type(() => ShippingAddressDto) shippingAddress: ShippingAddressDto;
  @IsEnum(PaymentMethod) paymentMethod: PaymentMethod;
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus) status: OrderStatus;
}
