// src/comision/dto/create-comision.dto.ts
export class CreateComisionDto {
  nombre: string;
  descripcion?: string;
  materiaId: number;
  profesorId?: number;
}