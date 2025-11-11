// src/carrera/entities/carrera.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { getDateColumnType } from '../../common/database/date-column.util';
import { PlanEstudio } from '../../plan-estudio/entities/plan-estudio.entity';
import { Departamento } from '../../departamento/entities/departamento.entity'; // ✅ Importar Departamento

@Entity()
export class Carrera {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nombre: string;

  @Column({ nullable: true })
  descripcion: string;

  // Relación con planes de estudio
  @OneToMany(() => PlanEstudio, (plan) => plan.carrera)
  planesEstudio: PlanEstudio[];

  // Relación con departamentos (opcional)
  @OneToMany(() => Departamento, (departamento) => departamento.carrera)
  departamentos: Departamento[]; // Añadida relación con departamentos

  @Column({ type: getDateColumnType(), default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: getDateColumnType(), default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}