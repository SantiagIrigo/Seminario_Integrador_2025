// src/horario/horario.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Horario, DiaSemana } from './entities/horario.entity';
import { Materia } from '../materia/entities/materia.entity';
import { User } from '../user/entities/user.entity';
import { Inscripcion } from '../inscripcion/entities/inscripcion.entity';
import { Comision } from '../comision/entities/comision.entity';

// ✅ Interfaces para el formato de horario
export interface HorarioDiario {
  fecha: Date;
  diaSemana: DiaSemana;
  bloques: HorarioBloque[];
}

export interface HorarioBloque {
  materia: {
    id: number;
    nombre: string;
    descripcion?: string;
  };
  comision?: {
    id: number;
    nombre: string;
    descripcion?: string;
  };
  horaInicio: string;
  horaFin: string;
  aula: string;
  esProfesor: boolean;
  materiaId: number;
  comisionId?: number;
}

@Injectable()
export class HorarioService {
  constructor(
    @InjectRepository(Horario)
    private horarioRepo,
    @InjectRepository(Materia)
    private materiaRepo,
    @InjectRepository(User)
    private userRepo,
    @InjectRepository(Inscripcion)
    private inscripcionRepo,
    @InjectRepository(Comision)
    private comisionRepo,
  ) {}

  async crearHorario(
    materiaId: number,
    dia: DiaSemana,
    horaInicio: string,
    horaFin: string,
    aula: string,
    comisionId?: number,
    docenteId?: number,
  ): Promise<Horario> {
    const materia = await this.materiaRepo.findOne({ where: { id: materiaId } });
    if (!materia) {
      throw new NotFoundException('Materia no encontrada');
    }

    // ✅ NUEVA FUNCIONALIDAD: Verificar solapamiento de horarios
    const solapamiento = await this.verificarSolapamiento(
      materiaId,
      dia,
      horaInicio,
      horaFin,
      comisionId,
      docenteId
    );
    
    if (solapamiento) {
      throw new BadRequestException('Ya existe un horario programado para este día y hora');
    }

    // Verificar que la comisión exista si se proporciona
    let comision;
    if (comisionId) {
      comision = await this.comisionRepo.findOne({ where: { id: comisionId } });
      if (!comision) {
        throw new NotFoundException('Comisión no encontrada');
      }
    }

    // Verificar que el docente exista si se proporciona
    let docente;
    if (docenteId) {
      docente = await this.userRepo.findOne({ where: { id: docenteId } });
      if (!docente) {
        throw new NotFoundException('Docente no encontrado');
      }
    }

    const horario = this.horarioRepo.create({
      materia,
      docente,
      comision,
      dia,
      horaInicio,
      horaFin,
      aula,
    });

    return this.horarioRepo.save(horario);
  }

  // ✅ NUEVA FUNCIONALIDAD: Verificar solapamiento de horarios
  private async verificarSolapamiento(
    materiaId: number,
    dia: DiaSemana,
    horaInicio: string,
    horaFin: string,
    comisionId?: number,
    docenteId?: number,
  ): Promise<boolean> {
    const query = this.horarioRepo.createQueryBuilder('horario')
      .where('horario.dia = :dia', { dia })
      .andWhere('(horario.horaInicio < :horaFin AND horario.horaFin > :horaInicio)', { 
        horaInicio, 
        horaFin 
      });

    if (comisionId) {
      query.andWhere('horario.comisionId = :comisionId', { comisionId });
    } else {
      query.andWhere('horario.materiaId = :materiaId', { materiaId });
    }

    if (docenteId) {
      query.andWhere('horario.docenteId = :docenteId', { docenteId });
    }

    const solapamiento = await query.getOne();
    return !!solapamiento;
  }

  async obtenerHorariosPorMateria(materiaId: number): Promise<Horario[]> {
    return this.horarioRepo.find({
      where: { materia: { id: materiaId } },
      relations: ['comision', 'docente'],
      order: { dia: 'ASC', horaInicio: 'ASC' },
    });
  }

  async obtenerHorariosPorComision(comisionId: number): Promise<Horario[]> {
    return this.horarioRepo.find({
      where: { comision: { id: comisionId } },
      relations: ['materia', 'docente'],
      order: { dia: 'ASC', horaInicio: 'ASC' },
    });
  }

