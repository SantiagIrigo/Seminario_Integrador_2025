import { Controller, Get, Post, Body, Param, Put, Delete, Query, UsePipes, ValidationPipe, BadRequestException, UseGuards, Req, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { MateriaService } from './materia.service';
import { CreateMateriaDto } from './dto/create-materia.dto';
import { UpdateMateriaDto } from './dto/update-materia.dto';
import { MateriaResponseDto } from './dto/materia-response.dto';
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Materias')
@Controller('materia')
@UsePipes(new ValidationPipe({ whitelist: true }))
// Controlador para operaciones relacionadas con materias
export class MateriaController {
  constructor(private readonly materiaService: MateriaService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una materia' })
  @ApiBody({ type: CreateMateriaDto })
  @ApiResponse({ status: 201, description: 'Materia creada', type: MateriaResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ApiErrorResponseDto })
  create(@Body() createMateriaDto: CreateMateriaDto) {
    return this.materiaService.create(createMateriaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las materias con paginación' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: 'Materias paginadas', type: PaginatedResponseDto })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.materiaService.findAll(page ? +page : 1, limit ? +limit : 10);
  }

  @Get('search')
  @ApiOperation({ summary: 'Buscar materias con filtros y paginación' })
  @ApiQuery({ name: 'nombre', required: false, type: String })
  @ApiQuery({ name: 'departamentoId', required: false, type: Number })
  @ApiQuery({ name: 'carreraId', required: false, type: Number })
  @ApiQuery({ name: 'planEstudioId', required: false, type: Number })
  @ApiQuery({ name: 'nivel', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: 'Materias filtradas', type: PaginatedResponseDto })
  search(
    @Query('nombre') nombre?: string,
    @Query('departamentoId') departamentoId?: number,
    @Query('carreraId') carreraId?: number,
    @Query('planEstudioId') planEstudioId?: number,
    @Query('nivel') nivel?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.materiaService.findWithFilters(
      {
        nombre,
        departamentoId: departamentoId ? +departamentoId : undefined,
        carreraId: carreraId ? +carreraId : undefined,
        planEstudioId: planEstudioId ? +planEstudioId : undefined,
        nivel: nivel ? +nivel : undefined,
      },
      page ? +page : 1,
      limit ? +limit : 10,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obtener todas las materias de un plan de estudio' })
  @ApiParam({ name: 'planEstudioId', type: Number })
  @ApiResponse({ status: 200, description: 'Materias del plan', type: [MateriaResponseDto] })
  @ApiResponse({ status: 400, description: 'ID de plan inválido', type: ApiErrorResponseDto })
  @ApiResponse({ status: 403, description: 'No autorizado para acceder a este plan', type: ApiErrorResponseDto })
  @Get('del-plan/:planEstudioId')
  async getMateriasPorPlan(
    @Param('planEstudioId') planEstudioId: string,
    @Req() req: any
  ) {
    const parsedId = parseInt(planEstudioId, 10);
    if (isNaN(parsedId)) {
      throw new BadRequestException('ID de plan de estudio inválido');
    }

    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    const tieneAcceso = await this.materiaService.usuarioTieneAccesoAlPlan(userId, parsedId);
    if (!tieneAcceso) {
      throw new ForbiddenException('No tienes permiso para acceder a este plan de estudios');
    }

    return this.materiaService.getMateriasPorPlan(parsedId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una materia por ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Materia encontrada', type: MateriaResponseDto })
  @ApiResponse({ status: 400, description: 'ID inválido', type: ApiErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Materia no encontrada', type: ApiErrorResponseDto })
  findOne(@Param('id') id: string) {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      throw new BadRequestException('ID de materia inválido');
    }
    return this.materiaService.findOne(parsedId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar una materia' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateMateriaDto })
  @ApiResponse({ status: 200, description: 'Materia actualizada', type: MateriaResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ApiErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Materia no encontrada', type: ApiErrorResponseDto })
  update(@Param('id') id: string, @Body() updateMateriaDto: UpdateMateriaDto) {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      throw new BadRequestException('ID de materia inválido');
    }
    return this.materiaService.update(parsedId, updateMateriaDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una materia' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Materia eliminada', type: MateriaResponseDto })
  @ApiResponse({ status: 400, description: 'ID inválido', type: ApiErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Materia no encontrada', type: ApiErrorResponseDto })
  remove(@Param('id') id: string) {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      throw new BadRequestException('ID de materia inválido');
    }
    return this.materiaService.remove(parsedId);
  }
}