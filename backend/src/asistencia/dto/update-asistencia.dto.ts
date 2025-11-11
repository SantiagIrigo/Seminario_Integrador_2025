// src/asistencia/dto/update-asistencia.dto.ts
import { EstadoAsistencia } from '../entities/asistencia.entity';

export class UpdateAsistenciaDto {
  estado?: EstadoAsistencia;
  motivoJustificacion?: string;
}