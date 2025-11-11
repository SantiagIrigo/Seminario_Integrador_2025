import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Asistencia, EstadoAsistencia } from './entities/asistencia.entity';
import { Clase, EstadoClase } from '../clase/entities/clase.entity';
import { User } from '../user/entities/user.entity';
import { Inscripcion } from '../inscripcion/entities/inscripcion.entity';
import { UserRole } from '../user/entities/user.entity';

export interface ResumenPorMateria {
  [materiaId: number]: {
    total: number;
    presentes: number;
    justificadas: number;
    ausentes: number;
  };
}

export interface ResumenAsistencias {
  total: number;
  presentes: number;
  justificadas: number;
  ausentes: number;
  porMateria?: ResumenPorMateria;
}

@Injectable()
export class AsistenciaService {
  constructor(
    @InjectRepository(Asistencia)
    private asistenciaRepo,
    @InjectRepository(Clase)
    private claseRepo,
    @InjectRepository(User)
    private userRepo,
    @InjectRepository(Inscripcion)
    private inscripcionRepo,
  ) {}

  async registrarAsistencia(
    claseId: number,
    estudianteId: number,
    estado: EstadoAsistencia,
    motivoJustificacion?: string,
    userId?: number,
    userRole?: UserRole,
  ): Promise<Asistencia> {
    const clase = await this.claseRepo.findOne({ 
      where: { id: claseId },
      relations: ['materia', 'materia.inscripciones', 'materia.inscripciones.estudiante', 'docente'],
    });
    
    if (!clase) {
      throw new NotFoundException('Clase no encontrada');
    }

    if (clase.estado !== EstadoClase.REALIZADA) {
      throw new BadRequestException('La clase debe estar en estado REALIZADA para registrar asistencia');
    }

    if (userId && userRole !== UserRole.SECRETARIA_ACADEMICA) {
      if (!clase.docente || clase.docente.id !== userId) {
        throw new ForbiddenException('Solo el docente de la clase puede registrar asistencia');
      }
    }

    const estudiante = await this.userRepo.findOne({ where: { id: estudianteId } });
    if (!estudiante) {
      throw new NotFoundException('Estudiante no encontrado');
    }

    const inscripto = clase.materia.inscripciones.some(
      inscripcion => inscripcion.estudiante.id === estudianteId
    );

    if (!inscripto) {
      throw new BadRequestException('El estudiante no está inscripto en esta materia');
    }

    let asistencia = await this.asistenciaRepo.findOne({
      where: { clase: { id: claseId }, estudiante: { id: estudianteId } },
    });

    if (asistencia) {
      asistencia.estado = estado;
      if (motivoJustificacion) {
        asistencia.motivoJustificacion = motivoJustificacion;
      }
    } else {
      asistencia = this.asistenciaRepo.create({
        clase,
        estudiante,
        estado,
        motivoJustificacion,
      });
    }

    return this.asistenciaRepo.save(asistencia);
  }

  async obtenerAsistenciasPorClase(claseId: number): Promise<Asistencia[]> {
    return this.asistenciaRepo.find({
      where: { clase: { id: claseId } },
      relations: ['estudiante'],
      order: { estudiante: { apellido: 'ASC' } },
    });
  }

  async obtenerAsistenciasPorEstudiante(estudianteId: number): Promise<Asistencia[]> {
    return this.asistenciaRepo.find({
      where: { estudiante: { id: estudianteId } },
      relations: ['clase', 'clase.materia'],
      order: { clase: { fecha: 'DESC' } },
    });
  }

  async obtenerResumenAsistencias(estudianteId: number, materiaId?: number): Promise<ResumenAsistencias> {
    let where: any = { estudiante: { id: estudianteId } };
    if (materiaId) {
      where.clase = { materia: { id: materiaId } };
    }

    const asistencias = await this.asistenciaRepo.find({
      where,
      relations: ['clase', 'clase.materia'],
    });

    const total = asistencias.length;
    const presentes = asistencias.filter(a => a.estado === EstadoAsistencia.PRESENTE).length;
    const justificadas = asistencias.filter(a => a.estado === EstadoAsistencia.JUSTIFICADA).length;
    const ausentes = asistencias.filter(a => a.estado === EstadoAsistencia.AUSENTE).length;

    let porMateria: ResumenPorMateria | undefined;
    if (!materiaId) {
      const materiaIds = Array.from(
        new Set(
          asistencias
            .map(a => {
              const id = Number(a.clase.materia.id);
              return isNaN(id) ? null : id;
            })
            .filter((id): id is number => id !== null)
        )
      ) as number[];

      porMateria = materiaIds.reduce<ResumenPorMateria>((acc, materiaId) => {
        const asistenciasMateria = asistencias.filter(a => {
          const id = Number(a.clase.materia.id);
          return !isNaN(id) && id === materiaId;
        });
        
        const presentesMateria = asistenciasMateria.filter(
          a => a.estado === EstadoAsistencia.PRESENTE
        ).length;
        
        const justificadasMateria = asistenciasMateria.filter(
          a => a.estado === EstadoAsistencia.JUSTIFICADA
        ).length;
        
        const ausentesMateria = asistenciasMateria.filter(
          a => a.estado === EstadoAsistencia.AUSENTE
        ).length;
        
        acc[materiaId] = {
          total: asistenciasMateria.length,
          presentes: presentesMateria,
          justificadas: justificadasMateria,
          ausentes: ausentesMateria,
        };
        
        return acc;
      }, {} as ResumenPorMateria);
    }

    return {
      total,
      presentes,
      justificadas,
      ausentes,
      porMateria,
    };
  }
}
