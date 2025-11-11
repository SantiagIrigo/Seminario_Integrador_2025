import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, ManyToMany, JoinTable, OneToOne, JoinColumn } from 'typeorm';
import { PlanEstudio } from '../../plan-estudio/entities/plan-estudio.entity';
import { Inscripcion } from '../../inscripcion/entities/inscripcion.entity';
import { User } from '../../user/entities/user.entity';
import { Evaluacion } from '../../evaluacion/entities/evaluacion.entity';
import { Horario } from '../../horario/entities/horario.entity';
import { Clase } from '../../clase/entities/clase.entity';
import { ExamenFinal } from '../../examen/entities/examen.entity';
import { ExamenFinal as ExamenFinalNuevo } from '../../examen-final/entities/examen-final.entity';
import { Comision } from '../../comision/entities/comision.entity';
import { Departamento } from '../../departamento/entities/departamento.entity';
import { CorrelativasCursada } from '../../correlativas/entities/correlativas-cursada.entity';
import { CorrelativasFinal } from '../../correlativas/entities/correlativas-final.entity';
import { MateriaPlanEstudio } from './materia-plan-estudio.entity';

@Entity()
export class Materia {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column({ nullable: true })
  descripcion: string;

  // Relación con la tabla intermedia
  @OneToMany(() => MateriaPlanEstudio, relacion => relacion.materia)
  relacionesConPlanes: MateriaPlanEstudio[];

  @ManyToOne(() => Departamento, (departamento) => departamento.materias)
  @JoinColumn({ name: 'departamentoId' })
  departamento: Departamento;

  @OneToMany(() => Inscripcion, (inscripcion) => inscripcion.materia)
  inscripciones: Inscripcion[];

  @ManyToMany(() => User, (user) => user.materiasDictadas)
  @JoinTable({
    name: 'materia_profesores',
    joinColumn: { name: 'materiaId' },
    inverseJoinColumn: { name: 'userId' },
  })
  profesores: User[];

  @OneToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'jefeCatedraId' })
  jefeCatedra?: User;

  @OneToMany(() => CorrelativasCursada, correlativa => correlativa.materia)
  correlativasCursada: CorrelativasCursada[];

  @OneToMany(() => CorrelativasFinal, correlativa => correlativa.materia)
  correlativasFinal: CorrelativasFinal[];

  @OneToMany(() => Evaluacion, evaluacion => evaluacion.materia)
  evaluaciones: Evaluacion[];

  @OneToMany(() => Horario, horario => horario.materia)
  horarios: Horario[];

  @OneToMany(() => Clase, clase => clase.materia)
  clases: Clase[];
  
  @OneToMany(() => ExamenFinal, (examen) => examen.materia)
  examenes: ExamenFinal[];

  @OneToMany(() => ExamenFinalNuevo, (examen) => examen.materia)
  examenesFinales: ExamenFinalNuevo[];
  
  @OneToMany(() => Comision, comision => comision.materia)
  comisiones: Comision[];
}