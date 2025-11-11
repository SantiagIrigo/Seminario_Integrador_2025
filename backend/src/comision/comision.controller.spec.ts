// src/comision/comision.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ComisionController } from './comision.controller';
import { ComisionService } from './comision.service';
import { CreateComisionDto } from './dto/create-comision.dto';
import { UpdateComisionDto } from './dto/update-comision.dto';

describe('ComisionController', () => {
  let controller: ComisionController;
  let mockComisionService: Partial<ComisionService>;

  beforeEach(async () => {
    mockComisionService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      findByMateria: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ComisionController],
      providers: [
        {
          provide: ComisionService,
          useValue: mockComisionService,
        },
      ],
    }).compile();

    controller = module.get<ComisionController>(ComisionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a comision', async () => {
      // Arrange
      const createDto: CreateComisionDto = {
        nombre: 'Comisión A',
        descripcion: 'Descripción de la comisión A',
        materiaId: 1,
        profesorId: 1
      };

      const result = { id: 1, ...createDto };

      (mockComisionService.create as jest.Mock).mockResolvedValue(result);

      // Act
      const response = await controller.create(createDto);

      // Assert
      expect(response).toEqual(result);
      expect(mockComisionService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return all comisiones', async () => {
      // Arrange
      const result = [
        {
          id: 1,
          nombre: 'Comisión A',
          descripcion: 'Descripción de la comisión A',
          materia: { id: 1 },
          profesor: { id: 1 }
        }
      ];

      (mockComisionService.findAll as jest.Mock).mockResolvedValue(result);

      // Act
      const response = await controller.findAll();

      // Assert
      expect(response).toEqual(result);
      expect(mockComisionService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a comision by id', async () => {
      // Arrange
      const result = {
        id: 1,
        nombre: 'Comisión A',
        descripcion: 'Descripción de la comisión A',
        materia: { id: 1 },
        profesor: { id: 1 }
      };

      (mockComisionService.findOne as jest.Mock).mockResolvedValue(result);

      // Act
      const response = await controller.findOne('1');

      // Assert
      expect(response).toEqual(result);
      expect(mockComisionService.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should update a comision', async () => {
      // Arrange
      const updateDto: UpdateComisionDto = {
        nombre: 'Comisión Actualizada'
      };

      const result = {
        id: 1,
        ...updateDto,
        descripcion: 'Descripción de la comisión A',
        materia: { id: 1 },
        profesor: { id: 1 }
      };

      (mockComisionService.update as jest.Mock).mockResolvedValue(result);

      // Act
      const response = await controller.update('1', updateDto);

      // Assert
      expect(response).toEqual(result);
      expect(mockComisionService.update).toHaveBeenCalledWith(1, updateDto);
    });
  });

  describe('remove', () => {
    it('should remove a comision', async () => {
      // Arrange
      (mockComisionService.remove as jest.Mock).mockResolvedValue(undefined);

      // Act
      await controller.remove('1');

      // Assert
      expect(mockComisionService.remove).toHaveBeenCalledWith(1);
    });
  });

  describe('findByMateria', () => {
    it('should return comisiones by materia', async () => {
      // Arrange
      const result = [
        {
          id: 1,
          nombre: 'Comisión A',
          profesor: { id: 1 }
        }
      ];

      (mockComisionService.findByMateria as jest.Mock).mockResolvedValue(result);

      // Act
      const response = await controller.findByMateria('1');

      // Assert
      expect(response).toEqual(result);
      expect(mockComisionService.findByMateria).toHaveBeenCalledWith(1);
    });
  });
});