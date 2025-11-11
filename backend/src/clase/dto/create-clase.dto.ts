// src/clase/dto/create-clase.dto.ts
export class CreateClaseDto {
  materiaId: number;
  fecha: Date;
  horarioId?: number;
  comisionId?: number;
  estado?: string;
  motivoCancelacion?: string;
}