// src/plan-estudio/plan-estudio.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { PlanEstudioController } from './plan-estudio.controller';
import { PlanEstudioService } from './plan-estudio.service';
import { CreatePlanEstudioDto } from './dto/create-plan-estudio.dto';
import { UpdatePlanEstudioDto } from './dto/update-plan-estudio.dto';

describe('PlanEstudioController', () => {
  let controller: PlanEstudioController;
  let mockPlanEstudioService: Partial<PlanEstudioService>;

  beforeEach(async () => {
    mockPlanEstudioService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlanEstudioController],
      providers: [
        {
          provide: PlanEstudioService,
          useValue: mockPlanEstudioService,
        },
      ],
    }).compile();

    controller = module.get<PlanEstudioController>(PlanEstudioController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a plan estudio', async () => {
      // Arrange
      const createPlanEstudioDto: CreatePlanEstudioDto = {
        nombre: 'Plan de Ingeniería',
        descripcion: 'Plan de estudios para ingeniería',
        carreraId: 1
      };
      
      const expectedResult = {
        id: 1,
        ...createPlanEstudioDto
      };
      
      (mockPlanEstudioService.create as jest.Mock).mockResolvedValue(expectedResult);

      // Act
      const result = await controller.create(createPlanEstudioDto);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockPlanEstudioService.create).toHaveBeenCalledWith(createPlanEstudioDto);
    });
  });

  describe('findAll', () => {
    it('should return all plans', async () => {
      // Arrange
      const expectedResult = [{
        id: 1,
        nombre: 'Plan de Ingeniería',
        descripcion: 'Plan de estudios para ingeniería',
        carreraId: 1
      }];
      
      (mockPlanEstudioService.findAll as jest.Mock).mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockPlanEstudioService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a plan by id', async () => {
      // Arrange
      const expectedResult = {
        id: 1,
        nombre: 'Plan de Ingeniería',
        descripcion: 'Plan de estudios para ingeniería',
        carreraId: 1
      };
      
      (mockPlanEstudioService.findOne as jest.Mock).mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findOne('1');

      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockPlanEstudioService.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should update a plan', async () => {
      // Arrange
      const id = '1';
      const updatePlanEstudioDto: UpdatePlanEstudioDto = {
        nombre: 'Plan Actualizado'
      };
      
      const expectedResult = {
        id: 1,
        ...updatePlanEstudioDto
      };
      
      (mockPlanEstudioService.update as jest.Mock).mockResolvedValue(expectedResult);

      // Act
      const result = await controller.update(id, updatePlanEstudioDto);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockPlanEstudioService.update).toHaveBeenCalledWith(1, updatePlanEstudioDto);
    });
  });

  describe('remove', () => {
    it('should remove a plan', async () => {
      // Arrange
      (mockPlanEstudioService.remove as jest.Mock).mockResolvedValue(undefined);

      // Act
      await controller.remove('1');

      // Assert
      expect(mockPlanEstudioService.remove).toHaveBeenCalledWith(1);
    });
  });
});