  async actualizarHorario(
    id: number,
    dia?: DiaSemana,
    horaInicio?: string,
    horaFin?: string,
    aula?: string,
    comisionId?: number | null,
    docenteId?: number | null,
  ): Promise<Horario> {
    const horario = await this.horarioRepo.findOne({ 
      where: { id },
      relations: ['materia']
    });
    if (!horario) {
      throw new NotFoundException('Horario no encontrado');
    }

    // ✅ NUEVA FUNCIONALIDAD: Verificar solapamiento al actualizar
    if (dia !== undefined || horaInicio !== undefined || horaFin !== undefined) {
      const nuevoDia = dia !== undefined ? dia : horario.dia;
      const nuevaHoraInicio = horaInicio !== undefined ? horaInicio : horario.horaInicio;
      const nuevaHoraFin = horaFin !== undefined ? horaFin : horario.horaFin;
      
      const solapamiento = await this.verificarSolapamiento(
        horario.materia.id,
        nuevoDia,
        nuevaHoraInicio,
        nuevaHoraFin,
        comisionId !== undefined ? comisionId : horario.comision?.id,
        docenteId !== undefined ? docenteId : horario.docente?.id
      );
      
      if (solapamiento) {
        throw new BadRequestException('Ya existe un horario programado para este día y hora');
      }
    }

    // Actualizar campos simples
    if (dia !== undefined) horario.dia = dia;
    if (horaInicio !== undefined) horario.horaInicio = horaInicio;
    if (horaFin !== undefined) horario.horaFin = horaFin;
    if (aula !== undefined) horario.aula = aula;

    // Manejar comisión
    if (comisionId !== undefined) {
      if (comisionId === null) {
        horario.comision = null;
      } else {
        const comision = await this.comisionRepo.findOne({ where: { id: comisionId } });
        if (!comision) {
          throw new NotFoundException('Comisión no encontrada');
        }
        horario.comision = comision;
      }
    }

    // Manejar docente
    if (docenteId !== undefined) {
      if (docenteId === null) {
        horario.docente = null;
      } else {
        const docente = await this.userRepo.findOne({ where: { id: docenteId } });
        if (!docente) {
          throw new NotFoundException('Docente no encontrado');
        }
        horario.docente = docente;
      }
    }

    return this.horarioRepo.save(horario);
  }

  async eliminarHorario(id: number): Promise<void> {
    const horario = await this.horarioRepo.findOne({ where: { id } });
    if (!horario) {
      throw new NotFoundException('Horario no encontrado');
    }

    await this.horarioRepo.remove(horario);
  }

  // ✅ NUEVA FUNCIONALIDAD: Obtener horario personalizado para un usuario
  async obtenerHorarioPersonal(
    userId: number,
    fechaInicio: Date = new Date(),
    fechaFin: Date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días después
  ): Promise<HorarioDiario[]> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Calcular días entre fechaInicio y fechaFin
    const dias = this.getDiasEntreFechas(fechaInicio, fechaFin);
    
    // Preparar estructura de horario
    const horarioSemana: HorarioDiario[] = dias.map(fecha => ({
      fecha,
      diaSemana: this.getDiaSemana(fecha),
      bloques: [],
    }));

    // Obtener horarios según rol
    if (user.rol === 'estudiante') {
      await this.agregarHorariosEstudiante(userId, horarioSemana);
    } else if (user.rol === 'profesor') {
      await this.agregarHorariosProfesor(userId, horarioSemana);
    } else {
      // Para otros roles (admin, secretaría), mostrar horario general
      await this.agregarHorariosGeneral(horarioSemana);
    }

