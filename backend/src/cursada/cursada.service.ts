// src/cursada/cursada.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inscripcion } from '../inscripcion/entities/inscripcion.entity';
import { User } from '../user/entities/user.entity';
import { Materia } from '../materia/entities/materia.entity';
import { Comision } from '../comision/entities/comision.entity';
import { CursadaResponseDto } from './dto/cursada-response.dto';

@Injectable()
export class CursadaService {
  constructor(
    @InjectRepository(Inscripcion)
    private readonly inscripcionRepository: Repository<Inscripcion>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Materia)
    private readonly materiaRepository: Repository<Materia>,
    @InjectRepository(Comision)
    private readonly comisionRepository: Repository<Comision>,
  ) {}

  async historialAcademico(userId: number): Promise<CursadaResponseDto[]> {
    const inscripciones = await this.inscripcionRepository
      .createQueryBuilder('inscripcion')
      .leftJoinAndSelect('inscripcion.materia', 'materia')
      .leftJoinAndSelect('inscripcion.comision', 'comision')
      .leftJoinAndSelect('inscripcion.estudiante', 'estudiante')
      .where('estudiante.id = :userId', { userId })
      .select([
        'inscripcion.id',
        'inscripcion.faltas',
        'inscripcion.notaFinal',
        'inscripcion.stc',
        'inscripcion.fechaInscripcion',
        'inscripcion.fechaFinalizacion',
        'materia.id',
        'materia.nombre',
        'comision.id',
        'comision.nombre',
        'estudiante.id',
        'estudiante.nombre',
        'estudiante.apellido',
        'estudiante.legajo',
      ])
      .orderBy('inscripcion.fechaInscripcion', 'DESC')
      .getMany();
    return inscripciones.map(i => this.mapToResponseDto(i));
  }

  async materiasDelEstudiante(userId: number): Promise<CursadaResponseDto[]> {
    const inscripciones = await this.inscripcionRepository
      .createQueryBuilder('inscripcion')
      .leftJoinAndSelect('inscripcion.materia', 'materia')
      .leftJoinAndSelect('inscripcion.comision', 'comision')
      .leftJoinAndSelect('inscripcion.estudiante', 'estudiante')
      .where('estudiante.id = :userId', { userId })
      .andWhere('inscripcion.stc = :stc', { stc: 'cursando' })
      .select([
        'inscripcion.id',
        'inscripcion.faltas',
        'inscripcion.notaFinal',
        'inscripcion.stc',
        'inscripcion.fechaInscripcion',
        'inscripcion.fechaFinalizacion',
        'materia.id',
        'materia.nombre',
        'comision.id',
        'comision.nombre',
        'estudiante.id',
        'estudiante.nombre',
        'estudiante.apellido',
        'estudiante.legajo',
      ])
      .getMany();
    return inscripciones.map(i => this.mapToResponseDto(i));
  }

  async cargarFaltas(inscripcionId: number, faltas: number, profesorId: number): Promise<CursadaResponseDto> {
    const inscripcion = await this.inscripcionRepository
      .createQueryBuilder('inscripcion')
      .leftJoinAndSelect('inscripcion.materia', 'materia')
      .leftJoinAndSelect('materia.profesores', 'profesor')
      .where('inscripcion.id = :id', { id: inscripcionId })
      .andWhere('profesor.id = :profesorId', { profesorId })
      .select([
        'inscripcion.id',
        'inscripcion.faltas',
        'inscripcion.notaFinal',
        'inscripcion.stc',
        'inscripcion.fechaInscripcion',
        'inscripcion.fechaFinalizacion',
        'materia.id',
        'materia.nombre',
        'comision.id',
        'comision.nombre',
        'estudiante.id',
        'estudiante.nombre',
        'estudiante.apellido',
        'estudiante.legajo',
      ])
      .getOne();

    if (!inscripcion) {
      throw new Error('Inscripción no encontrada o no eres docente de esta materia');
    }

    inscripcion.faltas = faltas;
    const updated = await this.inscripcionRepository.save(inscripcion);
    return this.mapToResponseDto(updated);
  }

  async cargarNota(inscripcionId: number, notaFinal: number, stc: string, profesorId: number): Promise<CursadaResponseDto> {
    const inscripcion = await this.inscripcionRepository
      .createQueryBuilder('inscripcion')
      .leftJoinAndSelect('inscripcion.materia', 'materia')
      .leftJoinAndSelect('materia.profesores', 'profesor')
      .where('inscripcion.id = :id', { id: inscripcionId })
      .andWhere('profesor.id = :profesorId', { profesorId })
      .select([
        'inscripcion.id',
        'inscripcion.faltas',
        'inscripcion.notaFinal',
        'inscripcion.stc',
        'inscripcion.fechaInscripcion',
        'inscripcion.fechaFinalizacion',
        'materia.id',
        'materia.nombre',
        'comision.id',
        'comision.nombre',
        'estudiante.id',
        'estudiante.nombre',
        'estudiante.apellido',
        'estudiante.legajo',
      ])
      .getOne();

    if (!inscripcion) {
      throw new Error('Inscripción no encontrada o no eres docente de esta materia');
    }

    inscripcion.notaFinal = notaFinal;
    inscripcion.stc = stc;
    const updated = await this.inscripcionRepository.save(inscripcion);
    return this.mapToResponseDto(updated);
  }

  async detalleMateria(inscripcionId: number, userId: number): Promise<CursadaResponseDto> {
    const inscripcion = await this.inscripcionRepository
      .createQueryBuilder('inscripcion')
      .leftJoinAndSelect('inscripcion.materia', 'materia')
      .leftJoinAndSelect('inscripcion.estudiante', 'estudiante')
      .leftJoinAndSelect('inscripcion.comision', 'comision')
      .where('inscripcion.id = :id', { id: inscripcionId })
      .andWhere('estudiante.id = :userId', { userId })
      .select([
        'inscripcion.id',
        'inscripcion.faltas',
        'inscripcion.notaFinal',
        'inscripcion.stc',
        'inscripcion.fechaInscripcion',
        'inscripcion.fechaFinalizacion',
        'materia.id',
        'materia.nombre',
        'comision.id',
        'comision.nombre',
        'estudiante.id',
        'estudiante.nombre',
        'estudiante.apellido',
        'estudiante.legajo',
      ])
      .getOne();

    if (!inscripcion) {
      throw new Error('Inscripción no encontrada o no te pertenece');
    }

    return this.mapToResponseDto(inscripcion);
  }

  private mapToResponseDto(inscripcion: Inscripcion): CursadaResponseDto {
    return {
      id: inscripcion.id,
      estudiante: {
        id: inscripcion.estudiante.id,
        nombre: inscripcion.estudiante.nombre,
        apellido: inscripcion.estudiante.apellido,
        legajo: inscripcion.estudiante.legajo,
      },
      materia: {
        id: inscripcion.materia.id,
        nombre: inscripcion.materia.nombre,
      },
      comision: inscripcion.comision ? {
        id: inscripcion.comision.id,
        nombre: inscripcion.comision.nombre,
      } : undefined,
      faltas: inscripcion.faltas,
      notaFinal: inscripcion.notaFinal,
      stc: inscripcion.stc,
      fechaInscripcion: inscripcion.fechaInscripcion,
      fechaFinalizacion: inscripcion.fechaFinalizacion,
    };
  }
}
