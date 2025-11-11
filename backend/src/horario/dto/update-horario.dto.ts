// src/horario/dto/update-horario.dto.ts
export class UpdateHorarioDto {
  materiaId?: number;
  dia?: string;
  horaInicio?: string;
  horaFin?: string;
  aula?: string;
  comisionId?: number | null;
  docenteId?: number | null;
}