// src/departamento/departamento.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { DepartamentoController } from './departamento.controller';
import { DepartamentoService } from './departamento.service';
import { CreateDepartamentoDto } from './dto/create-departamento.dto';
import { UpdateDepartamentoDto } from './dto/update-departamento.dto';

describe('DepartamentoController', () => {
  let controller: DepartamentoController;
  let mockDepartamentoService: Partial<DepartamentoService>;

  beforeEach(async () => {
    mockDepartamentoService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DepartamentoController],
      providers: [
        {
          provide: DepartamentoService,
          useValue: mockDepartamentoService,
        },
      ],
    }).compile();

    controller = module.get<DepartamentoController>(DepartamentoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a departamento', async () => {
      // Arrange
      const createDto: CreateDepartamentoDto = {
        nombre: 'Departamento de Sistemas',
        descripcion: 'Departamento de ingeniería en sistemas',
        carreraId: 1
      };

      const result = { id: 1, ...createDto };

      (mockDepartamentoService.create as jest.Mock).mockResolvedValue(result);

      // Act
      const response = await controller.create(createDto);

      // Assert
      expect(response).toEqual(result);
      expect(mockDepartamentoService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return all departamentos', async () => {
      // Arrange
      const result = [
        {
          id: 1,
          nombre: 'Departamento de Sistemas',
          descripcion: 'Departamento de ingeniería en sistemas'
        }
      ];

      (mockDepartamentoService.findAll as jest.Mock).mockResolvedValue(result);

      // Act
      const response = await controller.findAll();

      // Assert
      expect(response).toEqual(result);
      expect(mockDepartamentoService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a departamento by id', async () => {
      // Arrange
      const result = {
        id: 1,
        nombre: 'Departamento de Sistemas',
        descripcion: 'Departamento de ingeniería en sistemas'
      };

      (mockDepartamentoService.findOne as jest.Mock).mockResolvedValue(result);

      // Act
      const response = await controller.findOne('1');

      // Assert
      expect(response).toEqual(result);
      expect(mockDepartamentoService.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should update a departamento', async () => {
      // Arrange
      const updateDto: UpdateDepartamentoDto = {
        nombre: 'Departamento de Sistemas Actualizado'
      };

      const result = {
        id: 1,
        ...updateDto,
        descripcion: 'Departamento de ingeniería en sistemas'
      };

      (mockDepartamentoService.update as jest.Mock).mockResolvedValue(result);

      // Act
      const response = await controller.update('1', updateDto);

      // Assert
      expect(response).toEqual(result);
      expect(mockDepartamentoService.update).toHaveBeenCalledWith(1, updateDto);
    });
  });

  describe('remove', () => {
    it('should remove a departamento', async () => {
      // Arrange
      (mockDepartamentoService.remove as jest.Mock).mockResolvedValue(undefined);

      // Act
      await controller.remove('1');

      // Assert
      expect(mockDepartamentoService.remove).toHaveBeenCalledWith(1);
    });
  });
});