    return horarioSemana;
  }

  private getDiasEntreFechas(fechaInicio: Date, fechaFin: Date): Date[] {
    const fechas: Date[] = [];
    let currentDate = new Date(fechaInicio);
    
    while (currentDate <= fechaFin) {
      fechas.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return fechas;
  }

  private getDiaSemana(fecha: Date): DiaSemana {
    const dia = fecha.getDay();
    switch (dia) {
      case 0: return DiaSemana.DOMINGO;
      case 1: return DiaSemana.LUNES;
      case 2: return DiaSemana.MARTES;
      case 3: return DiaSemana.MIERCOLES;
      case 4: return DiaSemana.JUEVES;
      case 5: return DiaSemana.VIERNES;
      case 6: return DiaSemana.SABADO;
      default: return DiaSemana.LUNES;
    }
  }

  private async agregarHorariosEstudiante(userId: number, horarioSemana: HorarioDiario[]) {
    // Obtener materias en las que está inscripto
    const inscripciones = await this.inscripcionRepo.find({
      where: { estudiante: { id: userId } },
      relations: ['materia', 'materia.horarios', 'materia.comisiones'],
    });

    // Para cada día de la semana
    for (const dia of horarioSemana) {
      // Filtrar horarios para este día
      inscripciones.forEach(inscripcion => {
        // Primero buscamos horarios directos de la materia
        inscripcion.materia.horarios.forEach(horario => {
          if (horario.dia === dia.diaSemana) {
            dia.bloques.push({
              materia: {
                id: inscripcion.materia.id,
                nombre: inscripcion.materia.nombre,
                descripcion: inscripcion.materia.descripcion,
              },
              comision: horario.comision ? {
                id: horario.comision.id,
                nombre: horario.comision.nombre,
                descripcion: horario.comision.descripcion,
              } : undefined,
              horaInicio: horario.horaInicio,
              horaFin: horario.horaFin,
              aula: horario.aula,
              esProfesor: false,
              materiaId: inscripcion.materia.id,
              comisionId: horario.comision ? horario.comision.id : undefined,
            });
          }
        });

        // Luego buscamos horarios de las comisiones de esa materia
        inscripcion.materia.comisiones.forEach(comision => {
          comision.horarios.forEach(horario => {
            if (horario.dia === dia.diaSemana) {
              dia.bloques.push({
                materia: {
                  id: inscripcion.materia.id,
                  nombre: inscripcion.materia.nombre,
                  descripcion: inscripcion.materia.descripcion,
                },
                comision: {
                  id: comision.id,
                  nombre: comision.nombre,
                  descripcion: comision.descripcion,
                },
                horaInicio: horario.horaInicio,
                horaFin: horario.horaFin,
                aula: horario.aula,
                esProfesor: false,
                materiaId: inscripcion.materia.id,
                comisionId: comision.id,
              });
            }
          });
        });
      });

      // Ordenar bloques por hora
      dia.bloques.sort((a, b) => 
        a.horaInicio.localeCompare(b.horaInicio)
      );
    }
  }

  private async agregarHorariosProfesor(userId: number, horarioSemana: HorarioDiario[]) {
    // Obtener materias que dicta
    const materias = await this.materiaRepo.find({
      where: { profesores: { id: userId } },
      relations: ['horarios', 'comisiones', 'comisiones.horarios'],
    });

    // Para cada día de la semana
    for (const dia of horarioSemana) {
      // Filtrar horarios para este día
      materias.forEach(materia => {
        // Horarios directos de la materia
        materia.horarios.forEach(horario => {
          if (horario.dia === dia.diaSemana) {
            dia.bloques.push({
              materia: {
                id: materia.id,
                nombre: materia.nombre,
                descripcion: materia.descripcion,
              },
              comision: horario.comision ? {
                id: horario.comision.id,
                nombre: horario.comision.nombre,
                descripcion: horario.comision.descripcion,
              } : undefined,
              horaInicio: horario.horaInicio,
              horaFin: horario.horaFin,
              aula: horario.aula,
              esProfesor: true,
              materiaId: materia.id,
              comisionId: horario.comision ? horario.comision.id : undefined,
            });
          }
        });

        // Horarios de las comisiones de esta materia
        materia.comisiones.forEach(comision => {
          comision.horarios.forEach(horario => {
            if (horario.dia === dia.diaSemana) {
              dia.bloques.push({
                materia: {
                  id: materia.id,
                  nombre: materia.nombre,
                  descripcion: materia.descripcion,
                },
                comision: {
                  id: comision.id,
                  nombre: comision.nombre,
                  descripcion: comision.descripcion,
                },
                horaInicio: horario.horaInicio,
                horaFin: horario.horaFin,
                aula: horario.aula,
                esProfesor: true,
                materiaId: materia.id,
                comisionId: comision.id,
              });
            }
          });
        });
      });

      // Ordenar bloques por hora
      dia.bloques.sort((a, b) => 
        a.horaInicio.localeCompare(b.horaInicio)
      );
    }
  }

  private async agregarHorariosGeneral(horarioSemana: HorarioDiario[]) {
    // Para roles administrativos, mostrar todos los horarios
    const horarios = await this.horarioRepo.find({
      relations: ['materia', 'comision', 'docente'],
      order: { dia: 'ASC', horaInicio: 'ASC' },
    });

    // Agrupar horarios por día
    for (const dia of horarioSemana) {
      horarios.forEach(horario => {
        if (horario.dia === dia.diaSemana) {
          dia.bloques.push({
            materia: {
              id: horario.materia.id,
              nombre: horario.materia.nombre,
              descripcion: horario.materia.descripcion,
            },
            comision: horario.comision ? {
              id: horario.comision.id,
              nombre: horario.comision.nombre,
              descripcion: horario.comision.descripcion,
            } : undefined,
            horaInicio: horario.horaInicio,
            horaFin: horario.horaFin,
            aula: horario.aula,
            esProfesor: false,
            materiaId: horario.materia.id,
            comisionId: horario.comision ? horario.comision.id : undefined,
          });
        }
      });

      // Ordenar bloques por hora
      dia.bloques.sort((a, b) => 
        a.horaInicio.localeCompare(b.horaInicio)
      );
    }
  }
}