// src/user/user.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { PlanEstudioService } from '../plan-estudio/plan-estudio.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PlanEstudio } from '../plan-estudio/entities/plan-estudio.entity';
import { UserRole } from './entities/user.entity';

describe('UserService', () => {
  let service: UserService;
  let mockUserRepo: any;
  let mockPlanEstudioService: Partial<PlanEstudioService>;

  const createQueryBuilderMock = () => {
    const qb: any = {};
    qb.leftJoinAndSelect = jest.fn().mockReturnValue(qb);
    qb.where = jest.fn().mockReturnValue(qb);
    qb.andWhere = jest.fn().mockReturnValue(qb);
    qb.select = jest.fn().mockReturnValue(qb);
    qb.orderBy = jest.fn().mockReturnValue(qb);
    qb.skip = jest.fn().mockReturnValue(qb);
    qb.take = jest.fn().mockReturnValue(qb);
    qb.getMany = jest.fn();
    qb.getOne = jest.fn();
    qb.getCount = jest.fn();
    return qb;
  };

  beforeEach(async () => {
    // Crear mocks
    mockUserRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      preload: jest.fn(),
      createQueryBuilder: jest.fn(),
      count: jest.fn(),
    };

    mockPlanEstudioService = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: PlanEstudioService,
          useValue: mockPlanEstudioService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a user without plan de estudio', async () => {
      // Arrange
      const createUserDto: CreateUserDto = {
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan.perez@example.com',
        password: 'password123',
        legajo: '12345',
        dni: '12345678',
        rol: UserRole.ESTUDIANTE,
        planEstudioId: undefined,
      };

      const userResult: any = {
        id: 1,
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan.perez@example.com',
        legajo: '12345',
        dni: '12345678',
        rol: UserRole.ESTUDIANTE,
        createdAt: undefined,
        planEstudio: undefined,
      };

      jest.spyOn(mockPlanEstudioService, 'findOne').mockImplementation(() => Promise.resolve(undefined as any));
      jest.spyOn(mockUserRepo, 'create').mockImplementation((dto: any) => ({
        id: 1,
        nombre: dto.nombre,
        apellido: dto.apellido,
        email: dto.email,
        password: dto.password,
        legajo: dto.legajo,
        dni: dto.dni,
        rol: dto.rol,
        createdAt: undefined,
        planEstudio: undefined,
      }));
      jest.spyOn(mockUserRepo, 'save').mockResolvedValue(userResult);

      // Act
      const result = await service.create(createUserDto);

      // Assert
      expect(result).toEqual(userResult);
      expect(mockPlanEstudioService.findOne).not.toHaveBeenCalled();
      expect(mockUserRepo.save).toHaveBeenCalled();
    });

    it('should create a user with plan de estudio', async () => {
      // Arrange
      const createUserDto: CreateUserDto = {
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan.perez@example.com',
        password: 'password123',
        legajo: '12345',
        dni: '12345678',
        rol: UserRole.ESTUDIANTE,
        planEstudioId: 1,
      };

      const mockPlan = { id: 1, nombre: 'Plan Test 1', carrera: { id: 1, nombre: 'Carrera Test' } } as PlanEstudio;
      const userResult: any = {
        id: 1,
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan.perez@example.com',
        legajo: '12345',
        dni: '12345678',
        rol: UserRole.ESTUDIANTE,
        createdAt: undefined,
        planEstudio: mockPlan,
      };

      jest.spyOn(mockPlanEstudioService, 'findOne').mockResolvedValue(mockPlan);
      jest.spyOn(mockUserRepo, 'create').mockImplementation((dto: any) => ({
        id: 1,
        nombre: dto.nombre,
        apellido: dto.apellido,
        email: dto.email,
        password: dto.password,
        legajo: dto.legajo,
        dni: dto.dni,
        rol: dto.rol,
        createdAt: undefined,
        planEstudio: mockPlan,
      }));
      jest.spyOn(mockUserRepo, 'save').mockResolvedValue(userResult);

      // Act
      const result = await service.create(createUserDto);

      // Assert
      expect(result).toEqual(userResult);
      expect(mockPlanEstudioService.findOne).toHaveBeenCalledWith(1);
      expect(mockUserRepo.save).toHaveBeenCalled();
    });

    it('should throw an error if plan de estudio is not found', async () => {
      // Arrange
      const createUserDto: CreateUserDto = {
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan.perez@example.com',
        password: 'password123',
        legajo: '12345',
        dni: '12345678',
        rol: UserRole.ESTUDIANTE,
        planEstudioId: 1,
      };

      jest.spyOn(mockPlanEstudioService, 'findOne').mockRejectedValue(new Error('Plan de estudio no encontrado'));

      // Act & Assert
      await expect(service.create(createUserDto)).rejects.toThrow('Plan de estudio no encontrado');
      expect(mockPlanEstudioService.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('findByEmail', () => {
    it('should return a user if found', async () => {
      // Arrange
      const userResult: any = {
        id: 1,
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan.perez@example.com',
        legajo: '12345',
        dni: '12345678',
        rol: UserRole.ESTUDIANTE,
        planEstudio: {
          id: 1,
          nombre: 'Plan Test 1',
          carrera: { id: 1, nombre: 'Carrera Test' },
        } as PlanEstudio,
      };
      
      const qb = createQueryBuilderMock();
      qb.getOne.mockResolvedValue({
        ...userResult,
        planEstudio: {
          id: 1,
          nombre: 'Plan Test 1',
          carrera: { id: 1, nombre: 'Carrera Test' },
        },
      });
      mockUserRepo.createQueryBuilder.mockReturnValue(qb);

      // Act
      const result = await service.findByEmail('juan.perez@example.com');

      // Assert
      expect(result).toEqual(expect.objectContaining({
        id: 1,
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan.perez@example.com',
        legajo: '12345',
        dni: '12345678',
        rol: UserRole.ESTUDIANTE,
        planEstudio: expect.objectContaining({
          id: 1,
          nombre: 'Plan Test 1',
          carrera: expect.objectContaining({ id: 1, nombre: 'Carrera Test' }),
        }),
      }));
      expect(mockUserRepo.createQueryBuilder).toHaveBeenCalledWith('user');
    });

    it('should return undefined if user is not found', async () => {
      // Arrange
      const qb = createQueryBuilderMock();
      qb.getOne.mockResolvedValue(null);
      mockUserRepo.createQueryBuilder.mockReturnValue(qb);

      // Act
      const result = await service.findByEmail('nonexistent@example.com');

      // Assert
      expect(result).toBeUndefined();
      expect(mockUserRepo.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('findByLegajo', () => {
    it('should return a user by legajo if found', async () => {
      const qb = createQueryBuilderMock();
      qb.getOne.mockResolvedValue({ id: 2, legajo: '123', planEstudio: { id: 1, nombre: 'Plan', carrera: { id: 1, nombre: 'Carrera' } } } as any);
      mockUserRepo.createQueryBuilder.mockReturnValue(qb);
      const res = await service.findByLegajo('123');
      expect(res).toEqual(expect.objectContaining({ id: 2, legajo: '123' }));
    });
    it('should return undefined when not found', async () => {
      const qb = createQueryBuilderMock();
      qb.getOne.mockResolvedValue(null);
      mockUserRepo.createQueryBuilder.mockReturnValue(qb);
      const res = await service.findByLegajo('x');
      expect(res).toBeUndefined();
    });
  });

  describe('findById', () => {
    it('should return a user if found', async () => {
      const createdAt = new Date('2024-01-01T00:00:00Z');
      const userEntity: any = {
        id: 1,
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan.perez@example.com',
        legajo: '12345',
        dni: '12345678',
        rol: UserRole.ESTUDIANTE,
        createdAt,
        planEstudio: {
          id: 1,
          nombre: 'Plan Test 1',
          carrera: { id: 1, nombre: 'Carrera Test' },
        } as PlanEstudio,
      };

      const expectedUser = {
        id: 1,
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan.perez@example.com',
        legajo: '12345',
        dni: '12345678',
        rol: UserRole.ESTUDIANTE,
        createdAt,
        planEstudio: {
          id: 1,
          nombre: 'Plan Test 1',
          carrera: { id: 1, nombre: 'Carrera Test' },
        },
      };

      const qb = createQueryBuilderMock();
      qb.getOne.mockResolvedValue(userEntity);
      mockUserRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findById(1);

      expect(result).toEqual(expectedUser);
      expect(mockUserRepo.createQueryBuilder).toHaveBeenCalledWith('user');
    });

    it('should return undefined if user is not found', async () => {
      // Arrange
      const qb = createQueryBuilderMock();
      qb.getOne.mockResolvedValue(null);
      mockUserRepo.createQueryBuilder.mockReturnValue(qb);

      // Act
      const result = await service.findById(999);

      // Assert
      expect(result).toBeUndefined();
      expect(mockUserRepo.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const qb = createQueryBuilderMock();
      qb.getMany.mockResolvedValue([
        {
          id: 1,
          nombre: 'Juan',
          apellido: 'Pérez',
          email: 'juan.perez@example.com',
          legajo: '12345',
          dni: '12345678',
          rol: UserRole.ESTUDIANTE,
          createdAt: new Date('2024-01-01'),
          planEstudio: {
            id: 1,
            nombre: 'Plan Test 1',
            carrera: { id: 1, nombre: 'Carrera Test' },
          },
        } as User,
      ]);
      qb.getCount.mockResolvedValue(1);
      mockUserRepo.createQueryBuilder.mockReturnValue(qb);
      mockUserRepo.count.mockResolvedValue(1);

      const result = await service.findAll(1, 10);

      expect(result).toEqual({
        data: [
          expect.objectContaining({
            id: 1,
            nombre: 'Juan',
            apellido: 'Pérez',
            email: 'juan.perez@example.com',
            legajo: '12345',
            dni: '12345678',
            rol: UserRole.ESTUDIANTE,
            planEstudio: expect.objectContaining({
              id: 1,
              nombre: 'Plan Test 1',
              carrera: expect.objectContaining({ id: 1, nombre: 'Carrera Test' }),
            }),
          }),
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
      expect(mockUserRepo.count).toHaveBeenCalled();
      expect(qb.skip).toHaveBeenCalledWith(0);
      expect(qb.take).toHaveBeenCalledWith(10);
    });
  });

  describe('findWithFilters', () => {
    it('should apply filters and paginate', async () => {
      const qb = createQueryBuilderMock();
      qb.getCount.mockResolvedValue(2);
      qb.getMany.mockResolvedValue([]);
      mockUserRepo.createQueryBuilder.mockReturnValue(qb);

      const res = await service.findWithFilters({ legajo: '12', nombre: 'Ju', apellido: 'Pe', dni: '1234', year: 2024 }, 2, 5);
      expect(qb.andWhere).toHaveBeenCalledWith('user.legajo ILIKE :legajo', { legajo: '%12%' });
      expect(qb.andWhere).toHaveBeenCalledWith('user.nombre ILIKE :nombre', { nombre: '%Ju%' });
      expect(qb.andWhere).toHaveBeenCalledWith('user.apellido ILIKE :apellido', { apellido: '%Pe%' });
      expect(qb.andWhere).toHaveBeenCalledWith('user.dni ILIKE :dni', { dni: '%1234%' });
      expect(qb.andWhere).toHaveBeenCalledWith('EXTRACT(YEAR FROM user.createdAt) = :year', { year: 2024 });
      expect(res.total).toBe(2);
      expect(res.page).toBe(2);
      expect(res.limit).toBe(5);
    });
  });

  describe('findByEmailWithPassword/LegajoWithPassword', () => {
    it('should return user or undefined for email with password', async () => {
      mockUserRepo.findOne.mockResolvedValueOnce({ id: 1 });
      await expect(service.findByEmailWithPassword('a@b.com')).resolves.toEqual({ id: 1 });
      mockUserRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.findByEmailWithPassword('x@y.com')).resolves.toBeUndefined();
    });

    it('should return user or undefined for legajo with password', async () => {
      mockUserRepo.findOne.mockResolvedValueOnce({ id: 2 });
      await expect(service.findByLegajoWithPassword('123')).resolves.toEqual({ id: 2 });
      mockUserRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.findByLegajoWithPassword('456')).resolves.toBeUndefined();
    });
  });

  describe('update', () => {
    it('should update a user without changing plan de estudio', async () => {
      // Arrange
      const updateDto: UpdateUserDto = {
        nombre: 'Juan Carlos'
      };
      
      const originalUser: any = {
        id: 1,
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan.perez@example.com',
        legajo: '12345',
        dni: '12345678',
        rol: UserRole.ESTUDIANTE,
        createdAt: undefined,
        planEstudio: { id: 1, nombre: 'Plan Test 1', carrera: { id: 1, nombre: 'Carrera Test' } } as PlanEstudio,
      };
      
      const expectedUpdatedUser: any = {
        ...originalUser,
        nombre: 'Juan Carlos',
      };

      jest.spyOn(service, 'findById').mockResolvedValue(expectedUpdatedUser);
      jest.spyOn(mockUserRepo, 'update').mockResolvedValue(undefined);

      // Act
      const result = await service.update(1, updateDto);

      // Assert
      expect(result).toEqual(expectedUpdatedUser);
      expect(mockUserRepo.update).toHaveBeenCalledWith(1, {
        nombre: 'Juan Carlos',
      });
    });

    it('should update a user with a new plan de estudio', async () => {
      // Arrange
      const updateDto: UpdateUserDto = {
        nombre: 'Juan Carlos',
        planEstudioId: 2,
      };

      const originalUser: any = {
        id: 1,
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan.perez@example.com',
        legajo: '12345',
        dni: '12345678',
        rol: UserRole.ESTUDIANTE,
        createdAt: undefined,
        updatedAt: undefined,
        planEstudio: { id: 1, nombre: 'Plan Test 1', carrera: { id: 1, nombre: 'Carrera Test' } } as PlanEstudio,
      };
      
      const mockNewPlan = { id: 2, nombre: 'Plan Test 2', carrera: { id: 2, nombre: 'Carrera Nueva' } } as PlanEstudio;
      
      const expectedUpdatedUser: any = {
        ...originalUser,
        nombre: 'Juan Carlos',
        planEstudio: mockNewPlan,
      };

      jest.spyOn(mockPlanEstudioService, 'findOne').mockResolvedValue(mockNewPlan);
      jest.spyOn(service, 'findById').mockResolvedValue(expectedUpdatedUser);
      jest.spyOn(mockUserRepo, 'update').mockResolvedValue(undefined);

      // Act
      const result = await service.update(1, updateDto);

      // Assert
      expect(result).toEqual(expectedUpdatedUser);
      expect(mockPlanEstudioService.findOne).toHaveBeenCalledWith(2);
      expect(mockUserRepo.update).toHaveBeenCalledWith(1, {
        nombre: 'Juan Carlos',
        planEstudioId: mockNewPlan.id,
      });
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      // Arrange
      jest.spyOn(mockUserRepo, 'delete').mockResolvedValue(undefined);

      // Act
      await service.remove(1);

      // Assert
      expect(mockUserRepo.delete).toHaveBeenCalledWith(1);
    });
  });
});