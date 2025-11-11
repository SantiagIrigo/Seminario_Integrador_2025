// src/correlativas/correlativas.controller.ts
import { Controller, Get, Param, Post, Body, UseGuards, Request } from '@nestjs/common';
import { CorrelativasService } from './correlativas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../user/entities/user.entity';
import { VerificarInscripcionExamenDto, VerificarCorrelativasDto } from './dto/verificar-correlativas.dto';

@Controller('correlativas')
export class CorrelativasController {
  constructor(private readonly correlativasService: CorrelativasService) {}

  // 🔒 Estudiante: verificar correlativas de cursada
  @UseGuards(JwtAuthGuard)
  @Get('verificar-cursada/:materiaId')
  async verificarCorrelativasCursada(
    @Param('materiaId') materiaId: string,
    @Request() req
  ) {
    return this.correlativasService.verificarCorrelativasCursada(req.user.userId, +materiaId);
  }

  // 🔒 Estudiante: verificar correlativas finales
  @UseGuards(JwtAuthGuard)
  @Get('verificar-final/:materiaId')
  async verificarCorrelativasFinales(
    @Param('materiaId') materiaId: string,
    @Request() req
  ) {
    return this.correlativasService.verificarCorrelativasFinales(req.user.userId, +materiaId);
  }

  // 🔒 Estudiante: verificar todas las correlativas
  @UseGuards(JwtAuthGuard)
  @Get('verificar-todas/:materiaId')
  async verificarTodasCorrelativas(
    @Param('materiaId') materiaId: string,
    @Request() req
  ) {
    return this.correlativasService.verificarTodasCorrelativas(req.user.userId, +materiaId);
  }

  // 🔒 Estudiante: verificar inscripción a examen final
  @UseGuards(JwtAuthGuard)
  @Post('verificar-examen-final')
  async verificarInscripcionExamenFinal(
    @Body() dto: VerificarInscripcionExamenDto,
    @Request() req
  ) {
    return this.correlativasService.verificarInscripcionExamenFinal(req.user.userId, dto.inscripcionId);
  }
}