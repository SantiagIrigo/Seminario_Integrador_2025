// src/comision/dto/update-comision.dto.ts
export class UpdateComisionDto {
  nombre?: string;
  descripcion?: string;
  profesorId?: number | null; // null para eliminar profesor
}