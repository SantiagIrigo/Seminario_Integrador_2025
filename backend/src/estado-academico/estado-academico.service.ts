import { Injectable } from '@nestjs/common';
import { InscripcionService } from '../inscripcion/inscripcion.service';
import { Inscripcion } from '../inscripcion/entities/inscripcion.entity';
import { CorrelativasService } from '../correlativas/correlativas.service';

@Injectable()
export class EstadoAcademicoService {
  constructor(
    private inscripcionService: InscripcionService,
    private correlativasService: CorrelativasService,
  ) {}

  async obtenerEstadoAcademico(userId: number) {
    const materiasCursando = await this.inscripcionService.materiasDelEstudiante(userId);
    const historial = await this.inscripcionService.historialAcademico(userId);
    
    return {
      materiasCursando: materiasCursando.map((inscripcion: any) => ({
        materia: inscripcion.materia,
        faltas: inscripcion.faltas,
        notaFinal: inscripcion.notaFinal,
        stc: inscripcion.stc,
        evaluaciones: []
      })),
      historial: historial.map((inscripcion: any) => ({
        materia: inscripcion.materia,
        notaFinal: inscripcion.notaFinal,
        stc: inscripcion.stc,
        fechaInscripcion: inscripcion.fechaInscripcion,
        fechaFinalizacion: inscripcion.fechaFinalizacion
      }))
    };
  }

  async puedeAprobarDirectamente(inscripcionId: number): Promise<boolean> {
    try {
      const inscripcion = await this.inscripcionService.findInscripcionCompleta(inscripcionId);
      
      if (!inscripcion) return false;
      
      const promedioEvaluaciones = this.calcularPromedioEvaluaciones(inscripcion.evaluaciones);
      const asistencia = this.calcularAsistencia(inscripcion.faltas);
      
      const cumplePromedio = promedioEvaluaciones >= 9;
      const cumpleAsistencia = asistencia >= 80;
      const cumpleNotasParciales = inscripcion.evaluaciones.every((evaluacion: any) => evaluacion.nota >= 6);
      
      return cumplePromedio && cumpleAsistencia && cumpleNotasParciales;
    } catch (error) {
      return false;
    }
  }

  private calcularPromedioEvaluaciones(evaluaciones: any[]): number {
    if (!evaluaciones || evaluaciones.length === 0) return 0;
    const total = evaluaciones.reduce((sum: number, evaluacion: any) => sum + (evaluacion.nota || 0), 0);
    return total / evaluaciones.length;
  }

  private calcularAsistencia(faltas: number): number {
    const maxFaltas = 20;
    return Math.max(0, 100 - (faltas / maxFaltas) * 100);
  }

  async puedeInscribirseExamenFinal(inscripcionId: number): Promise<boolean> {
    try {
      const inscripcion = await this.inscripcionService.findInscripcionCompleta(inscripcionId);
      if (!inscripcion) return false;
      return inscripcion.stc === 'cursada' || inscripcion.stc === 'aprobada';
    } catch (error) {
      return false;
    }
  }

  async verificarCorrelativasExamenFinal(inscripcionId: number, estudianteId: number): Promise<boolean> {
    try {
      const inscripcion = await this.inscripcionService.findInscripcionCompleta(inscripcionId);
      if (!inscripcion) return false;
      
      const resultado = await this.correlativasService.verificarCorrelativasFinales(
        estudianteId,
        inscripcion.materia.id
      );
      
      return resultado.cumple;
    } catch (error) {
      return false;
    }
  }
}