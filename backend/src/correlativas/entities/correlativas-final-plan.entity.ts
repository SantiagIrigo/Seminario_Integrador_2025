// Entidad para correlativas de final específicas de cada plan de estudios
import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column } from 'typeorm';
import { MateriaPlanEstudio } from '../../materia/entities/materia-plan-estudio.entity';

@Entity('correlativas_final_plan')
export class CorrelativasFinalPlan {
  @PrimaryGeneratedColumn()
  id: number;

  // Relación con la combinación materia-plan de estudios
  @ManyToOne(() => MateriaPlanEstudio, materiaPlan => materiaPlan.correlativasFinal)
  @JoinColumn({ name: 'materiaPlanEstudioId' })
  materiaPlanEstudio: MateriaPlanEstudio;

  // La materia correlativa requerida (también debe estar en el mismo plan)
  @Column({ name: 'correlativaId' })
  correlativaId: number;

  // Nivel mínimo requerido (opcional)
  @Column({ name: 'nivelRequerido', nullable: true })
  nivelRequerido?: number;
}
