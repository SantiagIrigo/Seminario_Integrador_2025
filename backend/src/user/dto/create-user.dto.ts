import { IsNotEmpty, IsString, IsEmail, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  apellido: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  legajo: string;

  @IsString()
  @IsNotEmpty()
  dni: string;

  @IsEnum(UserRole)
  @IsOptional()
  rol?: UserRole;

  @IsNumber()
  @IsOptional()
  planEstudioId?: number;
}