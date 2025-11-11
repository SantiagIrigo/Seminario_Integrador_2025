// src/departamento/departamento.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DepartamentoService } from './departamento.service';
import { Departamento } from './entities/departamento.entity';
import { NotFoundException } from '@nestjs/common';

describe('DepartamentoService', () => {
  let service: DepartamentoService;
  let mockDepartamentoRepo: any;

  beforeEach(async () => {
    // Crear mock del repositorio
    mockDepartamentoRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepartamentoService,
        {
          provide: getRepositoryToken(Departamento),
          useValue: mockDepartamentoRepo,
        },
      ],
    }).compile();

    service = module.get<DepartamentoService>(DepartamentoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a departamento successfully', async () => {
      // Arrange
      const createDto = {
        nombre: 'Departamento de Sistemas',
        descripcion: 'Departamento de ingeniería en sistemas',
        carreraId: 1
      };

      const savedDepartamento = {
        id: 1,
        ...createDto
      };

      // Mock del repositorio
      jest.spyOn(mockDepartamentoRepo, 'create').mockImplementation((data) => data);
      jest.spyOn(mockDepartamentoRepo, 'save').mockResolvedValue(savedDepartamento as any);

      // Act
      const result = await service.create(createDto);

      // Assert
      expect(result).toEqual(savedDepartamento);
      expect(mockDepartamentoRepo.create).toHaveBeenCalledWith(createDto);
      expect(mockDepartamentoRepo.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all departamentos', async () => {
      // Arrange
      const departamentos = [
        {
          id: 1,
          nombre: 'Departamento de Sistemas',
          descripcion: 'Departamento de ingeniería en sistemas'
        }
      ];

      // Mock del repositorio
      jest.spyOn(mockDepartamentoRepo, 'find').mockResolvedValue(departamentos as any);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual(departamentos);
      expect(mockDepartamentoRepo.find).toHaveBeenCalledWith({
        relations: ['materias', 'carrera']
      });
    });
  });

  describe('findOne', () => {
    it('should return a departamento by id', async () => {
      // Arrange
      const departamento = {
        id: 1,
        nombre: 'Departamento de Sistemas',
        descripcion: 'Departamento de ingeniería en sistemas'
      };

      // Mock del repositorio
      jest.spyOn(mockDepartamentoRepo, 'findOne').mockResolvedValue(departamento as any);

      // Act
      const result = await service.findOne(1);

      // Assert
      expect(result).toEqual(departamento);
      expect(mockDepartamentoRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['materias', 'carrera']
      });
    });

    it('should throw NotFoundException when departamento not found', async () => {
      // Arrange
      jest.spyOn(mockDepartamentoRepo, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(999)).rejects.toThrow('Departamento no encontrado');
      expect(mockDepartamentoRepo.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
        relations: ['materias', 'carrera']
      });
    });
  });

  describe('update', () => {
    it('should update a departamento successfully', async () => {
      // Arrange
      const id = 1;
      const updateDto = {
        nombre: 'Departamento de Sistemas Actualizado',
        descripcion: 'Departamento actualizado'
      };

      const existingDepartamento = {
        id,
        nombre: 'Departamento de Sistemas',
        descripcion: 'Departamento antiguo'
      };

      const updatedDepartamento = {
        ...existingDepartamento,
        ...updateDto
      };

      // Mock del repositorio
      jest.spyOn(mockDepartamentoRepo, 'findOne').mockResolvedValue(existingDepartamento as any);
      jest.spyOn(mockDepartamentoRepo, 'save').mockResolvedValue(updatedDepartamento as any);

      // Act
      const result = await service.update(id, updateDto);

      // Assert
      expect(result).toEqual(updatedDepartamento);
      expect(mockDepartamentoRepo.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['materias', 'carrera']
      });
      expect(mockDepartamentoRepo.save).toHaveBeenCalledWith({
        ...existingDepartamento,
        ...updateDto
      });
    });

    it('should throw NotFoundException when departamento not found during update', async () => {
      // Arrange
      const id = 1;
      const updateDto = {
        nombre: 'Departamento de Sistemas Actualizado'
      };

      // Mock del repositorio
      jest.spyOn(mockDepartamentoRepo, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(service.update(id, updateDto)).rejects.toThrow('Departamento no encontrado');
      expect(mockDepartamentoRepo.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['materias', 'carrera']
      });
    });
  });

  describe('remove', () => {
    it('should remove a departamento successfully', async () => {
      // Arrange
      const id = 1;
      
      const departamento = {
        id,
        nombre: 'Departamento de Sistemas',
        descripcion: 'Departamento de ingeniería en sistemas'
      };

      // Mock del repositorio
      jest.spyOn(mockDepartamentoRepo, 'findOne').mockResolvedValue(departamento as any);
      jest.spyOn(mockDepartamentoRepo, 'remove').mockResolvedValue(undefined);

      // Act
      await service.remove(id);

      // Assert
      expect(mockDepartamentoRepo.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['materias', 'carrera']
      });
      expect(mockDepartamentoRepo.remove).toHaveBeenCalledWith(departamento);
    });

    it('should throw NotFoundException when departamento not found during removal', async () => {
      // Arrange
      const id = 1;
      
      // Mock del repositorio
      jest.spyOn(mockDepartamentoRepo, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove(id)).rejects.toThrow('Departamento no encontrado');
      expect(mockDepartamentoRepo.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['materias', 'carrera']
      });
    });
  });
});