import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column, OneToMany } from 'typeorm';
import { getDateColumnType } from '../../common/database/date-column.util';
import { Materia } from '../../materia/entities/materia.entity';
import { User } from '../../user/entities/user.entity';
import { InscripcionExamen } from '../../inscripcion-examen/entities/inscripcion-examen.entity';

@Entity('examenes_finales')
export class ExamenFinal {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Materia, materia => materia.examenesFinales)
  @JoinColumn({ name: 'materiaId' })
  materia: Materia;

  @ManyToOne(() => User, user => user.examenesFinales)
  @JoinColumn({ name: 'docenteId' })
  docente: User;

  @Column({ type: 'date' })
  fecha: Date;

  @Column({ type: 'time', name: 'hora_inicio_teorico' })
  horaInicioTeorico: string;

  @Column({ type: 'time', name: 'hora_fin_teorico' })
  horaFinTeorico: string;

  @Column({ type: 'varchar', length: 100 })
  aulaTeorico: string;

  @Column({ type: 'time', name: 'hora_inicio_practico', nullable: true })
  horaInicioPractico?: string;

  @Column({ type: 'time', name: 'hora_fin_practico', nullable: true })
  horaFinPractico?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  aulaPractico?: string;

  @Column({ type: 'int', default: 30 })
  cupo: number;

  @Column({ type: 'int', default: 0 })
  inscriptos: number;

  @OneToMany(() => InscripcionExamen, inscripcion => inscripcion.examenFinal)
  inscripciones: InscripcionExamen[];

  @Column({ type: getDateColumnType(), default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: getDateColumnType(), default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
