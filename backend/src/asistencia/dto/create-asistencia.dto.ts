// src/asistencia/dto/create-asistencia.dto.ts
import { EstadoAsistencia } from '../entities/asistencia.entity';

export class CreateAsistenciaDto {
  claseId: number;
  estudianteId: number;
  estado: EstadoAsistencia;
  motivoJustificacion?: string;
}