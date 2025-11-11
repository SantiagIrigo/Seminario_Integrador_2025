// src/evaluacion/entities/evaluacion.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { getDateColumnType } from '../../common/database/date-column.util';
import { Inscripcion } from '../../inscripcion/entities/inscripcion.entity';
import { Materia } from '../../materia/entities/materia.entity';
import { User } from '../../user/entities/user.entity';

// Enums
export enum TipoEvaluacion {
  PARCIAL = 'parcial',
  TRABAJO_PRACTICO = 'trabajo_practico',
  LABORATORIO = 'laboratorio',
  PARTICIPACION = 'participacion',
  RECUPERATORIO = 'recuperatorio',
}

export enum EstadoEvaluacion {
  APROBADA = 'aprobada',
  DESAPROBADA = 'desaprobada',
  AUSENTE = 'ausente',
  PENDIENTE = 'pendiente',
}

@Entity({ name: 'evaluaciones' })
export class Evaluacion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relación con la inscripción del estudiante a la materia (opcional)
  @ManyToOne(() => Inscripcion, inscripcion => inscripcion.evaluaciones, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inscripcionId' })
  inscripcion?: Inscripcion;

  // Materia (redundante pero útil para consultas)
  @ManyToOne(() => Materia, materia => materia.evaluaciones)
  @JoinColumn({ name: 'materiaId' })
  materia: Materia;

  // Estudiante
  @ManyToOne(() => User, user => user.evaluacionesRecibidas)
  @JoinColumn({ name: 'estudianteId' })
  estudiante: User;

  // Tipo de evaluación
  @Column({ type: 'simple-enum', enum: TipoEvaluacion })
  tipo: TipoEvaluacion;

  // Nombre descriptivo
  @Column({ nullable: true })
  titulo?: string;

  // Nota numérica
  @Column({ type: 'int', nullable: true })
  nota?: number;

  // Estado
  @Column({ type: 'simple-enum', enum: EstadoEvaluacion, default: EstadoEvaluacion.PENDIENTE })
  estado: EstadoEvaluacion;

  // Fecha de la evaluación o carga
  @Column({ type: getDateColumnType(), default: () => 'CURRENT_TIMESTAMP' })
  fecha: Date;

  // Observaciones (opcional)
  @Column({ nullable: true })
  observaciones?: string;

  // Profesor que cargó la nota (opcional)
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'cargadoPorId' })
  cargadoPor?: User;
}