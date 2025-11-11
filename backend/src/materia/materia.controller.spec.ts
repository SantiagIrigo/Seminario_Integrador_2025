// src/materia/materia.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MateriaController } from './materia.controller';
import { MateriaService } from './materia.service';
import { CreateMateriaDto } from './dto/create-materia.dto';
import { UpdateMateriaDto } from './dto/update-materia.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRole } from '../user/entities/user.entity';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

// Mock para el guard de autenticación
const mockJwtAuthGuard = {
  canActivate: (context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest();
    req.user = { userId: 1, role: UserRole.ESTUDIANTE };
    return true;
  },
};

describe('MateriaController', () => {
  let controller: MateriaController;
  let mockMateriaService: jest.Mocked<MateriaService>;

  // Mock Carrera with required properties
  const mockCarrera: any = {
    id: 1,
    nombre: 'Ingeniería en Sistemas',
    descripcion: 'Carrera de Ingeniería en Sistemas',
    planesEstudio: [],
    departamentos: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Mock PlanEstudio with required properties
  const mockPlanEstudio: any = {
    id: 1,
    nombre: 'Plan 2023',
    descripcion: 'Plan de estudios 2023',
    año: 2023,
    carrera: mockCarrera,
    materias: [],
    estudiantes: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Update carrera's planesEstudio to include the mock plan
  mockCarrera.planesEstudio = [mockPlanEstudio];

  // Mock Departamento with required properties
  const mockDepartamento: any = {
    id: 1,
    nombre: 'Básicas',
    descripcion: 'Departamento de materias básicas',
    materias: [],
    carreras: [mockCarrera],
    jefes: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Update carrera's departamentos to include the mock departamento
  mockCarrera.departamentos = [mockDepartamento];

  // Main mock Materia with all required properties
  const mockMateria: any = {
    id: 1,
    nombre: 'Matemática',
    descripcion: 'Materia de matemáticas básicas',
    planEstudioId: 1,
    departamentoId: 1,
    planEstudio: mockPlanEstudio,
    departamento: mockDepartamento,
    // Required relations
    inscripciones: [],
    profesores: [],
    jefeCatedra: null,
    correlativasCursada: [],
    correlativasFinal: [],
    evaluaciones: [],
    horarios: [],
    clases: [],
    examenes: [],
    comisiones: [],
    // Timestamps
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MateriaController],
      providers: [
        {
          provide: MateriaService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            findWithFilters: jest.fn(),
            usuarioTieneAccesoAlPlan: jest.fn(),
            getMateriasPorPlan: jest.fn(),
          },
        },
      ],
    })
    .overrideGuard(JwtAuthGuard)
    .useValue(mockJwtAuthGuard)
    .compile();

    controller = module.get<MateriaController>(MateriaController);
    mockMateriaService = module.get(MateriaService) as jest.Mocked<MateriaService>;

    const paginatedResponse = {
      data: [mockMateria],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    };

    mockMateriaService.create.mockResolvedValue(mockMateria);
    mockMateriaService.findAll.mockResolvedValue(paginatedResponse);
    mockMateriaService.findOne.mockResolvedValue(mockMateria);
    mockMateriaService.update.mockResolvedValue(mockMateria);
    mockMateriaService.remove.mockResolvedValue(mockMateria);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('debería crear una materia exitosamente', async () => {
      // Arrange
      const createMateriaDto: CreateMateriaDto = {
        nombre: 'Matemática',
        descripcion: 'Materia de matemáticas básicas',
        departamentoId: 1,
        planesEstudioConNivel: [{ planEstudioId: 1, nivel: 1 }],
      };

      // Act
      const result = await controller.create(createMateriaDto);

      // Assert
      expect(result).toEqual(mockMateria);
      expect(mockMateriaService.create).toHaveBeenCalledWith(createMateriaDto);
    });

    it('debería lanzar error si faltan campos requeridos', async () => {
      // Arrange
      const createMateriaDto = {
        // Missing required fields
      } as CreateMateriaDto;

      // Mock the service to throw BadRequestException when required fields are missing
      (mockMateriaService.create as jest.Mock).mockRejectedValue(new BadRequestException('Faltan campos requeridos'));

      // Act & Assert
      await expect(controller.create(createMateriaDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('debería retornar todas las materias', async () => {
      // Act
      const result = await controller.findAll();

      // Assert
      expect(result).toEqual({
        data: [mockMateria],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
      expect(mockMateriaService.findAll).toHaveBeenCalledWith(1, 10);
    });

    it('debería aplicar paginación cuando se pasan page y limit', async () => {
      await controller.findAll('2' as any, '5' as any);
      expect(mockMateriaService.findAll).toHaveBeenLastCalledWith(2, 5);
    });

    it('debería manejar errores al buscar materias', async () => {
      // Arrange
      mockMateriaService.findAll.mockRejectedValueOnce(new Error('Error de base de datos'));

      // Act & Assert
      await expect(controller.findAll()).rejects.toThrow('Error de base de datos');
    });
  });

  describe('search', () => {
    it('should forward filters and pagination to service', async () => {
      const paginated = { data: [], total: 0, page: 2, limit: 5, totalPages: 0 };
      (mockMateriaService.findWithFilters as jest.Mock).mockResolvedValue(paginated);
      const res = await controller.search('alg', '1' as any, '2' as any, '3' as any, '4' as any, '2' as any, '5' as any);
      expect(res).toEqual(paginated);
      expect(mockMateriaService.findWithFilters).toHaveBeenCalledWith(
        { nombre: 'alg', departamentoId: 1, carreraId: 2, planEstudioId: 3, nivel: 4 }, 2, 5
      );
    });

    it('should use defaults when no filters or pagination provided', async () => {
      const paginated = { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
      (mockMateriaService.findWithFilters as jest.Mock).mockResolvedValue(paginated);
      const res = await controller.search(undefined, undefined, undefined, undefined, undefined, undefined, undefined);
      expect(res).toEqual(paginated);
      expect(mockMateriaService.findWithFilters).toHaveBeenCalledWith(
        { nombre: undefined, departamentoId: undefined, carreraId: undefined, planEstudioId: undefined, nivel: undefined }, 1, 10
      );
    });
  });

  describe('getMateriasPorPlan', () => {
    it('should throw BadRequestException for invalid id', async () => {
      await expect(controller.getMateriasPorPlan('x', { user: { id: 1 } } as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException if no user', async () => {
      await expect(controller.getMateriasPorPlan('1', { user: null } as any)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException when no access', async () => {
      (mockMateriaService.usuarioTieneAccesoAlPlan as jest.Mock).mockResolvedValue(false);
      await expect(controller.getMateriasPorPlan('1', { user: { id: 9 } } as any)).rejects.toThrow('No tienes permiso para acceder a este plan de estudios');
    });

    it('should return materias when access granted', async () => {
      (mockMateriaService.usuarioTieneAccesoAlPlan as jest.Mock).mockResolvedValue(true);
      (mockMateriaService.getMateriasPorPlan as jest.Mock).mockResolvedValue([mockMateria]);
      const res = await controller.getMateriasPorPlan('2', { user: { id: 9 } } as any);
      expect(res).toEqual([mockMateria]);
      expect(mockMateriaService.getMateriasPorPlan).toHaveBeenCalledWith(2);
    });
  });

  describe('findOne', () => {
    it('should return a materia by id', async () => {
      // Arrange
      const expectedResult = {
        id: 1,
        nombre: 'Matemática',
        descripcion: 'Materia de matemáticas básicas',
        planEstudioId: 1,
        departamentoId: 1
      };

      (mockMateriaService.findOne as jest.Mock).mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findOne('1');

      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockMateriaService.findOne).toHaveBeenCalledWith(1);
    });

    it('should throw BadRequestException when id is invalid', () => {
      expect(() => controller.findOne('abc' as any)).toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should update a materia', async () => {
      // Arrange
      const id = '1';
      const updateMateriaDto: UpdateMateriaDto = {
        nombre: 'Matemática Avanzada',
        departamentoId: 1,
        planesEstudioConNivel: [{ planEstudioId: 1, nivel: 2 }],
      };

      (mockMateriaService.update as jest.Mock).mockResolvedValue(mockMateria);

      // Act
      const result = await controller.update(id, updateMateriaDto);

      // Assert
      expect(result).toEqual(mockMateria);
      expect(mockMateriaService.update).toHaveBeenCalledWith(1, updateMateriaDto);
    });

    it('should throw BadRequestException when id is invalid', () => {
      expect(() => controller.update('NaN' as any, {} as any)).toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should remove a materia', async () => {
      // Arrange
      (mockMateriaService.remove as jest.Mock).mockResolvedValue(mockMateria);

      // Act
      const result = await controller.remove('1');

      // Assert
      expect(result).toEqual(mockMateria);
      expect(mockMateriaService.remove).toHaveBeenCalledWith(1);
    });

    it('should throw BadRequestException when id is invalid', () => {
      expect(() => controller.remove('bad' as any)).toThrow(BadRequestException);
    });
  });
});