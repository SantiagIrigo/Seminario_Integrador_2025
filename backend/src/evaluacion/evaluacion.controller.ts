// src/evaluacion/evaluacion.controller.ts
import { Controller, Post, Get, Body, UseGuards, Request, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { EvaluacionService } from './evaluacion.service';
import { TipoEvaluacion } from './entities/evaluacion.entity';
import { UserRole } from '../user/entities/user.entity'; // ✅ Para usar en @Roles

// DTOs
class CrearEvaluacionDto {
  materiaId: number;
  estudianteId: number;
  tipo: TipoEvaluacion;
  nota: number;
  titulo?: string;
  observaciones?: string;
}

@Controller('evaluacion')
export class EvaluacionController {
  constructor(private evaluacionService: EvaluacionService) {}

  // 🔒 Jefe de cátedra o profesor: cargar evaluación
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESOR)
  @Post()
  async crear(@Body() dto: CrearEvaluacionDto, @Request() req) {
    const cargadoPorId = req.user.id;
    return this.evaluacionService.crearEvaluacion(
      dto.materiaId,
      dto.estudianteId,
      dto.tipo,
      dto.nota,
      dto.titulo,
      dto.observaciones,
      cargadoPorId,
    );
  }

  // 🔒 Jefe de cátedra: ver todas las evaluaciones de una materia
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESOR)
  @Get('materia/:materiaId')
  async porMateria(@Param('materiaId') materiaId: string) {
    return this.evaluacionService.getEvaluacionesPorMateria(+materiaId);
  }

  // 🔒 Estudiante: ver sus evaluaciones en una materia
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ESTUDIANTE)
  @Get('mi-materia/:materiaId')
  async porEstudianteYMateria(@Param('materiaId') materiaId: string, @Request() req) {
    const estudianteId = req.user.id;
    return this.evaluacionService.getEvaluacionesPorEstudiante(estudianteId, +materiaId);
  }
}