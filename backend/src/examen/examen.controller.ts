// src/examen/examen.controller.ts
import { Controller, Post, Get, Body, UseGuards, Request, Param, BadRequestException } from '@nestjs/common';
import { ExamenService } from './examen.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { JefeDeCatedraGuard } from '../auth/jefe-catedra.guard';
import { UserRole } from '../user/entities/user.entity'; // ✅

// DTOs
class CargarNotaDto {
  nota: number;
  estado: string;
}

@Controller('examen')
export class ExamenController {
  constructor(private examenService: ExamenService) {}

  // 🔒 Estudiante: inscribirse a examen final
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ESTUDIANTE)
  @Post('inscribirse/:materiaId')
  async inscribirse(@Request() req: any, @Param('materiaId') materiaId: string) {
    const userId = req.user.userId;
    const materiaIdNum = parseInt(materiaId, 10);
    if (isNaN(materiaIdNum)) {
      throw new BadRequestException('ID de materia inválido');
    }
    return this.examenService.inscribirse(userId, materiaIdNum);
  }

  // 🔒 Solo jefe de cátedra: cargar nota
  @UseGuards(JwtAuthGuard, JefeDeCatedraGuard)
  @Post('nota/:examenId')
  async cargarNota(@Param('examenId') examenId: string, @Body() body: CargarNotaDto) {
    const examenIdNum = parseInt(examenId, 10);
    if (isNaN(examenIdNum)) {
      throw new BadRequestException('ID de examen inválido');
    }
    return this.examenService.cargarNota(examenIdNum, body.nota, body.estado);
  }

  // 🔒 Estudiante: ver exámenes
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ESTUDIANTE)
  @Get('mis-examenes')
  async misExamenes(@Request() req: any) {
    const userId = req.user.userId;
    return this.examenService.verExamenes(userId);
  }
}