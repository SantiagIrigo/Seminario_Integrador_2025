import { IsString, IsOptional, IsInt, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

class PlanEstudioNivelDto {
  @IsInt()
  planEstudioId: number;

  @IsInt()
  nivel: number;
}

export class CreateMateriaDto {
  @IsString()
  nombre: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsInt()
  departamentoId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanEstudioNivelDto)
  @IsOptional()
  planesEstudioConNivel?: PlanEstudioNivelDto[];
}