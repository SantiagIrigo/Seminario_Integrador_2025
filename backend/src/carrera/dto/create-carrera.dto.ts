import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCarreraDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsOptional()
  descripcion?: string;
}
