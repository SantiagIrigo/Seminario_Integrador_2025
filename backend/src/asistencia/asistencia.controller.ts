import { Controller, Post, Get, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AsistenciaService, ResumenAsistencias } from './asistencia.service';
import { EstadoAsistencia } from './entities/asistencia.entity';
import { UserRole } from '../user/entities/user.entity';

class RegistrarAsistenciaDto {
  estado: EstadoAsistencia;
  motivoJustificacion?: string;
}

@Controller('asistencia')
export class AsistenciaController {
  constructor(private asistenciaService: AsistenciaService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA_ACADEMICA, UserRole.PROFESOR)
  @Post('clase/:claseId/estudiante/:estudianteId')
  async registrarAsistencia(
    @Param('claseId') claseId: string,
    @Param('estudianteId') estudianteId: string,
    @Body() dto: RegistrarAsistenciaDto,
    @Request() req,
  ) {
    return this.asistenciaService.registrarAsistencia(
      +claseId,
      +estudianteId,
      dto.estado,
      dto.motivoJustificacion,
      req.user.id,
      req.user.rol,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA_ACADEMICA)
  @Get('clase/:claseId')
  async obtenerAsistenciasPorClase(@Param('claseId') claseId: string) {
    return this.asistenciaService.obtenerAsistenciasPorClase(+claseId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('mis-asistencias')
  async obtenerAsistenciasPorEstudiante(@Request() req) {
    return this.asistenciaService.obtenerAsistenciasPorEstudiante(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('resumen')
  async obtenerResumenAsistencias(
    @Request() req,
    @Query('materiaId') materiaId?: string,
  ): Promise<ResumenAsistencias> {
    return this.asistenciaService.obtenerResumenAsistencias(
      req.user.id,
      materiaId ? +materiaId : undefined,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('materia/:materiaId')
  async obtenerAsistenciasPorMateria(
    @Request() req,
    @Param('materiaId') materiaId: string,
  ): Promise<ResumenAsistencias> {
    return this.asistenciaService.obtenerResumenAsistencias(
      req.user.id,
      +materiaId,
    );
  }
}