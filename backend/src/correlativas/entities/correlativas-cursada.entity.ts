import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Materia } from '../../materia/entities/materia.entity';

@Entity('correlativas_cursada')
export class CorrelativasCursada {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Materia, materia => materia.correlativasCursada)
  @JoinColumn({ name: 'materiaId' })
  materia: Materia;

  @ManyToOne(() => Materia)
  @JoinColumn({ name: 'correlativaId' })
  correlativa: Materia;
}
