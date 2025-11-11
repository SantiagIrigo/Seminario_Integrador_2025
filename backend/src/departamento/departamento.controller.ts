import { Controller, Get, Post, Body, Param, Put, Delete, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { DepartamentoService } from './departamento.service';
import { CreateDepartamentoDto } from './dto/create-departamento.dto';
import { UpdateDepartamentoDto } from './dto/update-departamento.dto';
import { DepartamentoResponseDto } from './dto/departamento-response.dto';
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto';

@ApiTags('Departamentos')
@Controller('departamento')
@UsePipes(new ValidationPipe({ whitelist: true }))
export class DepartamentoController {
  constructor(private readonly departamentoService: DepartamentoService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un departamento' })
  @ApiBody({ type: CreateDepartamentoDto })
  @ApiResponse({ status: 201, description: 'Departamento creado', type: DepartamentoResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ApiErrorResponseDto })
  create(@Body() createDepartamentoDto: CreateDepartamentoDto) {
    return this.departamentoService.create(createDepartamentoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los departamentos' })
  @ApiResponse({ status: 200, description: 'Lista de departamentos', type: [DepartamentoResponseDto] })
  findAll() {
    return this.departamentoService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un departamento por ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Departamento encontrado', type: DepartamentoResponseDto })
  @ApiResponse({ status: 404, description: 'Departamento no encontrado', type: ApiErrorResponseDto })
  findOne(@Param('id') id: string) {
    return this.departamentoService.findOne(+id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un departamento' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateDepartamentoDto })
  @ApiResponse({ status: 200, description: 'Departamento actualizado', type: DepartamentoResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ApiErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Departamento no encontrado', type: ApiErrorResponseDto })
  update(@Param('id') id: string, @Body() updateDepartamentoDto: UpdateDepartamentoDto) {
    return this.departamentoService.update(+id, updateDepartamentoDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un departamento' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Departamento eliminado' })
  @ApiResponse({ status: 404, description: 'Departamento no encontrado', type: ApiErrorResponseDto })
  remove(@Param('id') id: string) {
    return this.departamentoService.remove(+id);
  }
}