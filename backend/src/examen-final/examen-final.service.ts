import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { ExamenFinal } from './entities/examen-final.entity';
import { CreateExamenFinalDto } from './dto/create-examen-final.dto';
import { UpdateExamenFinalDto } from './dto/update-examen-final.dto';
import { ExamenFinalResponseDto } from './dto/examen-final-response.dto';
import { plainToClass } from 'class-transformer';
import { User } from '../user/entities/user.entity';
import { Materia } from '../materia/entities/materia.entity';

@Injectable()
export class ExamenFinalService {
  constructor(
    @InjectRepository(ExamenFinal)
    private examenFinalRepository: Repository<ExamenFinal>,
    @InjectRepository(Materia)
    private materiaRepository: Repository<Materia>,
  ) {}

  private async checkJefeCatedraOrAdmin(user: User, materiaId: number): Promise<boolean> {
    // Si el usuario es administrador, tiene permiso
    if (user.rol === 'admin') {
      return true;
    }

    // Buscar la materia y verificar si el usuario es el jefe de cátedra
    const materia = await this.materiaRepository.findOne({
      where: { id: materiaId },
      relations: ['jefeCatedra']
    });

    if (!materia) {
      throw new NotFoundException(`Materia con ID ${materiaId} no encontrada`);
    }

    // Verificar si el usuario es el jefe de cátedra de la materia
    if (materia.jefeCatedra && materia.jefeCatedra.id === user.id) {
      return true;
    }

    return false;
  }

