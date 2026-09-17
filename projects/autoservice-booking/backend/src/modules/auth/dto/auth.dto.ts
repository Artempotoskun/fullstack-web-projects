import { ApiProperty } from '@nestjs/swagger';
import { Locale } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

export class RegisterDto {
  @ApiProperty({ example: 'driver@example.com' })
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(10)
  @MaxLength(72)
  @Matches(strongPassword, { message: 'password must include upper/lowercase, a number and a symbol' })
  password: string;

  @IsString() @MinLength(2) @MaxLength(50) firstName: string;
  @IsString() @MinLength(2) @MaxLength(50) lastName: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @IsOptional() @IsEnum(Locale) locale?: Locale;
}

export class LoginDto {
  @IsEmail() email: string;
  @IsString() @MinLength(1) password: string;
}

export class ForgotPasswordDto { @IsEmail() email: string }

export class ResetPasswordDto {
  @IsString() @MinLength(32) token: string;
  @IsString() @MinLength(10) @MaxLength(72) @Matches(strongPassword) password: string;
}
