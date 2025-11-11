import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany, JoinTable, JoinColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { Inscripcion } from '../../inscripcion/entities/inscripcion.entity';
import { Materia } from '../../materia/entities/materia.entity';
import { Evaluacion } from '../../evaluacion/entities/evaluacion.entity';
import { ExamenFinal } from '../../examen/entities/examen.entity';
import { ExamenFinal as ExamenFinalNuevo } from '../../examen-final/entities/examen-final.entity';
import { Horario } from '../../horario/entities/horario.entity';
import { Clase } from '../../clase/entities/clase.entity';
import { Asistencia } from '../../asistencia/entities/asistencia.entity';
import { PlanEstudio } from '../../plan-estudio/entities/plan-estudio.entity';

export enum UserRole {
  ADMIN = 'admin',
  ESTUDIANTE = 'estudiante',
  PROFESOR = 'profesor',
  SECRETARIA_ACADEMICA = 'secretaria_academica',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column()
  apellido: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  legajo: string;

  @Column()
  dni: string;

  @Column({ type: 'simple-enum', enum: UserRole, default: UserRole.ESTUDIANTE })
  rol: UserRole;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Inscripcion, inscripcion => inscripcion.estudiante)
  inscripciones: Inscripcion[];

  @ManyToMany(() => Materia, materia => materia.profesores)
  @JoinTable({ name: 'materia_profesores' })
  materiasDictadas: Materia[];

  @OneToMany(() => Evaluacion, evaluacion => evaluacion.estudiante)
  evaluacionesRecibidas: Evaluacion[];

  @OneToMany(() => ExamenFinal, (examen) => examen.estudiante)
  examenes: ExamenFinal[];

  @OneToMany(() => ExamenFinalNuevo, (examen) => examen.docente)
  examenesFinales: ExamenFinalNuevo[];

  @OneToMany(() => Horario, horario => horario.docente) 
  horariosDictados: Horario[];

  @OneToMany(() => Asistencia, asistencia => asistencia.estudiante)
  asistencias: Asistencia[];

  @OneToMany(() => Clase, clase => clase.docente) 
  clasesDictadas: Clase[];

  @ManyToOne(() => PlanEstudio, planEstudio => planEstudio.estudiantes, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'planEstudioId' })
  planEstudio?: PlanEstudio;
}