  async create(
    createExamenFinalDto: CreateExamenFinalDto,
    user: User
  ): Promise<ExamenFinalResponseDto> {
    // Verificar si el usuario es administrador o jefe de cátedra de la materia
    const isAuthorized = await this.checkJefeCatedraOrAdmin(user, createExamenFinalDto.materiaId);
    if (!isAuthorized) {
      throw new ForbiddenException('No tiene permisos para crear exámenes finales para esta materia');
    }
    // Validar que si se proporciona hora de inicio práctico, también debe estar la de fin y el aula
    if (
      (createExamenFinalDto.horaInicioPractico && !createExamenFinalDto.horaFinPractico) ||
      (createExamenFinalDto.horaFinPractico && !createExamenFinalDto.horaInicioPractico) ||
      (createExamenFinalDto.horaInicioPractico && !createExamenFinalDto.aulaPractico)
    ) {
      throw new BadRequestException('Si se proporciona el horario práctico, deben incluirse tanto la hora de inicio, fin y el aula');
    }

    // Validar que la fecha no sea en el pasado
    const fechaExamen = new Date(createExamenFinalDto.fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    if (fechaExamen < hoy) {
      throw new BadRequestException('La fecha del examen no puede ser en el pasado');
    }

    // Validar que no haya otro examen en la misma materia en la misma fecha
    const fechaExamenBusqueda = new Date(createExamenFinalDto.fecha);
    fechaExamenBusqueda.setHours(0, 0, 0, 0);
    
    const existeExamen = await this.examenFinalRepository.findOne({
      where: {
        materia: { id: createExamenFinalDto.materiaId },
        fecha: fechaExamenBusqueda,
      },
    });

    if (existeExamen) {
      throw new BadRequestException('Ya existe un examen programado para esta materia en la fecha seleccionada');
    }

    const examen = this.examenFinalRepository.create({
      materia: { id: createExamenFinalDto.materiaId },
      docente: { id: createExamenFinalDto.docenteId },
      fecha: createExamenFinalDto.fecha,
      horaInicioTeorico: createExamenFinalDto.horaInicioTeorico,
      horaFinTeorico: createExamenFinalDto.horaFinTeorico,
      aulaTeorico: createExamenFinalDto.aulaTeorico,
      horaInicioPractico: createExamenFinalDto.horaInicioPractico,
      horaFinPractico: createExamenFinalDto.horaFinPractico,
      aulaPractico: createExamenFinalDto.aulaPractico,
      cupo: createExamenFinalDto.cupo || 30,
      inscriptos: 0,
    });

    const savedExamen = await this.examenFinalRepository.save(examen);
    return this.findOne(savedExamen.id);
  }

  async findAll(): Promise<ExamenFinalResponseDto[]> {
    // Crear una fecha de inicio del día actual a las 00:00:00
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const examenes = await this.examenFinalRepository.find({
      where: {
        fecha: MoreThanOrEqual(hoy),
      },
      relations: ['materia', 'docente'],
      order: {
        fecha: 'ASC',
        horaInicioTeorico: 'ASC',
      },
    });

    return examenes.map(examen => this.mapToResponseDto(examen));
  }

  async findOne(id: number): Promise<ExamenFinalResponseDto> {
    const examen = await this.examenFinalRepository.findOne({
      where: { id },
      relations: ['materia', 'docente'],
    });

    if (!examen) {
      throw new NotFoundException(`Examen con ID ${id} no encontrado`);
    }

    return this.mapToResponseDto(examen);
  }

  async update(
    id: number, 
    updateExamenFinalDto: UpdateExamenFinalDto,
    user: User
  ): Promise<ExamenFinalResponseDto> {
    // Buscar el examen con las relaciones necesarias
    const examen = await this.examenFinalRepository.findOne({
      where: { id },
      relations: ['materia', 'materia.jefeCatedra']
    });

    if (!examen) {
      throw new NotFoundException(`Examen final con ID ${id} no encontrado`);
    }

    // Verificar si el usuario es administrador o jefe de cátedra de la materia
    const isAuthorized = await this.checkJefeCatedraOrAdmin(user, examen.materia.id);
    if (!isAuthorized) {
      throw new ForbiddenException('No tiene permisos para actualizar este examen final');
    }

    // Validar que si se actualiza la fecha, no sea en el pasado
    if (updateExamenFinalDto.fecha) {
      const fechaExamen = new Date(updateExamenFinalDto.fecha);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      if (fechaExamen < hoy) {
        throw new BadRequestException('La fecha del examen no puede ser en el pasado');
      }
    }

    // Validar que no haya otro examen en la misma materia en la misma fecha
    if (updateExamenFinalDto.fecha || updateExamenFinalDto.materiaId) {
      const materiaId = updateExamenFinalDto.materiaId || examen.materia.id;
      const fecha = updateExamenFinalDto.fecha || examen.fecha;
      
      const existeExamen = await this.examenFinalRepository
        .createQueryBuilder('examen')
        .where('examen.materiaId = :materiaId', { materiaId })
        .andWhere('examen.fecha = :fecha', { fecha })
        .andWhere('examen.id != :id', { id })
        .getOne();

      if (existeExamen) {
        throw new BadRequestException('Ya existe un examen programado para esta materia en la fecha seleccionada');
      }
    }

    await this.examenFinalRepository.update(id, {
      ...updateExamenFinalDto,
      materia: updateExamenFinalDto.materiaId ? { id: updateExamenFinalDto.materiaId } : undefined,
      docente: updateExamenFinalDto.docenteId ? { id: updateExamenFinalDto.docenteId } : undefined,
    });

    return this.findOne(id);
  }

  async remove(id: number, user: User): Promise<void> {
    const examen = await this.examenFinalRepository.findOne({
      where: { id },
      relations: ['materia', 'materia.jefeCatedra']
    });

    if (!examen) {
      throw new NotFoundException(`Examen final con ID ${id} no encontrado`);
    }

    // Verificar si el usuario es administrador o jefe de cátedra de la materia
    const isAuthorized = await this.checkJefeCatedraOrAdmin(user, examen.materia.id);
    if (!isAuthorized) {
      throw new ForbiddenException('No tiene permisos para eliminar este examen final');
    }

    const result = await this.examenFinalRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Examen con ID ${id} no encontrado`);
    }
  }

  private mapToResponseDto(examen: ExamenFinal): ExamenFinalResponseDto {
    const fechaStr = typeof (examen as any).fecha === 'string'
      ? (examen as any).fecha
      : (examen as any).fecha?.toISOString()?.split('T')[0];

    const response = plainToClass(ExamenFinalResponseDto, {
      id: examen.id,
      materia: examen.materia ? { id: examen.materia.id, nombre: examen.materia.nombre } : undefined,
      docente: examen.docente ? { id: examen.docente.id, nombre: examen.docente.nombre, apellido: examen.docente.apellido } : undefined,
      fecha: fechaStr,
      horaInicioTeorico: examen.horaInicioTeorico,
      horaFinTeorico: examen.horaFinTeorico,
      aulaTeorico: examen.aulaTeorico,
      horaInicioPractico: examen.horaInicioPractico,
      horaFinPractico: examen.horaFinPractico,
      aulaPractico: examen.aulaPractico,
      cupo: examen.cupo,
      inscriptos: examen.inscriptos,
      disponibles: Math.max(0, (examen.cupo || 0) - (examen.inscriptos || 0)),
      createdAt: (examen as any).createdAt,
      updatedAt: (examen as any).updatedAt,
    });

    return response;
  }
}
