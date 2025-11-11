// src/inscripcion-examen/inscripcion-examen.service.ts
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InscripcionExamen } from './entities/inscripcion-examen.entity';
import { Inscripcion } from '../inscripcion/entities/inscripcion.entity';
import { ExamenFinal } from '../examen-final/entities/examen-final.entity';
import { CorrelativasService } from '../correlativas/correlativas.service';
import { CreateInscripcionExamenDto } from './dto/create-inscripcion-examen.dto';
import { UpdateInscripcionExamenDto } from './dto/update-inscripcion-examen.dto';

@Injectable()
export class InscripcionExamenService {
  constructor(
    @InjectRepository(InscripcionExamen)
    private inscripcionExamenRepo,
    
    @InjectRepository(Inscripcion)
    private inscripcionRepo,
    
    @InjectRepository(ExamenFinal)
    private examenFinalRepo,
    
    private correlativasService: CorrelativasService,
  ) {}

  async inscribirse(dto: CreateInscripcionExamenDto): Promise<InscripcionExamen> {
    // Verificar que la inscripción exista
    const inscripcion = await this.inscripcionRepo.findOne({ 
      where: { id: dto.inscripcionId },
      relations: ['materia', 'estudiante']
    });
    
    if (!inscripcion) {
      throw new NotFoundException('Inscripción no encontrada');
    }

    // Verificar que el examen final exista (nuevo modelo)
    const examen = await this.examenFinalRepo.findOne({ 
      where: { id: dto.examenId },
      relations: ['materia']
    });
    
    if (!examen) {
      throw new NotFoundException('Examen final no encontrado');
    }

    // Verificar que corresponda a la misma materia de la inscripción
    if (!inscripcion.materia || !examen.materia || inscripcion.materia.id !== examen.materia.id) {
      throw new BadRequestException('La inscripción no corresponde a la materia del examen');
    }

    // Verificar cupo disponible
    if ((examen.inscriptos || 0) >= (examen.cupo || 0)) {
      throw new BadRequestException('No hay cupos disponibles para este examen');
    }

    // ✅ Verificación mejorada con el nuevo servicio
    const verificacion = await this.correlativasService.verificarInscripcionExamenFinal(
      inscripcion.estudiante.id, 
      dto.inscripcionId
    );

    if (!verificacion.cumple) {
      const materias = verificacion.faltantes?.map(f => f.nombre).join(', ') || 'correlativas pendientes';
      throw new BadRequestException(`No cumple correlativas para examen final: ${materias}`);
    }

    // Verificar que la inscripción sea válida para examen final
    if (inscripcion.stc !== 'cursada' && inscripcion.stc !== 'aprobada') {
      throw new BadRequestException('No puedes inscribirte a examen final si no has cursado la materia');
    }

    // Verificar si ya está inscripto en ese examen
    const yaInscripto = await this.inscripcionExamenRepo.findOne({
      where: { inscripcion: { id: dto.inscripcionId }, examenFinal: { id: dto.examenId } }
    });

    if (yaInscripto) {
      throw new BadRequestException('Ya estás inscripto a este examen final');
    }

    // Crear inscripción
    const inscripcionExamen = this.inscripcionExamenRepo.create({
      inscripcion,
      examenFinal: examen,
      estado: dto.estado || 'inscripto',
      nota: dto.nota
    });

    const saved = await this.inscripcionExamenRepo.save(inscripcionExamen);

    // Actualizar contador de inscriptos del examen
    await this.examenFinalRepo.update(examen.id, { inscriptos: (examen.inscriptos || 0) + 1 });

    return saved;
  }

  async obtenerInscripcionesPorEstudiante(estudianteId: number): Promise<InscripcionExamen[]> {
    return this.inscripcionExamenRepo.find({
      where: { 
        inscripcion: { estudiante: { id: estudianteId } } 
      },
      relations: ['examenFinal', 'inscripcion', 'examenFinal.materia', 'examenFinal.docente'],
      order: { examenFinal: { id: 'DESC' } }
    });
  }

  async obtenerInscripcionesPorMateria(materiaId: number): Promise<InscripcionExamen[]> {
    return this.inscripcionExamenRepo.find({
      where: { 
        examenFinal: { materia: { id: materiaId } } 
      },
      relations: ['examenFinal', 'inscripcion'],
      order: { examenFinal: { id: 'DESC' } }
    });
  }

  async obtenerInscripcionesPorExamen(examenId: number): Promise<InscripcionExamen[]> {
    return this.inscripcionExamenRepo.find({
      where: { examenFinal: { id: examenId } },
      relations: ['inscripcion', 'examenFinal'],
      order: { inscripcion: { id: 'ASC' } }
    });
  }

  async actualizarEstado(inscripcionExamenId: number, dto: UpdateInscripcionExamenDto): Promise<InscripcionExamen> {
    const inscripcionExamen = await this.inscripcionExamenRepo.findOne({ 
      where: { id: inscripcionExamenId },
      relations: ['examenFinal']
    });
    
    if (!inscripcionExamen) {
      throw new NotFoundException('Inscripción a examen no encontrada');
    }

    Object.assign(inscripcionExamen, dto);
    return this.inscripcionExamenRepo.save(inscripcionExamen);
  }

  async removerInscripcion(inscripcionExamenId: number): Promise<void> {
    const inscripcionExamen = await this.inscripcionExamenRepo.findOne({ 
      where: { id: inscripcionExamenId },
      relations: ['examenFinal']
    });
    
    if (!inscripcionExamen) {
      throw new NotFoundException('Inscripción a examen no encontrada');
    }

    await this.inscripcionExamenRepo.delete(inscripcionExamenId);

    // Ajustar contador del examen si corresponde
    if (inscripcionExamen.examenFinal) {
      const examen = inscripcionExamen.examenFinal;
      await this.examenFinalRepo.update(examen.id, { inscriptos: Math.max(0, (examen.inscriptos || 1) - 1) });
    }
  }

  // Permitir que el estudiante cancele su propia inscripción
  async removerInscripcionDeEstudiante(inscripcionExamenId: number, estudianteId: number): Promise<void> {
    const inscripcionExamen = await this.inscripcionExamenRepo.findOne({
      where: { id: inscripcionExamenId },
      relations: ['inscripcion', 'inscripcion.estudiante', 'examenFinal']
    });

    if (!inscripcionExamen) {
      throw new NotFoundException('Inscripción a examen no encontrada');
    }

    if (inscripcionExamen.inscripcion?.estudiante?.id !== estudianteId) {
      throw new ForbiddenException('No puede cancelar una inscripción que no es suya');
    }

    await this.inscripcionExamenRepo.delete(inscripcionExamenId);

    if (inscripcionExamen.examenFinal) {
      const examen = inscripcionExamen.examenFinal;
      await this.examenFinalRepo.update(examen.id, { inscriptos: Math.max(0, (examen.inscriptos || 1) - 1) });
    }
  }
}