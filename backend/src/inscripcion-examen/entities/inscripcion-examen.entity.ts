// src/inscripcion-examen/entities/inscripcion-examen.entity.ts
import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column } from 'typeorm';
import { getDateColumnType } from '../../common/database/date-column.util';
import { ExamenFinal as ExamenFinalViejo } from '../../examen/entities/examen.entity';
import { ExamenFinal } from '../../examen-final/entities/examen-final.entity';
import { Inscripcion } from '../../inscripcion/entities/inscripcion.entity';

@Entity()
export class InscripcionExamen {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Inscripcion, inscripcion => inscripcion.examenesInscritos, { nullable: true })
  @JoinColumn({ name: 'inscripcionId' })
  inscripcion: Inscripcion;

  @ManyToOne(() => ExamenFinalViejo, examen => examen.inscripciones, { eager: true, nullable: true })
  @JoinColumn({ name: 'examenViejoId' })
  examenViejo: ExamenFinalViejo;

  @ManyToOne(() => ExamenFinal, examen => examen.inscripciones, { eager: true, nullable: true })
  @JoinColumn({ name: 'examenFinalId' })
  examenFinal: ExamenFinal;

  @Column({ default: 'inscripto' })
  estado: string;

  @Column({ nullable: true })
  nota?: number;

  @Column({ type: getDateColumnType(), default: () => 'CURRENT_TIMESTAMP' })
  fechaInscripcion: Date;
}