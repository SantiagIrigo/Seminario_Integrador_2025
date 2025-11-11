import { Controller, Get, Req } from '@nestjs/common';
import { EstadisticasService } from './estadisticas.service';

@Controller('estadisticas')
export class EstadisticasController {
  constructor(private readonly estadisticasService: EstadisticasService) {}

  @Get('estudiante')
  async obtenerEstadisticasEstudiante(@Req() req: any) {
    const userId = req.user?.id;

    // Si no hay usuario autenticado, devolver datos por defecto
    if (!userId) {
      return {
        totalMaterias: 0,
        materiasInscriptas: 0,
        asistenciaPromedio: 0,
        proximosExamenes: 0,
        proximosClases: 0,
      };
    }

    return this.estadisticasService.obtenerEstadisticasEstudiante(userId);
  }

  @Get('estudiante/actividad-reciente')
  async obtenerActividadReciente(@Req() req: any): Promise<any[]> {
    const userId = req.user?.id;

    // Si no hay usuario autenticado, devolver array vacío
    if (!userId) {
      return [];
    }

    return this.estadisticasService.obtenerActividadReciente(userId);
  }

  @Get('estudiante/proximos-eventos')
  async obtenerProximosEventos(@Req() req: any): Promise<any[]> {
    const userId = req.user?.id;

    // Si no hay usuario autenticado, devolver array vacío
    if (!userId) {
      return [];
    }

    return this.estadisticasService.obtenerProximosEventos(userId);
  }
}
