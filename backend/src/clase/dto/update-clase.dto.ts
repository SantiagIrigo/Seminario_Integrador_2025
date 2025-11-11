// src/clase/dto/update-clase.dto.ts
export class UpdateClaseDto {
  materiaId?: number;
  fecha?: Date;
  horarioId?: number | null;
  comisionId?: number | null;
  estado?: string;
  motivoCancelacion?: string;
}