// src/plan-estudio/dto/create-plan-estudio.dto.ts
import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';

export class CreatePlanEstudioDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsNumber()
  @IsOptional()
  año?: number;

  @IsNotEmpty()
  carreraId: number;
}
