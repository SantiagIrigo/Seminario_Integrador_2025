import { Controller, Get, Post, Body, Param, Put, Delete, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';

@ApiTags('Usuarios')
@Controller('user')
@UsePipes(new ValidationPipe({ whitelist: true }))
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo usuario' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ApiErrorResponseDto })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los usuarios con paginación' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: 'Usuarios paginados', type: PaginatedResponseDto })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.userService.findAll(page ? +page : 1, limit ? +limit : 10);
  }

  @Get('search')
  @ApiOperation({ summary: 'Buscar usuarios con filtros y paginación' })
  @ApiQuery({ name: 'legajo', required: false, type: String })
  @ApiQuery({ name: 'nombre', required: false, type: String })
  @ApiQuery({ name: 'apellido', required: false, type: String })
  @ApiQuery({ name: 'dni', required: false, type: String })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: 'Usuarios encontrados', type: PaginatedResponseDto })
  search(
    @Query('legajo') legajo?: string,
    @Query('nombre') nombre?: string,
    @Query('apellido') apellido?: string,
    @Query('dni') dni?: string,
    @Query('year') year?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.userService.findWithFilters(
      {
        legajo,
        nombre,
        apellido,
        dni,
        year: year ? parseInt(year as any, 10) : undefined,
      },
      page ? +page : 1,
      limit ? +limit : 10,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un usuario por ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Usuario encontrado', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado', type: ApiErrorResponseDto })
  findOne(@Param('id') id: string) {
    return this.userService.findById(+id);
  }

  @Get('email/:email')
  @ApiOperation({ summary: 'Obtener un usuario por email' })
  @ApiParam({ name: 'email', type: String })
  @ApiResponse({ status: 200, description: 'Usuario encontrado', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado', type: ApiErrorResponseDto })
  findByEmail(@Param('email') email: string) {
    return this.userService.findByEmail(email);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un usuario por ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'Usuario actualizado', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ApiErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado', type: ApiErrorResponseDto })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un usuario por ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Usuario eliminado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado', type: ApiErrorResponseDto })
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
