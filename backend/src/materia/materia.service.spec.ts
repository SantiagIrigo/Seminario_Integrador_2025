// src/materia/materia.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MateriaService } from './materia.service';
import { Materia } from './entities/materia.entity';
import { PlanEstudio } from '../plan-estudio/entities/plan-estudio.entity';
import { User } from '../user/entities/user.entity';
import { Departamento } from '../departamento/entities/departamento.entity';
import { NotFoundException } from '@nestjs/common';
import { MateriaPlanEstudio } from './entities/materia-plan-estudio.entity';
import { Carrera } from '../carrera/entities/carrera.entity';

// Mock para getRepository
jest.mock('typeorm', () => ({
  ...jest.requireActual('typeorm'),
  getRepository: jest.fn(),
}));

describe('MateriaService', () => {
  let service: MateriaService;
  let mockMateriaRepo: any;
  let mockDepartamentoRepo: any;
  let mockUserRepo: any;
  let mockMateriaPlanRepo: any;
  let mockPlanEstudioRepo: any;
  let materiaQueryBuilder: any;

  const createCarrera = (id: number, nombre: string): Carrera => ({
    id,
    nombre,
    descripcion: `${nombre} desc`,
    planesEstudio: [],
    departamentos: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as Carrera);

  const createDepartamento = (id: number, nombre: string, carrera?: Carrera): Departamento => ({
    id,
    nombre,
    descripcion: `${nombre} desc`,
    carrera,
    materias: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as Departamento);

  const baseCarrera = createCarrera(1, 'Sistemas');
  const mockDepartamentoBasicas = createDepartamento(1, 'Básicas');
  const mockDepartamentoCarrera = createDepartamento(2, 'Sistemas', baseCarrera);
  baseCarrera.departamentos = [mockDepartamentoCarrera];

  const createPlanEstudio = (id: number, carrera: Carrera): PlanEstudio => ({
    id,
    nombre: 'Plan 2023',
    descripcion: 'Plan desc',
    año: 2023,
    carrera,
    relacionesConMaterias: [],
    estudiantes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as PlanEstudio);

  const mockPlanEstudio = createPlanEstudio(1, baseCarrera);

  const mockEstudiante = {
    id: 1,
    nombre: 'Estudiante',
    apellido: 'Prueba',
    planEstudio: {
      ...mockPlanEstudio,
      carrera: { ...baseCarrera, departamentos: [mockDepartamentoCarrera] },
    },
  } as Partial<User> as User;

  const createMateriaPlanEstudio = (plan: PlanEstudio, nivel = 1): MateriaPlanEstudio => ({
    id: 1,
    materiaId: 1,
    planEstudioId: plan.id,
    nivel,
    materia: {} as Materia,
    planEstudio: plan,
  } as MateriaPlanEstudio);

  const createMateriaEntity = (overrides: Partial<Materia> = {}): Materia => {
    const departamento = overrides.departamento ?? mockDepartamentoBasicas;
    const materiaBase: Partial<Materia> = {
      id: overrides.id ?? 1,
      nombre: overrides.nombre ?? 'Matemática',
      descripcion: overrides.descripcion ?? 'Materia de matemáticas básicas',
      departamento,
      relacionesConPlanes: undefined,
      inscripciones: overrides.inscripciones ?? [],
      profesores: overrides.profesores ?? [],
      jefeCatedra: overrides.jefeCatedra ?? undefined,
      correlativasCursada: overrides.correlativasCursada ?? [],
      correlativasFinal: overrides.correlativasFinal ?? [],
      evaluaciones: overrides.evaluaciones ?? [],
      horarios: overrides.horarios ?? [],
      clases: overrides.clases ?? [],
      examenes: overrides.examenes ?? [],
      examenesFinales: overrides.examenesFinales ?? [],
      comisiones: overrides.comisiones ?? [],
      ...overrides,
    };

    const materia = materiaBase as Materia;
    const relaciones = (overrides.relacionesConPlanes ?? [createMateriaPlanEstudio(mockPlanEstudio)]).map((rel) => ({
      ...rel,
      materia,
    })) as MateriaPlanEstudio[];
    materia.relacionesConPlanes = relaciones;

    return materia;
  };

  const expectedPlanResponse = {
    planEstudioId: 1,
    planEstudioNombre: 'Plan 2023',
    nivel: 1,
    carrera: { id: 1, nombre: 'Sistemas' },
  };

  const createQueryBuilderMock = () => {
    return {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
      getMany: jest.fn(),
      getCount: jest.fn(),
    };
  };

  beforeEach(async () => {
    mockMateriaRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    mockDepartamentoRepo = {
      findOne: jest.fn(),
    };

    mockUserRepo = {
      findOne: jest.fn(),
    };

    mockPlanEstudioRepo = {
      findOne: jest.fn(),
    };

    mockMateriaPlanRepo = {
      create: jest.fn().mockImplementation((data) => data),
      save: jest.fn(),
      delete: jest.fn(),
    };

    materiaQueryBuilder = createQueryBuilderMock();
    mockMateriaRepo.createQueryBuilder.mockReturnValue(materiaQueryBuilder);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MateriaService,
        {
          provide: getRepositoryToken(Materia),
          useValue: mockMateriaRepo,
        },
        {
          provide: getRepositoryToken(PlanEstudio),
          useValue: mockPlanEstudioRepo,
        },
        {
          provide: getRepositoryToken(Departamento),
          useValue: mockDepartamentoRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: getRepositoryToken(MateriaPlanEstudio),
          useValue: mockMateriaPlanRepo,
        },
      ],
    }).compile();

    service = module.get<MateriaService>(MateriaService);

    mockDepartamentoRepo.findOne.mockImplementation(({ where }) => {
      if (where?.nombre === 'Básicas') {
        return Promise.resolve(mockDepartamentoBasicas);
      }
      return Promise.resolve(mockDepartamentoCarrera);
    });

    mockUserRepo.findOne.mockResolvedValue(mockEstudiante);

    const { getRepository } = require('typeorm');
    (getRepository as jest.Mock).mockReturnValue(mockUserRepo);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Tests específicos para verificar funcionalidad sin conexión real
  describe('create', () => {
    it('should create a materia successfully', async () => {
      const createDto = {
        nombre: 'Matemática',
        descripcion: 'Materia de matemáticas básicas',
        departamentoId: 1,
        planesEstudioConNivel: [{ planEstudioId: 1, nivel: 1 }],
      };

      const materiaEntity = createMateriaEntity({
        nombre: createDto.nombre,
        descripcion: createDto.descripcion,
      });

      mockPlanEstudioRepo.findOne.mockResolvedValue(mockPlanEstudio);
      mockMateriaRepo.create.mockImplementation((data) => createMateriaEntity({ ...data, id: 1 }));
      mockMateriaRepo.save.mockResolvedValue(createMateriaEntity({ id: 1 }));
      mockMateriaPlanRepo.save.mockResolvedValue(undefined);
      materiaQueryBuilder.getOne.mockResolvedValue(materiaEntity);

      const result = await service.create(createDto as any);

      expect(result).toEqual(expect.objectContaining({
        id: 1,
        nombre: 'Matemática',
        descripcion: 'Materia de matemáticas básicas',
        departamento: { id: 1, nombre: 'Básicas' },
        planesEstudio: [expectedPlanResponse],
      }));
      expect(mockMateriaRepo.save).toHaveBeenCalled();
      expect(mockMateriaPlanRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFound when post-save fetch returns null', async () => {
      const createDto = {
        nombre: 'X', descripcion: 'Y', departamentoId: 1, planesEstudioConNivel: []
      } as any;
      mockMateriaRepo.create.mockImplementation((data) => createMateriaEntity({ ...data, id: 99 }));
      mockMateriaRepo.save.mockResolvedValue(createMateriaEntity({ id: 99 }));
      materiaQueryBuilder.getOne.mockResolvedValue(null);
      await expect(service.create(createDto)).rejects.toThrow('Materia con ID 99 no encontrada después de la creación');
    });
  });

  describe('findAll', () => {
    it('should return paginated materias', async () => {
      const materiaEntity = createMateriaEntity();

      mockMateriaRepo.count.mockResolvedValue(1);
      materiaQueryBuilder.getMany.mockResolvedValue([materiaEntity]);

      const result = await service.findAll(1, 10);

      expect(result).toEqual({
        data: [
          expect.objectContaining({
            id: 1,
            nombre: 'Matemática',
            descripcion: 'Materia de matemáticas básicas',
            departamento: { id: 1, nombre: 'Básicas' },
            planesEstudio: [expectedPlanResponse],
          }),
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
      expect(mockMateriaRepo.count).toHaveBeenCalled();
      expect(materiaQueryBuilder.getMany).toHaveBeenCalled();
    });

    it('should clamp limit to [1,100] when out of range', async () => {
      const materiaEntity = createMateriaEntity();
      mockMateriaRepo.count.mockResolvedValue(1);
      materiaQueryBuilder.getMany.mockResolvedValue([materiaEntity]);

      await service.findAll(1, 0); // limit < 1 -> 1
      expect(materiaQueryBuilder.take).toHaveBeenLastCalledWith(1);

      await service.findAll(1, 1000); // limit > 100 -> 100
      expect(materiaQueryBuilder.take).toHaveBeenLastCalledWith(100);
    });
  });

describe('findMateriasDisponibles', () => {
    it('should return materias for student departments and basics', async () => {
      const materiaEntity = createMateriaEntity({
        relacionesConPlanes: [],
      });

      materiaQueryBuilder.getMany.mockResolvedValue([materiaEntity]);

      const result = await service.findMateriasDisponibles(1);

      expect(result).toEqual([
        expect.objectContaining({
          id: 1,
          nombre: 'Matemática',
          descripcion: 'Materia de matemáticas básicas',
          departamento: { id: 1, nombre: 'Básicas' },
          planesEstudio: [],
        })
      ]);
      expect(mockUserRepo.findOne).toHaveBeenCalled();
      expect(mockDepartamentoRepo.findOne).toHaveBeenCalledWith({ where: { nombre: 'Básicas' } });
    });

    it('should throw when student lacks plan', async () => {
      mockUserRepo.findOne.mockResolvedValueOnce({ id: 1 } as any);
      await expect(service.findMateriasDisponibles(1)).rejects.toThrow('Estudiante o carrera no encontrados');
    });

    it('should apply nivel=0 filter (nivel !== undefined)', async () => {
      const materiaEntity = createMateriaEntity();
      const qb = createQueryBuilderMock();
      qb.getCount.mockResolvedValue(1);
      qb.getMany.mockResolvedValue([materiaEntity]);
      mockMateriaRepo.createQueryBuilder.mockReturnValue(qb);
      await service.findWithFilters({ nivel: 0 }, 1, 10);
      expect(qb.andWhere).toHaveBeenCalledWith('relacion.nivel = :nivel', { nivel: 0 });
    });

    it('should handle no filters (no andWhere calls)', async () => {
      const materiaEntity = createMateriaEntity();
      const qb = createQueryBuilderMock();
      qb.getCount.mockResolvedValue(1);
      qb.getMany.mockResolvedValue([materiaEntity]);
      mockMateriaRepo.createQueryBuilder.mockReturnValue(qb);
      await service.findWithFilters({}, 1, 10);
      // andWhere may be called zero times; ensure we still return data
      expect(qb.getMany).toHaveBeenCalled();
    });
  });

  describe('findWithFilters', () => {
    it('should apply all filters and paginate', async () => {
      const materiaEntity = createMateriaEntity();
      const qb = createQueryBuilderMock();
      qb.getCount.mockResolvedValue(1);
      qb.getMany.mockResolvedValue([materiaEntity]);
      mockMateriaRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findWithFilters({ nombre: 'mat', departamentoId: 1, carreraId: 1, planEstudioId: 1, nivel: 1 }, 2, 5);

      expect(qb.andWhere).toHaveBeenCalledWith('materia.nombre ILIKE :nombre', { nombre: '%mat%' });
      expect(qb.andWhere).toHaveBeenCalledWith('departamento.id = :departamentoId', { departamentoId: 1 });
      expect(qb.andWhere).toHaveBeenCalledWith('carrera.id = :carreraId', { carreraId: 1 });
      expect(qb.andWhere).toHaveBeenCalledWith('planEstudio.id = :planEstudioId', { planEstudioId: 1 });
      expect(qb.andWhere).toHaveBeenCalledWith('relacion.nivel = :nivel', { nivel: 1 });
      expect(result.total).toBe(1);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(result.data[0].id).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return materia by id', async () => {
      const materiaEntity = createMateriaEntity();

      materiaQueryBuilder.getOne.mockResolvedValue(materiaEntity);

      const result = await service.findOne(1);

      expect(result).toEqual(expect.objectContaining({
        id: 1,
        nombre: 'Matemática',
        descripcion: 'Materia de matemáticas básicas',
        departamento: { id: 1, nombre: 'Básicas' },
        planesEstudio: [expectedPlanResponse],
      }));
      // No validar propiedades adicionales opcionales para evitar fragilidad
    });

    it('should throw when materia not found', async () => {
      materiaQueryBuilder.getOne.mockResolvedValue(null);
      await expect(service.findOne(1)).rejects.toThrow('Materia con ID 1 no encontrada');
    });
  });

  describe('update', () => {
    it('should update materia data', async () => {
      const existingMateria = createMateriaEntity({ nombre: 'Matemática', descripcion: 'Básica' });

      mockMateriaRepo.findOne.mockResolvedValue(existingMateria);
      mockMateriaRepo.save.mockResolvedValue(createMateriaEntity({ nombre: 'Matemática II' }));
      materiaQueryBuilder.getOne.mockResolvedValue(createMateriaEntity({ nombre: 'Matemática II' }));

      const result = await service.update(1, { nombre: 'Matemática II' } as any);

      expect(result.nombre).toBe('Matemática II');
      expect(mockMateriaRepo.save).toHaveBeenCalled();
    });

    it('should recreate plan relations when planesEstudioConNivel provided', async () => {
      const existingMateria = createMateriaEntity({ nombre: 'Matemática' });
      mockMateriaRepo.findOne.mockResolvedValue(existingMateria);
      mockPlanEstudioRepo.findOne.mockResolvedValue(mockPlanEstudio);
      mockMateriaRepo.save.mockResolvedValue(existingMateria);
      materiaQueryBuilder.getOne.mockResolvedValue(existingMateria);

      const dto = { planesEstudioConNivel: [{ planEstudioId: 1, nivel: 2 }] } as any;
      await service.update(1, dto);

      expect(mockMateriaPlanRepo.delete).toHaveBeenCalledWith({ materiaId: 1 });
      expect(mockMateriaPlanRepo.save).toHaveBeenCalledWith(expect.objectContaining({ materiaId: 1, planEstudioId: 1, nivel: 2 }));
    });

    it('should throw when materia not found', async () => {
      mockMateriaRepo.findOne.mockResolvedValue(null);
      await expect(service.update(1, { nombre: 'X' } as any)).rejects.toThrow('Materia con ID 1 no encontrada');
    });
  });

  describe('getMateriasPorPlan', () => {
    it('should return materias for a plan', async () => {
      const materiaEntity = createMateriaEntity();
      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([materiaEntity]),
      } as any;
      mockMateriaRepo.createQueryBuilder.mockReturnValue(qb);
      const result = await (service as any).getMateriasPorPlan(1);
      expect(result[0].id).toBe(1);
      expect(qb.where).toHaveBeenCalledWith('planEstudio.id = :planEstudioId', { planEstudioId: 1 });
    });
  });

  describe('findMateriasByPlanEstudio', () => {
    it('should return materias by planEstudioId', async () => {
      const materiaEntity = createMateriaEntity();
      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([materiaEntity]),
      } as any;
      mockMateriaRepo.createQueryBuilder.mockReturnValue(qb);
      const result = await service.findMateriasByPlanEstudio(5);
      expect(result[0].id).toBe(1);
      expect(qb.where).toHaveBeenCalledWith('relacion.planEstudioId = :planEstudioId', { planEstudioId: 5 });
    });
  });

  describe('remove', () => {
    it('should remove materia', async () => {
      const materia = createMateriaEntity({ nombre: 'Matemática', descripcion: 'Básica' });
      mockMateriaRepo.findOne.mockResolvedValue(materia);
      const result = await service.remove(1);
      expect(result).toEqual(expect.objectContaining({
        id: 1,
        nombre: 'Matemática',
        descripcion: 'Básica',
        departamento: { id: 1, nombre: 'Básicas' },
        planesEstudio: [expectedPlanResponse],
      }));
      expect(mockMateriaRepo.delete).toHaveBeenCalledWith(1);
    });

    it('should throw when materia missing', async () => {
      mockMateriaRepo.findOne.mockResolvedValue(null);
      await expect(service.remove(1)).rejects.toThrow('Materia no encontrada');
    });
  });

  describe('usuarioTieneAccesoAlPlan', () => {
    it('should return true when user.planEstudio.id matches', async () => {
      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ id: 9, planEstudio: { id: 3 } }),
      } as any;
      mockUserRepo.createQueryBuilder = jest.fn().mockReturnValue(qb);
      const res = await service.usuarioTieneAccesoAlPlan(9, 3);
      expect(res).toBe(true);
    });

    it('should return false when plan does not match or user missing', async () => {
      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ id: 9, planEstudio: { id: 4 } }),
      } as any;
      mockUserRepo.createQueryBuilder = jest.fn().mockReturnValue(qb);
      const res = await service.usuarioTieneAccesoAlPlan(9, 3);
      expect(res).toBe(false);
    });
  });

  describe('mapToResponseDto correlativas mapping', () => {
    it('should map correlativasCursada and correlativasFinal', () => {
      const corrMat1 = createMateriaEntity({ id: 10, nombre: 'Física I' });
      const corrMat2 = createMateriaEntity({ id: 11, nombre: 'Álgebra' });
      const materia = createMateriaEntity({
        correlativasCursada: [
          { id: 1, correlativa: corrMat1 } as any,
        ],
        correlativasFinal: [
          { id: 2, correlativa: corrMat2 } as any,
        ],
      });
      const dto = (service as any).mapToResponseDto(materia);
      expect(dto.correlativasCursada).toEqual([{ id: 10, nombre: 'Física I' }]);
      expect(dto.correlativasFinal).toEqual([{ id: 11, nombre: 'Álgebra' }]);
    });
  });

  describe('mapToResponseDto planesEstudio default', () => {
    it('should return empty arrays and undefined nivel when relacionesConPlanes missing', () => {
      const materia = createMateriaEntity({ relacionesConPlanes: [] as any, correlativasCursada: undefined as any, correlativasFinal: undefined as any });
      const dto = (service as any).mapToResponseDto(materia);
      expect(dto.nivel).toBeUndefined();
      expect(dto.planesEstudio).toEqual([]);
      expect(dto.correlativasCursada).toEqual([]);
      expect(dto.correlativasFinal).toEqual([]);
    });
  });
});