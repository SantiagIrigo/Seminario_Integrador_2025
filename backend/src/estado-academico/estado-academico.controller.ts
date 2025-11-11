import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { EstadoAcademicoService } from './estado-academico.service';

@Controller('estado-academico')
export class EstadoAcademicoController {
  constructor(private readonly estadoAcademicoService: EstadoAcademicoService) {}

  @Get(':userId')
  async obtenerEstado(@Param('userId') userId: string) {
    return this.estadoAcademicoService.obtenerEstadoAcademico(+userId);
  }

  @Post(':inscripcionId/puede-aprobar-directamente')
  async puedeAprobarDirectamente(@Param('inscripcionId') inscripcionId: string) {
    return this.estadoAcademicoService.puedeAprobarDirectamente(+inscripcionId);
  }

  @Post(':inscripcionId/puede-inscribirse-examen')
  async puedeInscribirseExamen(@Param('inscripcionId') inscripcionId: string) {
    return this.estadoAcademicoService.puedeInscribirseExamenFinal(+inscripcionId);
  }
}