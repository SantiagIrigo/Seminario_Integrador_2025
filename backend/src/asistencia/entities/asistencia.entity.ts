import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { getDateColumnType } from '../../common/database/date-column.util';
import { Clase } from '../../clase/entities/clase.entity';
import { User } from '../../user/entities/user.entity';

export enum EstadoAsistencia {
  PRESENTE = 'presente',
  AUSENTE = 'ausente',
  JUSTIFICADA = 'justificada',
}

@Entity()
export class Asistencia {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Clase, clase => clase.asistencias)
  @JoinColumn({ name: 'claseId' })
  clase: Clase;

  @ManyToOne(() => User, user => user.asistencias)
  @JoinColumn({ name: 'estudianteId' })
  estudiante: User;

  @Column({ 
    type: 'simple-enum', 
    enum: EstadoAsistencia, 
    default: EstadoAsistencia.AUSENTE 
  })
  estado: EstadoAsistencia;

  @Column({ nullable: true })
  motivoJustificacion?: string;

  @Column({ type: getDateColumnType(), default: () => 'CURRENT_TIMESTAMP' })
  fechaRegistro: Date;
}