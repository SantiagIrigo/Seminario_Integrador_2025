// src/horario/dto/create-horario.dto.ts
export class CreateHorarioDto {
  materiaId: number;
  dia: string;
  horaInicio: string;
  horaFin: string;
  aula: string;
  comisionId?: number;
  docenteId?: number;
}