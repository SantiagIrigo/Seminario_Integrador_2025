import { Controller, Get, Post, Body, Param, Put, Delete, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { CarreraService } from './carrera.service';
import { CreateCarreraDto } from './dto/create-carrera.dto';
import { UpdateCarreraDto } from './dto/update-carrera.dto';
import { CarreraResponseDto } from './dto/carrera-response.dto';
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto';

@ApiTags('Carreras')
@Controller('carrera')
@UsePipes(new ValidationPipe({ whitelist: true }))
export class CarreraController {
  constructor(private readonly carreraService: CarreraService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una carrera' })
  @ApiBody({ type: CreateCarreraDto })
  @ApiResponse({ status: 201, description: 'Carrera creada', type: CarreraResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ApiErrorResponseDto })
  create(@Body() createCarreraDto: CreateCarreraDto) {
    return this.carreraService.create(createCarreraDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las carreras' })
  @ApiResponse({ status: 200, description: 'Lista de carreras', type: [CarreraResponseDto] })
  findAll() {
    return this.carreraService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una carrera por ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Carrera encontrada', type: CarreraResponseDto })
  @ApiResponse({ status: 404, description: 'Carrera no encontrada', type: ApiErrorResponseDto })
  findOne(@Param('id') id: string) {
    return this.carreraService.findOne(+id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar una carrera' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateCarreraDto })
  @ApiResponse({ status: 200, description: 'Carrera actualizada', type: CarreraResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ApiErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Carrera no encontrada', type: ApiErrorResponseDto })
  update(@Param('id') id: string, @Body() updateCarreraDto: UpdateCarreraDto) {
    return this.carreraService.update(+id, updateCarreraDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una carrera' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Carrera eliminada' })
  @ApiResponse({ status: 404, description: 'Carrera no encontrada', type: ApiErrorResponseDto })
  remove(@Param('id') id: string) {
    return this.carreraService.remove(+id);
  }
}