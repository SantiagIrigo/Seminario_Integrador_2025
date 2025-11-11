// src/clase/entities/clase.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { getDateColumnType } from '../../common/database/date-column.util';
import { Materia } from '../../materia/entities/materia.entity';
import { Horario } from '../../horario/entities/horario.entity';
import { Asistencia } from '../../asistencia/entities/asistencia.entity';
import { User } from '../../user/entities/user.entity';
import { Comision } from '../../comision/entities/comision.entity'; // ✅ Importar Comision

export enum EstadoClase {
  PROGRAMADA = 'programada',
  REALIZADA = 'realizada',
  CANCELADA = 'cancelada',
}

@Entity()
export class Clase {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Materia, materia => materia.clases)
  @JoinColumn({ name: 'materiaId' })
  materia: Materia;

  @ManyToOne(() => Horario, { nullable: true })
  @JoinColumn({ name: 'horarioId' })
  horario?: Horario;

  @ManyToOne(() => Comision, comision => comision.clases, { nullable: true })
  @JoinColumn({ name: 'comisionId' })
  comision?: Comision;

  @ManyToOne(() => User, user => user.clasesDictadas, { nullable: true })
  @JoinColumn({ name: 'docenteId' })
  docente?: User;

  @Column({ type: getDateColumnType() })
  fecha: Date;

  @Column({ 
    type: 'simple-enum', 
    enum: EstadoClase, 
    default: EstadoClase.PROGRAMADA 
  })
  estado: EstadoClase;

  @Column({ nullable: true })
  motivoCancelacion?: string;

  @OneToMany(() => Asistencia, asistencia => asistencia.clase)
  asistencias: Asistencia[];
}