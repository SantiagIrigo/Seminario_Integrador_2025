import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, ManyToMany, JoinColumn, JoinTable } from 'typeorm';
import { getDateColumnType } from '../../common/database/date-column.util';
import { Carrera } from '../../carrera/entities/carrera.entity';
import { Materia } from '../../materia/entities/materia.entity';
import { User } from '../../user/entities/user.entity';
import { MateriaPlanEstudio } from '../../materia/entities/materia-plan-estudio.entity';

@Entity()
export class PlanEstudio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column({ nullable: true })
  descripcion: string;

  @Column({ nullable: true })
  año: number;

  @ManyToOne(() => Carrera, (carrera) => carrera.planesEstudio)
  @JoinColumn({ name: 'carreraId' })
  carrera: Carrera;

  // Relación con la tabla intermedia
  @OneToMany(() => MateriaPlanEstudio, relacion => relacion.planEstudio)
  relacionesConMaterias: MateriaPlanEstudio[];

  @OneToMany(() => User, (user) => user.planEstudio)
  estudiantes: User[];

  @Column({ type: getDateColumnType(), default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: getDateColumnType(), default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}