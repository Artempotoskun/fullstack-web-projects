import { IsEmail, IsIn, IsOptional, IsString, Length, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(10)
  password: string;

  @IsString()
  @Length(1, 80)
  firstName: string;

  @IsString()
  @Length(1, 80)
  lastName: string;

  @IsOptional()
  @IsIn(['UAH', 'USD', 'EUR'])
  primaryCurrency?: 'UAH' | 'USD' | 'EUR';

  @IsOptional()
  @IsIn(['EN', 'UA', 'RU'])
  preferredLanguage?: 'EN' | 'UA' | 'RU';
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class ResetPasswordRequestDto {
  @IsEmail()
  email: string;
}
