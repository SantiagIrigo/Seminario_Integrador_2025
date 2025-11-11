// Entidad para correlativas de cursada específicas de cada plan de estudios
import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column } from 'typeorm';
import { MateriaPlanEstudio } from '../../materia/entities/materia-plan-estudio.entity';

@Entity('correlativas_cursada_plan')
export class CorrelativasCursadaPlan {
  @PrimaryGeneratedColumn()
  id: number;

  // Relación con la combinación materia-plan de estudios
  @ManyToOne(() => MateriaPlanEstudio, materiaPlan => materiaPlan.correlativasCursada)
  @JoinColumn({ name: 'materiaPlanEstudioId' })
  materiaPlanEstudio: MateriaPlanEstudio;

  // La materia correlativa requerida (también debe estar en el mismo plan)
  @Column({ name: 'correlativaId' })
  correlativaId: number;

  // Nivel mínimo requerido (opcional)
  @Column({ name: 'nivelRequerido', nullable: true })
  nivelRequerido?: number;
}
