import { Expose, Type } from 'class-transformer';

export class DocenteResponseDto {
  @Expose()
  id: number;

  @Expose()
  nombre: string;

  @Expose()
  apellido: string;
}

export class MateriaResponseDto {
  @Expose()
  id: number;

  @Expose()
  nombre: string;
}

export class ExamenFinalResponseDto {
  @Expose()
  id: number;

  @Expose()
  @Type(() => MateriaResponseDto)
  materia: MateriaResponseDto;

  @Expose()
  @Type(() => DocenteResponseDto)
  docente: DocenteResponseDto;

  @Expose()
  fecha: string;

  @Expose()
  horaInicioTeorico: string;

  @Expose()
  horaFinTeorico: string;

  @Expose()
  aulaTeorico: string;

  @Expose()
  horaInicioPractico?: string;

  @Expose()
  horaFinPractico?: string;

  @Expose()
  aulaPractico?: string;

  @Expose()
  cupo: number;

  @Expose()
  inscriptos: number;

  @Expose()
  disponibles: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
