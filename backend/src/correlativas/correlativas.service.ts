import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Materia } from '../materia/entities/materia.entity';
import { Inscripcion } from '../inscripcion/entities/inscripcion.entity';
import { CorrelativasCursada } from './entities/correlativas-cursada.entity';
import { CorrelativasFinal } from './entities/correlativas-final.entity';
import { CorrelativasCursadaPlan } from './entities/correlativas-cursada-plan.entity';
import { CorrelativasFinalPlan } from './entities/correlativas-final-plan.entity';
import { MateriaPlanEstudio } from '../materia/entities/materia-plan-estudio.entity';

@Injectable()
export class CorrelativasService {
  constructor(
    @InjectRepository(Materia) private materiaRepo: Repository<Materia>,
    @InjectRepository(Inscripcion) private inscripcionRepo: Repository<Inscripcion>,
    @InjectRepository(CorrelativasCursada) private correlativasCursadaRepo: Repository<CorrelativasCursada>,
    @InjectRepository(CorrelativasFinal) private correlativasFinalRepo: Repository<CorrelativasFinal>,
    @InjectRepository(CorrelativasCursadaPlan) private correlativasCursadaPlanRepo: Repository<CorrelativasCursadaPlan>,
    @InjectRepository(CorrelativasFinalPlan) private correlativasFinalPlanRepo: Repository<CorrelativasFinalPlan>,
    @InjectRepository(MateriaPlanEstudio) private materiaPlanEstudioRepo: Repository<MateriaPlanEstudio>,
  ) {}

  // Verifica si el estudiante cumple con las correlativas de cursada
  async verificarCorrelativasCursada(estudianteId: number, materiaId: number): Promise<{ cumple: boolean; faltantes: Array<{ id: number; nombre: string }> }> {
    const materia = await this.materiaRepo.findOne({
      where: { id: materiaId },
      relations: ['correlativasCursada', 'correlativasCursada.correlativa'],
    });

    if (!materia) throw new NotFoundException('Materia no encontrada');

    const correlativaIds = materia.correlativasCursada.map(c => c.correlativa?.id).filter(Boolean) as number[];

    if (correlativaIds.length === 0) return { cumple: true, faltantes: [] };

    const inscripciones = await this.inscripcionRepo.find({
      where: {
        estudiante: { id: estudianteId },
        materia: { id: In(correlativaIds) },
      },
      relations: ['materia'],
    });

    const materiasFaltantes = materia.correlativasCursada
      .filter(c => {
        const i = inscripciones.find(ins => ins.materia.id === c.correlativa?.id);
        return !i || !['aprobada', 'cursada'].includes(i.stc);
      })
      .map(c => ({
        id: c.correlativa?.id || 0,
        nombre: c.correlativa?.nombre || 'Materia desconocida',
      }));

    return {
      cumple: materiasFaltantes.length === 0,
      faltantes: materiasFaltantes,
    };
  }

  // Verifica si el estudiante cumple con las correlativas de final
  async verificarCorrelativasFinales(estudianteId: number, materiaId: number): Promise<{ cumple: boolean; faltantes: Array<{ id: number; nombre: string }> }> {
    const materia = await this.materiaRepo.findOne({
      where: { id: materiaId },
      relations: ['correlativasFinal', 'correlativasFinal.correlativa'],
    });

    if (!materia) throw new NotFoundException('Materia no encontrada');

    const correlativaIds = materia.correlativasFinal.map(c => c.correlativa?.id).filter(Boolean) as number[];

    if (correlativaIds.length === 0) return { cumple: true, faltantes: [] };

    const inscripciones = await this.inscripcionRepo.find({
      where: {
        estudiante: { id: estudianteId },
        materia: { id: In(correlativaIds) },
      },
      relations: ['materia'],
    });

    const materiasFaltantes = materia.correlativasFinal
      .filter(c => {
        const i = inscripciones.find(ins => ins.materia.id === c.correlativa?.id);
        return !i || i.stc !== 'aprobada';
      })
      .map(c => ({
        id: c.correlativa?.id || 0,
        nombre: c.correlativa?.nombre || 'Materia desconocida',
      }));

    return {
      cumple: materiasFaltantes.length === 0,
      faltantes: materiasFaltantes,
    };
  }

  // Verifica si el estudiante cumple con todas las correlativas (cursada y final)
  async verificarTodasCorrelativas(estudianteId: number, materiaId: number): Promise<{
    cursada: { cumple: boolean; faltantes: Array<{ id: number; nombre: string }> };
    final: { cumple: boolean; faltantes: Array<{ id: number; nombre: string }> };
    aprobado: boolean;
  }> {
    const cursada = await this.verificarCorrelativasCursada(estudianteId, materiaId);
    const final = await this.verificarCorrelativasFinales(estudianteId, materiaId);

    return {
      cursada,
      final,
      aprobado: cursada.cumple && final.cumple,
    };
  }

  // Verificar si el estudiante puede inscribirse al examen final de una inscripción dada
  async verificarInscripcionExamenFinal(estudianteId: number, inscripcionId: number) {
    const inscripcion = await this.inscripcionRepo.findOne({
      where: { id: inscripcionId },
      relations: ['estudiante', 'materia'],
    });
    if (!inscripcion || inscripcion.estudiante.id !== estudianteId) {
      throw new BadRequestException('Inscripción no encontrada o no pertenece al estudiante');
    }
    // Reutiliza la verificación de correlativas finales para la materia de la inscripción
    return this.verificarCorrelativasFinales(estudianteId, inscripcion.materia.id);
  }
}
