import { Controller, Get, Post, Body, Param, Put, Delete, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { PlanEstudioService } from './plan-estudio.service';
import { CreatePlanEstudioDto } from './dto/create-plan-estudio.dto';
import { UpdatePlanEstudioDto } from './dto/update-plan-estudio.dto';
import { PlanEstudioResponseDto } from './dto/plan-estudio-response.dto';
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto';

@ApiTags('Planes de Estudio')
@Controller('plan-estudio')
@UsePipes(new ValidationPipe({ whitelist: true }))
export class PlanEstudioController {
  constructor(private readonly planEstudioService: PlanEstudioService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un plan de estudio' })
  @ApiBody({ type: CreatePlanEstudioDto })
  @ApiResponse({ status: 201, description: 'Plan de estudio creado', type: PlanEstudioResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ApiErrorResponseDto })
  create(@Body() createPlanEstudioDto: CreatePlanEstudioDto) {
    return this.planEstudioService.create(createPlanEstudioDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los planes de estudio' })
  @ApiResponse({ status: 200, description: 'Lista de planes de estudio', type: [PlanEstudioResponseDto] })
  findAll() {
    return this.planEstudioService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un plan de estudio por ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Plan de estudio encontrado', type: PlanEstudioResponseDto })
  @ApiResponse({ status: 404, description: 'Plan de estudio no encontrado', type: ApiErrorResponseDto })
  findOne(@Param('id') id: string) {
    return this.planEstudioService.findOne(+id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un plan de estudio' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdatePlanEstudioDto })
  @ApiResponse({ status: 200, description: 'Plan de estudio actualizado', type: PlanEstudioResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ApiErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Plan de estudio no encontrado', type: ApiErrorResponseDto })
  update(@Param('id') id: string, @Body() updatePlanEstudioDto: UpdatePlanEstudioDto) {
    return this.planEstudioService.update(+id, updatePlanEstudioDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un plan de estudio' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Plan de estudio eliminado' })
  @ApiResponse({ status: 404, description: 'Plan de estudio no encontrado', type: ApiErrorResponseDto })
  remove(@Param('id') id: string) {
    return this.planEstudioService.remove(+id);
  }
}