// src/plan-estudio/plan-estudio.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PlanEstudioService } from './plan-estudio.service';
import { PlanEstudio } from './entities/plan-estudio.entity';
import { Carrera } from '../carrera/entities/carrera.entity';
import { PlanEstudioResponseDto } from './dto/plan-estudio-response.dto';

describe('PlanEstudioService', () => {
  let service: PlanEstudioService;
  let mockPlanRepo: jest.Mocked<any>;
  let mockCarreraRepo: jest.Mocked<any>;

  const createCarrera = (overrides: Partial<Carrera> = {}): Carrera => ({
    id: overrides.id ?? 1,
    nombre: overrides.nombre ?? 'Ingeniería',
  } as Carrera);

  const createPlan = (overrides: Partial<PlanEstudio> = {}): PlanEstudio => ({
    id: overrides.id ?? 1,
    nombre: overrides.nombre ?? 'Plan Test',
    descripcion: overrides.descripcion ?? 'Descripción',
    año: overrides.año ?? 2024,
    carrera: overrides.carrera ?? createCarrera(),
    createdAt: overrides.createdAt ?? new Date('2024-01-01T00:00:00Z'),
    updatedAt: overrides.updatedAt ?? new Date('2024-01-02T00:00:00Z'),
  } as PlanEstudio);

  const mapToDto = (plan: PlanEstudio): PlanEstudioResponseDto => ({
    id: plan.id,
    nombre: plan.nombre,
    descripcion: plan.descripcion,
    año: plan.año,
    carrera: {
      id: plan.carrera.id,
      nombre: plan.carrera.nombre,
    },
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
  });

  beforeEach(async () => {
    mockPlanRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
    };

    mockCarreraRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlanEstudioService,
        {
          provide: getRepositoryToken(PlanEstudio),
          useValue: mockPlanRepo,
        },
        {
          provide: getRepositoryToken(Carrera),
          useValue: mockCarreraRepo,
        },
      ],
    }).compile();

    service = module.get<PlanEstudioService>(PlanEstudioService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a plan estudio successfully', async () => {
      const dto = { nombre: 'Plan', descripcion: 'Desc', carreraId: 1 };
      const carrera = createCarrera();
      const plan = createPlan({ carrera });

      mockCarreraRepo.findOne.mockResolvedValue(carrera);
      mockPlanRepo.create.mockReturnValue(plan);
      mockPlanRepo.save.mockResolvedValue(plan);

      const result = await service.create(dto);

      expect(result).toEqual(mapToDto(plan));
      expect(mockCarreraRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockPlanRepo.create).toHaveBeenCalledWith({ ...dto, carrera });
      expect(mockPlanRepo.save).toHaveBeenCalledWith(plan);
    });

    it('should throw error when carrera is not found', async () => {
      const dto = { nombre: 'Plan', descripcion: 'Desc', carreraId: 1 };
      mockCarreraRepo.findOne.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow('Carrera no encontrada');
      expect(mockCarreraRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockPlanRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all plans mapped to DTO', async () => {
      const plan = createPlan();
      mockPlanRepo.find.mockResolvedValue([plan]);

      const result = await service.findAll();

      expect(result).toEqual([mapToDto(plan)]);
      expect(mockPlanRepo.find).toHaveBeenCalledWith({ relations: ['carrera'] });
    });
  });

  describe('findOne', () => {
    it('should return a plan when found', async () => {
      const plan = createPlan({ id: 5 });
      mockPlanRepo.findOne.mockResolvedValue(plan);

      const result = await service.findOne(5);

      expect(result).toEqual(mapToDto(plan));
      expect(mockPlanRepo.findOne).toHaveBeenCalledWith({ where: { id: 5 }, relations: ['carrera'] });
    });

    it('should throw error when plan is not found', async () => {
      mockPlanRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow('Plan de estudio no encontrado');
    });
  });

  describe('update', () => {
    it('should update plan data without changing carrera', async () => {
      const existingPlan = createPlan();
      const updateDto = { nombre: 'Plan Actualizado', descripcion: 'Nueva desc' };
      const updatedPlan = createPlan({ ...existingPlan, ...updateDto });

      mockPlanRepo.findOne.mockResolvedValue(existingPlan);
      mockPlanRepo.save.mockResolvedValue(updatedPlan);

      const result = await service.update(1, updateDto);

      expect(mockPlanRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 }, relations: ['carrera'] });
      expect(mockPlanRepo.save).toHaveBeenCalledWith(expect.objectContaining(updateDto));
      expect(result).toEqual(mapToDto(updatedPlan));
      expect(mockCarreraRepo.findOne).not.toHaveBeenCalled();
    });

    it('should update plan carrera when carreraId is provided', async () => {
      const existingPlan = createPlan();
      const newCarrera = createCarrera({ id: 2, nombre: 'Ciencias' });
      const updateDto = { carreraId: 2 };
      const updatedPlan = createPlan({ ...existingPlan, carrera: newCarrera });

      mockPlanRepo.findOne.mockResolvedValue(existingPlan);
      mockCarreraRepo.findOne.mockResolvedValue(newCarrera);
      mockPlanRepo.save.mockResolvedValue(updatedPlan);

      const result = await service.update(1, updateDto);

      expect(mockPlanRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 }, relations: ['carrera'] });
      expect(mockCarreraRepo.findOne).toHaveBeenCalledWith({ where: { id: 2 } });
      expect(mockPlanRepo.save).toHaveBeenCalledWith(expect.objectContaining({ carrera: newCarrera }));
      expect(result).toEqual(mapToDto(updatedPlan));
    });

    it('should throw NotFound when carreraId is invalid on update', async () => {
      const existingPlan = createPlan();
      mockPlanRepo.findOne.mockResolvedValue(existingPlan);
      mockCarreraRepo.findOne.mockResolvedValue(null);
      await expect(service.update(1, { carreraId: 999 } as any)).rejects.toThrow('Carrera no encontrada');
    });
  });

  describe('remove', () => {
    it('should remove plan by id', async () => {
      mockPlanRepo.delete.mockResolvedValue(undefined);

      await service.remove(7);

      expect(mockPlanRepo.delete).toHaveBeenCalledWith(7);
    });
  });
});