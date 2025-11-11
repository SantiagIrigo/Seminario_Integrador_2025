import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { Inscripcion } from '../inscripcion/entities/inscripcion.entity';
import { MateriaPlanEstudio } from '../materia/entities/materia-plan-estudio.entity';
import { Asistencia, EstadoAsistencia } from '../asistencia/entities/asistencia.entity';
import { ExamenFinal } from '../examen-final/entities/examen-final.entity';

export interface EstadisticasEstudiante {
  totalMaterias: number;
  materiasInscriptas: number;
  asistenciaPromedio: number;
  proximosExamenes: number;
  proximosClases: number;
}

interface ActividadReciente {
  fecha: Date;
  hora: string;
  accion: string;
  estado?: string;
  presente?: boolean;
}

interface EventoProximo {
  titulo: string;
  fecha: string;
  hora: string;
  descripcion: string;
}

@Injectable()
export class EstadisticasService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Inscripcion)
    private readonly inscripcionRepository: Repository<Inscripcion>,
    @InjectRepository(MateriaPlanEstudio)
    private readonly materiaPlanRepository: Repository<MateriaPlanEstudio>,
    @InjectRepository(Asistencia)
    private readonly asistenciaRepository: Repository<Asistencia>,
    @InjectRepository(ExamenFinal)
    private readonly examenFinalRepository: Repository<ExamenFinal>,
  ) {}

  async obtenerEstadisticasEstudiante(userId: number): Promise<EstadisticasEstudiante> {
    // Si no hay userId (usuario no autenticado), devolver datos por defecto
    if (!userId) {
      return {
        totalMaterias: 0,
        materiasInscriptas: 0,
        asistenciaPromedio: 0,
        proximosExamenes: 0,
        proximosClases: 0,
      };
    }

    try {
      // Obtener usuario con plan de estudios
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['planEstudio'],
      });

      if (!user || !user.planEstudio) {
        return {
          totalMaterias: 0,
          materiasInscriptas: 0,
          asistenciaPromedio: 0,
          proximosExamenes: 0,
          proximosClases: 0,
        };
      }

      // 1. Total de materias en el plan de estudios del estudiante
      const totalMaterias = await this.materiaPlanRepository.count({
        where: { planEstudioId: user.planEstudio.id },
      });

      // 2. Materias inscriptas actualmente (inscripciones activas)
      const materiasInscriptas = await this.inscripcionRepository.count({
        where: {
          estudiante: { id: userId },
        },
      });

      // 3. Asistencia promedio del estudiante
      const asistencias = await this.asistenciaRepository.find({
        where: { estudiante: { id: userId } },
        relations: ['clase'],
      });

      let asistenciaPromedio = 0;
      if (asistencias.length > 0) {
        const asistenciasPresente = asistencias.filter(a => a.estado === EstadoAsistencia.PRESENTE).length;
        asistenciaPromedio = Math.round((asistenciasPresente / asistencias.length) * 100);
      }

      // 4. Próximos exámenes finales (próximos 30 días)
      const fechaDesde = new Date();

      const proximosExamenes = await this.examenFinalRepository.count({
        where: {
          fecha: MoreThanOrEqual(fechaDesde),
        },
      });

      return {
        totalMaterias,
        materiasInscriptas,
        asistenciaPromedio,
        proximosExamenes,
        proximosClases: 0,
      };
    } catch (error) {
      console.error('Error al obtener estadísticas del estudiante:', error);
      // En caso de error, devolver datos por defecto en lugar de lanzar excepción
      return {
        totalMaterias: 0,
        materiasInscriptas: 0,
        asistenciaPromedio: 0,
        proximosExamenes: 0,
        proximosClases: 0,
      };
    }
  }

  async obtenerActividadReciente(userId: number, limite: number = 10): Promise<ActividadReciente[]> {
    // Si no hay userId (usuario no autenticado), devolver array vacío
    if (!userId) {
      return [];
    }

    try {
      const actividades: ActividadReciente[] = [];

      // Obtener inscripciones recientes
      const inscripciones = await this.inscripcionRepository.find({
        where: { estudiante: { id: userId } },
        relations: ['materia'],
        order: { fechaInscripcion: 'DESC' },
        take: limite,
      });

      inscripciones.forEach(inscripcion => {
        const fecha = new Date(inscripcion.fechaInscripcion);
        const hora = `${fecha.getHours()}:${fecha.getMinutes().toString().padStart(2, '0')}`;
        const accion = `Inscripción a ${inscripcion.materia.nombre}`;
        const estado = inscripcion.notaFinal ? 'completa' : 'activa';
        actividades.push({ fecha, hora, accion, estado });
      });

      // Obtener asistencias recientes
      const asistencias = await this.asistenciaRepository.find({
        where: { estudiante: { id: userId } },
        relations: ['clase', 'clase.materia'],
        order: { fechaRegistro: 'DESC' },
        take: limite,
      });

      asistencias.forEach(asistencia => {
        const fecha = new Date(asistencia.fechaRegistro);
        const hora = `${fecha.getHours()}:${fecha.getMinutes().toString().padStart(2, '0')}`;
        const accion = `Asistencia registrada - ${asistencia.clase.materia.nombre}`;
        const presente = asistencia.estado === EstadoAsistencia.PRESENTE;
        actividades.push({ fecha, hora, accion, presente });
      });

      // Ordenar por fecha más reciente primero
      return actividades
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
        .slice(0, limite);
    } catch (error) {
      console.error('Error al obtener actividad reciente:', error);
      return [];
    }
  }

  async obtenerProximosEventos(userId: number, limite: number = 5): Promise<EventoProximo[]> {
    // Si no hay userId (usuario no autenticado), devolver array vacío
    if (!userId) {
      return [];
    }

    try {
      const eventos: EventoProximo[] = [];
      const fechaDesde = new Date();

      // Obtener clases próximas (próximos 7 días)
      const clases = await this.inscripcionRepository.find({
        where: { estudiante: { id: userId } },
        relations: ['materia', 'comision', 'comision.horarios'],
      });

      clases.forEach(inscripcion => {
        if (inscripcion.comision?.horarios) {
          inscripcion.comision.horarios.forEach(horario => {
            eventos.push({
              titulo: `Clase - ${inscripcion.materia.nombre}`,
              fecha: horario.dia,
              hora: horario.horaInicio,
              descripcion: `Aula ${horario.aula}`,
            });
          });
        }
      });

      // Obtener exámenes finales próximos (próximos 30 días)
      const examenesFinales = await this.examenFinalRepository.find({
        where: {
          fecha: MoreThanOrEqual(fechaDesde),
        },
        relations: ['materia', 'inscripcionesExamenFinal'],
        order: { fecha: 'ASC' },
      });

      examenesFinales.forEach(examenFinal => {
        eventos.push({
          titulo: `Examen Final - ${examenFinal.materia.nombre}`,
          fecha: examenFinal.fecha.toString(),
          hora: examenFinal.horaInicioTeorico,
          descripcion: `Aula ${examenFinal.aulaTeorico}`,
        });
      });

      // Ordenar por fecha y hora más próxima primero
      return eventos
        .sort((a, b) => {
          const fechaA = new Date(`${a.fecha}T${a.hora}`);
          const fechaB = new Date(`${b.fecha}T${b.hora}`);
          return fechaA.getTime() - fechaB.getTime();
        })
        .slice(0, limite);
    } catch (error) {
      console.error('Error al obtener próximos eventos:', error);
      return [];
    }
  }
}
