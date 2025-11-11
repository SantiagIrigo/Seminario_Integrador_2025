import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Materia } from '../../materia/entities/materia.entity';

@Entity('correlativas_final')
export class CorrelativasFinal {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Materia, materia => materia.correlativasFinal)
  @JoinColumn({ name: 'materiaId' })
  materia: Materia;

  @ManyToOne(() => Materia)
  @JoinColumn({ name: 'correlativaId' })
  correlativa: Materia;
}
