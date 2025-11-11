// src/inscripcion/entities/inscripcion.entity.ts
import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Materia } from '../../materia/entities/materia.entity';
import { Comision } from '../../comision/entities/comision.entity';
import { Evaluacion } from '../../evaluacion/entities/evaluacion.entity';
import { InscripcionExamen } from '../../inscripcion-examen/entities/inscripcion-examen.entity';
import { PlanEstudio } from '../../plan-estudio/entities/plan-estudio.entity';

@Entity()
export class Inscripcion {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, estudiante => estudiante.inscripciones)
  @JoinColumn({ name: 'estudianteId' })
  estudiante: User;

  @ManyToOne(() => Materia, materia => materia.inscripciones)
  @JoinColumn({ name: 'materiaId' })
  materia: Materia;

  @ManyToOne(() => Comision, comision => comision.inscripciones, { nullable: true })
  @JoinColumn({ name: 'comisionId' })
  comision?: Comision;

  @Column({ default: 0 })
  faltas: number;

  @Column({ nullable: true })
  notaFinal: number;

  @Column({ nullable: true })
  stc: string;
  
  @ManyToOne(() => PlanEstudio, { nullable: true })
  @JoinColumn({ name: 'planEstudioId' })
  planEstudio?: PlanEstudio;
  
  @CreateDateColumn()
  fechaInscripcion: Date;
  
  @UpdateDateColumn()
  fechaFinalizacion: Date;

  @OneToMany(() => Evaluacion, evaluacion => evaluacion.inscripcion) 
  evaluaciones: Evaluacion[];

  @OneToMany(() => InscripcionExamen, inscripcion => inscripcion.inscripcion)
  examenesInscritos: InscripcionExamen[];
}