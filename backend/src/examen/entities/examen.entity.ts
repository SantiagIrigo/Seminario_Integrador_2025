// src/examen/entities/examen.entity.ts
import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany, Column } from 'typeorm';
import { Materia } from '../../materia/entities/materia.entity';
import { User } from '../../user/entities/user.entity';
import { InscripcionExamen } from '../../inscripcion-examen/entities/inscripcion-examen.entity';

@Entity()
export class ExamenFinal {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Materia, materia => materia.examenes) 
  @JoinColumn({ name: 'materiaId' })
  materia: Materia;

  @ManyToOne(() => User, user => user.examenes)
  @JoinColumn({ name: 'estudianteId' })
  estudiante: User;

  @Column({ nullable: true })
  nota?: number;

  @Column({ default: 'inscripto' })
  estado: string;

  @OneToMany(() => InscripcionExamen, inscripcion => inscripcion.examenViejo)
  inscripciones: InscripcionExamen[];
}