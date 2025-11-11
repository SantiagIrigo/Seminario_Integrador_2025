// src/clase/clase.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Between, IsNull, Not } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Clase } from './entities/clase.entity';
import { EstadoClase } from './entities/clase.entity';
import { Horario } from '../horario/entities/horario.entity';
import { Materia } from '../materia/entities/materia.entity';
import { User } from '../user/entities/user.entity';
import { Inscripcion } from '../inscripcion/entities/inscripcion.entity';
import { Comision } from '../comision/entities/comision.entity'; // ✅ Importar Comision

// Re-export EstadoClase for use in other modules
export { EstadoClase } from './entities/clase.entity';

@Injectable()
export class ClaseService {
  constructor(
    @InjectRepository(Clase)
    private claseRepo,
    @InjectRepository(Materia)
    private materiaRepo,
    @InjectRepository(Horario)
    private horarioRepo,
    @InjectRepository(User)
    private userRepo,
    @InjectRepository(Inscripcion)
    private inscripcionRepo,
    @InjectRepository(Comision)
    private comisionRepo, // ✅ Añadir repositorio de comisiones
  ) {}

  async crearClase(
    materiaId: number,
    fecha: Date,
    horarioId?: number,
    comisionId?: number, // ✅ Añadir comisionId opcional
    estado: EstadoClase = EstadoClase.PROGRAMADA,
    motivoCancelacion?: string,
  ): Promise<Clase> {
    const materia = await this.materiaRepo.findOne({ 
      where: { id: materiaId },
      relations: ['inscripciones', 'inscripciones.estudiante', 'comisiones'], // ✅ Incluir comisiones
    });
    
    if (!materia) {
      throw new NotFoundException('Materia no encontrada');
    }

    let horario;
    if (horarioId) {
      horario = await this.horarioRepo.findOne({ where: { id: horarioId } });
      if (!horario) {
        throw new NotFoundException('Horario no encontrado');
      }
    }

    // Verificar que la comisión exista si se proporciona
    let comision;
    if (comisionId) {
      comision = await this.comisionRepo.findOne({ where: { id: comisionId } });
      if (!comision) {
        throw new NotFoundException('Comisión no encontrada');
      }
    }

    // Verificar que no haya otra clase en la misma fecha y hora
    const solapamiento = await this.claseRepo.findOne({
      where: {
        materia: { id: materiaId },
        fecha,
      },
    });

    if (solapamiento) {
      throw new BadRequestException('Ya existe una clase programada para esta fecha');
    }

    const clase = this.claseRepo.create({
      materia,
      horario,
      comision, // ✅ Añadir comisión
      fecha,
      estado,
      motivoCancelacion,
    });

    const claseGuardada = await this.claseRepo.save(clase);

    // Crear registros de asistencia para todos los estudiantes inscriptos
    if (estado === EstadoClase.REALIZADA && materia.inscripciones) {
      await this.crearRegistrosAsistencia(claseGuardada, materia.inscripciones);
    }

    return claseGuardada;
  }

  private async crearRegistrosAsistencia(clase: Clase, inscripciones: Inscripcion[]) {
    const asistencias = inscripciones.map(inscripcion => ({
      clase,
      estudiante: inscripcion.estudiante,
      estado: 'ausente' as const,
    }));

    await this.claseRepo.manager.save(asistencias);
  }

  async obtenerClasesPorMateria(materiaId: number): Promise<Clase[]> {
    return this.claseRepo.find({
      where: { materia: { id: materiaId } },
      relations: ['horario', 'comision', 'asistencias', 'asistencias.estudiante'], // ✅ Incluir comision
      order: { fecha: 'DESC' },
    });
  }

  async obtenerClasesPorComision(comisionId: number): Promise<Clase[]> {
    return this.claseRepo.find({
      where: { comision: { id: comisionId } },
      relations: ['materia', 'horario', 'asistencias', 'asistencias.estudiante'],
      order: { fecha: 'DESC' },
    });
  }

  async obtenerClasesPorEstudiante(estudianteId: number): Promise<Clase[]> {
    return this.claseRepo
      .createQueryBuilder('clase')
      .innerJoin('clase.asistencias', 'asistencia')
      .innerJoin('asistencia.estudiante', 'estudiante')
      .where('estudiante.id = :estudianteId', { estudianteId })
      .orderBy('clase.fecha', 'DESC')
      .getMany();
  }

  async actualizarClase(
    id: number,
    fecha?: Date,
    estado?: EstadoClase,
    motivoCancelacion?: string,
    comisionId?: number | null, // ✅ Añadir comisionId opcional
  ): Promise<Clase> {
    const clase = await this.claseRepo.findOne({
      where: { id },
      relations: ['materia', 'materia.inscripciones', 'materia.inscripciones.estudiante', 'comision'], // ✅ Incluir comision
    });
    
    if (!clase) {
      throw new NotFoundException('Clase no encontrada');
    }

    // Manejar comisión
    if (comisionId !== undefined) {
      if (comisionId === null) {
        clase.comision = null;
      } else {
        const comision = await this.comisionRepo.findOne({ where: { id: comisionId } });
        if (!comision) {
          throw new NotFoundException('Comisión no encontrada');
        }
        clase.comision = comision;
      }
    }

    if (fecha) clase.fecha = fecha;
    if (estado) clase.estado = estado;
    if (motivoCancelacion) clase.motivoCancelacion = motivoCancelacion;

    // Si se marca como realizada, crear registros de asistencia si no existen
    if (estado === EstadoClase.REALIZADA && clase.asistencias?.length === 0 && clase.materia.inscripciones) {
      await this.crearRegistrosAsistencia(clase, clase.materia.inscripciones);
    }

    return this.claseRepo.save(clase);
  }

  async cancelarClase(id: number, motivo: string): Promise<Clase> {
    return this.actualizarClase(id, undefined, EstadoClase.CANCELADA, motivo);
  }

  async obtenerClasePorId(id: number): Promise<Clase> {
    const clase = await this.claseRepo.findOne({
      where: { id },
      relations: ['materia', 'horario', 'comision', 'asistencias'],
    });

    if (!clase) {
      throw new NotFoundException('Clase no encontrada');
    }

    return clase;
  }

  async obtenerClasesPendientesAsistencia(): Promise<Clase[]> {
    const hoy = new Date();
    
    // Obtener clases pasadas o de hoy que no tengan asistencias registradas
    const clases = await this.claseRepo.find({
      where: {
        fecha: Between(
          new Date('2000-01-01'), // Fecha mínima
          hoy,
        ),
        estado: EstadoClase.PROGRAMADA,
      },
      relations: [
        'materia',
        'horario',
        'comision',
        'comision.docente',
        'asistencias',
      ],
      order: {
        fecha: 'DESC',
      },
    });

    // Filtrar las clases que no tienen asistencias registradas
    return clases.filter(clase => !clase.asistencias || clase.asistencias.length === 0);
  }
}