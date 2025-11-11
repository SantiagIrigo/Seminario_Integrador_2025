// src/comision/entities/comision.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { getDateColumnType } from '../../common/database/date-column.util';
import { Materia } from '../../materia/entities/materia.entity';
import { User } from '../../user/entities/user.entity';
import { Horario } from '../../horario/entities/horario.entity';
import { Clase } from '../../clase/entities/clase.entity';
import { Inscripcion } from '../../inscripcion/entities/inscripcion.entity';

@Entity()
export class Comision {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column({ nullable: true })
  descripcion: string;

  @Column({ type: 'int', default: 30 })
  cupoMaximo: number;

  // Relación con la materia principal
  @ManyToOne(() => Materia, materia => materia.comisiones)
  @JoinColumn({ name: 'materiaId' })
  materia: Materia;

  // Relación con profesor (docente de la comisión)
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'profesorId' })
  profesor?: User;

  // Relación con inscripciones (nueva relación)
  @OneToMany(() => Inscripcion, inscripcion => inscripcion.comision)
  inscripciones: Inscripcion[];

  // Relación con horarios
  @OneToMany(() => Horario, horario => horario.comision)
  horarios: Horario[];

  // Relación con clases
  @OneToMany(() => Clase, clase => clase.comision)
  clases: Clase[];

  // Fecha de creación
  @Column({ type: getDateColumnType(), default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  // Fecha de actualización
  @Column({ type: getDateColumnType(), default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
