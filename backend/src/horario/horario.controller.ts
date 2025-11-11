// src/horario/horario.controller.ts
import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { HorarioService, HorarioDiario } from './horario.service';
import { DiaSemana } from './entities/horario.entity';
import { UserRole } from '../user/entities/user.entity';

class CrearHorarioDto {
  materiaId: number;
  dia: DiaSemana;
  horaInicio: string;
  horaFin: string;
  aula: string;
}

class ActualizarHorarioDto {
  dia?: DiaSemana;
  horaInicio?: string;
  horaFin?: string;
  aula?: string;
}

@Controller('horario')
export class HorarioController {
  constructor(private horarioService: HorarioService) {}

  // 🔒 Secretaría académica: crear horario
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA_ACADEMICA)
  @Post()
  async crearHorario(@Body() dto: CrearHorarioDto) {
    return this.horarioService.crearHorario(
      dto.materiaId,
      dto.dia,
      dto.horaInicio,
      dto.horaFin,
      dto.aula,
    );
  }

  // 🔒 Todos: ver horarios de una materia
  @Get('materia/:materiaId')
  async obtenerHorariosPorMateria(@Param('materiaId') materiaId: string) {
    return this.horarioService.obtenerHorariosPorMateria(+materiaId);
  }

  // ✅ NUEVO: Obtener horario personal (público para desarrollo)
  @Get('mi-horario')
  async obtenerHorarioPersonal(
    @Request() req,
    @Query('fechaInicio') fechaInicioStr?: string,
    @Query('fechaFin') fechaFinStr?: string,
  ): Promise<HorarioDiario[]> {
    const userId = req.user?.userId;

    // Si no hay usuario autenticado, devolver array vacío
    if (!userId) {
      return [];
    }

    const fechaInicio = fechaInicioStr ? new Date(fechaInicioStr) : new Date();
    const fechaFin = fechaFinStr ? new Date(fechaFinStr) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return this.horarioService.obtenerHorarioPersonal(userId, fechaInicio, fechaFin);
  }

  // 🔒 Secretaría académica: actualizar horario
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA_ACADEMICA)
  @Put(':id')
  async actualizarHorario(
    @Param('id') id: string,
    @Body() dto: ActualizarHorarioDto,
  ) {
    return this.horarioService.actualizarHorario(
      +id,
      dto.dia,
      dto.horaInicio,
      dto.horaFin,
      dto.aula,
    );
  }

  // 🔒 Secretaría académica: eliminar horario
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SECRETARIA_ACADEMICA)
  @Delete(':id')
  async eliminarHorario(@Param('id') id: string) {
    return this.horarioService.eliminarHorario(+id);
  }
}