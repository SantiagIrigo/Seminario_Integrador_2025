// src/evaluacion/evaluacion.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Evaluacion, TipoEvaluacion, EstadoEvaluacion } from './entities/evaluacion.entity';
import { Inscripcion } from '../inscripcion/entities/inscripcion.entity';
import { User } from '../user/entities/user.entity';

@Injectable()
export class EvaluacionService {
  constructor(
    @InjectRepository(Evaluacion)
    private evaluacionRepo,
    @InjectRepository(Inscripcion)
    private inscripcionRepo,
    @InjectRepository(User)
    private userRepo,
  ) {}

  async crearEvaluacion(
    materiaId: number,
    estudianteId: number,
    tipo: TipoEvaluacion,
    nota: number,
    titulo?: string,
    observaciones?: string,
    cargadoPorId?: number,
  ) {
    // 1. Verificar inscripción (solo necesitamos el ID)
    const inscripcion = await this.inscripcionRepo.findOne({
      where: { materia: { id: materiaId }, estudiante: { id: estudianteId } },
    });

    if (!inscripcion) {
      throw new Error('El estudiante no está inscripto a esta materia');
    }

    // 2. Validar que el estudiante existe
    const estudiante = await this.userRepo.findOne({ where: { id: estudianteId } });
    if (!estudiante) {
      throw new Error('Estudiante no encontrado');
    }

    // 3. Calcular estado
    const estado = nota >= 6 ? EstadoEvaluacion.APROBADA : EstadoEvaluacion.DESAPROBADA;

    // 4. Manejar cargadoPor (solo ID, nunca null)
    const cargadoPor = cargadoPorId 
      ? { id: cargadoPorId } // ✅ Solo el ID, no la entidad completa
      : undefined;

    // 5. Crear la evaluación CON IDs (la forma correcta para TypeORM)
    const evaluacion = this.evaluacionRepo.create({
      // ✅ Solo IDs para relaciones
      inscripcion: { id: inscripcion.id }, // ✅ Solo ID
      materia: { id: materiaId },          // ✅ Solo ID
      estudiante: { id: estudianteId },    // ✅ Solo ID
      tipo,
      titulo,
      nota,
      estado,
      observaciones,
      cargadoPor, // ✅ Ahora es { id: number } o undefined
    });

    // 6. Guardar
    return this.evaluacionRepo.save(evaluacion);
  }

  async getEvaluacionesPorMateria(materiaId: number) {
    return this.evaluacionRepo.find({
      where: { materia: { id: materiaId } },
      relations: ['estudiante', 'inscripcion', 'cargadoPor'],
      order: { fecha: 'ASC' },
    });
  }

  async getEvaluacionesPorEstudiante(estudianteId: number, materiaId: number) {
    return this.evaluacionRepo.find({
      where: { 
        estudiante: { id: estudianteId }, 
        materia: { id: materiaId } 
      },
      order: { fecha: 'ASC' },
    });
  }
}