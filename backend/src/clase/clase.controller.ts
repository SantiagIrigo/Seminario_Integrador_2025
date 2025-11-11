// src/clase/clase.controller.ts
import { Controller, Post, Get, Put, Body, Param, UseGuards, Request, Query, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ClaseService, EstadoClase } from './clase.service';
import { UserRole } from '../user/entities/user.entity';
import { AsistenciaService } from '../asistencia/asistencia.service';
import { EstadoAsistencia } from '../asistencia/entities/asistencia.entity';

export class RegistrarAsistenciaDto {
  estudianteId: number;
  presente: boolean;
  justificacion?: string;
}

@Controller('clase')
export class ClaseController {
  constructor(
    private readonly claseService: ClaseService,
    private readonly asistenciaService: AsistenciaService,
  ) {}

  // Agregar el método obtenerClasePorId que falta
  @Get(':id')
  async obtenerClase(@Param('id') id: string) {
    return this.claseService.obtenerClasePorId(+id);
  }

  // 🔒 Secretaría académica: crear clase
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA_ACADEMICA)
  @Post()
  async crearClase(@Body() dto: any) {
    return this.claseService.crearClase(
      dto.materiaId,
      dto.fecha,
      dto.horarioId,
      dto.comisionId,
      dto.estado,
      dto.motivoCancelacion,
    );
  }

  // 🔒 Todos: ver clases de una materia
  @Get('materia/:materiaId')
  async obtenerClasesPorMateria(@Param('materiaId') materiaId: string) {
    return this.claseService.obtenerClasesPorMateria(+materiaId);
  }

  // 🔒 Estudiantes: ver sus clases
  @UseGuards(JwtAuthGuard)
  @Get('mis-clases')
  async obtenerClasesPorEstudiante(@Request() req) {
    return this.claseService.obtenerClasesPorEstudiante(req.user.id);
  }

  // 🔒 Secretaría académica: actualizar clase
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA_ACADEMICA)
  @Put(':id')
  async actualizarClase(
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    // Esta solución siempre funciona
    return this.claseService.actualizarClase(
      +id,
      dto.fecha,
      dto.estado, // No convertir, dejar que el servicio maneje el tipo
      dto.motivoCancelacion,
    );
  }

  // 🔒 Secretaría académica: cancelar clase
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA_ACADEMICA)
  @Post(':id/cancelar')
  async cancelarClase(
    @Param('id') id: string,
    @Body('motivo') motivo: string,
  ) {
    return this.claseService.cancelarClase(+id, motivo);
  }

  // 🔒 Secretaría académica: obtener clases pendientes de asistencia
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA_ACADEMICA)
  @Get('admin/pendientes-asistencia')
  async obtenerClasesPendientesAsistencia() {
    return this.claseService.obtenerClasesPendientesAsistencia();
  }

  // 🔒 Secretaría académica: obtener asistencia de una clase
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA_ACADEMICA)
  @Get('admin/:id/asistencia')
  async obtenerAsistenciaClase(@Param('id') id: string) {
    const asistencias = await this.asistenciaService.obtenerAsistenciasPorClase(+id);
    const clase = await this.claseService.obtenerClasePorId(+id);
    
    return {
      clase,
      asistencias,
    };
  }

  // 🔒 Secretaría académica: guardar asistencia de una clase
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA_ACADEMICA)
  @Post('admin/:id/asistencia')
  async guardarAsistenciaClase(
    @Param('id') id: string,
    @Body() dto: { asistencias: Array<{ inscripcionId: number; presente: boolean; justificacion?: string }> },
  ) {
    const clase = await this.claseService.obtenerClasePorId(+id);
    
    if (!clase) {
      throw new NotFoundException('Clase no encontrada');
    }

    // Actualizar cada asistencia
    const resultados = await Promise.all(
      dto.asistencias.map(async (asistencia) => {
        const estado = asistencia.presente 
          ? EstadoAsistencia.PRESENTE 
          : asistencia.justificacion 
            ? EstadoAsistencia.JUSTIFICADA 
            : EstadoAsistencia.AUSENTE;
            
        return this.asistenciaService.registrarAsistencia(
          +id,
          asistencia.inscripcionId,
          estado,
          asistencia.justificacion,
        );
      })
    );

    // Actualizar el estado de la clase a REALIZADA si no lo está
    if (clase.estado !== EstadoClase.REALIZADA) {
      await this.claseService.actualizarClase(+id, undefined, EstadoClase.REALIZADA);
    }

    return {
      success: true,
      message: 'Asistencia guardada correctamente',
      data: resultados,
    };
  }
}