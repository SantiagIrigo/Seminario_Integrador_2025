import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Materia } from '../../materia/entities/materia.entity';

export enum EstadoMateria {
  NO_CURSADA = 'no_cursada',
  CURSANDO = 'cursando',
  REGULAR = 'regular',
  APROBADA = 'aprobada',
  LIBRE = 'libre'
}

@Entity('estado_academico')
export class EstadoAcademico {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'estudianteId' })
  estudiante: User;

  @ManyToOne(() => Materia)
  @JoinColumn({ name: 'materiaId' })
  materia: Materia;

  @Column({
    type: 'simple-enum',
    enum: EstadoMateria,
    default: EstadoMateria.NO_CURSADA
  })
  estado: EstadoMateria;

  @Column({ nullable: true })
  notaCursada: number;

  @Column({ nullable: true })
  notaFinal: number;

  @Column({ nullable: true })
  fechaAprobacion: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
