// src/comision/comision.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { ComisionService } from './comision.service';
import { TestDatabaseModule } from '../test-utils/test-database.module';
import { Comision } from './entities/comision.entity';
import { Materia } from '../materia/entities/materia.entity';
import { User } from '../user/entities/user.entity';
import { CreateComisionDto } from './dto/create-comision.dto';
import { UpdateComisionDto } from './dto/update-comision.dto';

describe('ComisionService', () => {
  let service: ComisionService;
  let mockComisionRepo: any;
  let mockMateriaRepo: any;
  let mockUserRepo: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TestDatabaseModule,
        TypeOrmModule.forFeature([Comision, Materia, User]),
      ],
      providers: [
        ComisionService,
      ],
    }).compile();

    service = module.get<ComisionService>(ComisionService);
    mockComisionRepo = module.get(getRepositoryToken(Comision));
    mockMateriaRepo = module.get(getRepositoryToken(Materia));
    mockUserRepo = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Tests específicos para verificar funcionalidad sin conexión real
  describe('create', () => {
    it('should create a comision successfully', async () => {
      // Arrange
      const createDto: CreateComisionDto = {
        nombre: 'Comisión A',
        descripcion: 'Descripción de la comisión A',
        materiaId: 1,
        profesorId: 1
      };

      const materia = {
        id: 1,
        nombre: 'Matemática'
      };

      const profesor = {
        id: 1,
        nombre: 'Profesor',
        apellido: 'Apellido'
      };

      const savedComision = {
        id: 1,
        ...createDto,
        materia,
        profesor
      };

      // Mock de los repositorios
      jest.spyOn(mockMateriaRepo, 'findOne').mockResolvedValue(materia as any);
      jest.spyOn(mockUserRepo, 'findOne').mockResolvedValue(profesor as any);
      jest.spyOn(mockComisionRepo, 'create').mockImplementation((data) => data);
      jest.spyOn(mockComisionRepo, 'save').mockResolvedValue(savedComision as any);

      // Act
      const result = await service.create(createDto);

      // Assert
      expect(result).toEqual(savedComision);
      expect(mockMateriaRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockComisionRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when materia not found', async () => {
      // Arrange
      const createDto: CreateComisionDto = {
        nombre: 'Comisión A',
        descripcion: 'Descripción de la comisión A',
        materiaId: 1,
        profesorId: 1
      };

      // Mock del repositorio
      jest.spyOn(mockMateriaRepo, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(createDto)).rejects.toThrow('Materia no encontrada');
      expect(mockMateriaRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundException when professor not found', async () => {
      // Arrange
      const createDto: CreateComisionDto = {
        nombre: 'Comisión A',
        descripcion: 'Descripción de la comisión A',
        materiaId: 1,
        profesorId: 1
      };

      const materia = {
        id: 1,
        nombre: 'Matemática'
      };

      // Mock de los repositorios
      jest.spyOn(mockMateriaRepo, 'findOne').mockResolvedValue(materia as any);
      jest.spyOn(mockUserRepo, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(createDto)).rejects.toThrow('Profesor no encontrado');
      expect(mockMateriaRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  describe('findAll', () => {
    it('should return all comisiones', async () => {
      // Arrange
      const comisiones = [
        {
          id: 1,
          nombre: 'Comisión A',
          descripcion: 'Descripción de la comisión A',
          materia: { id: 1, nombre: 'Matemática' },
          profesor: { id: 1, nombre: 'Profesor', apellido: 'Apellido' }
        }
      ];

      // Mock del repositorio
      jest.spyOn(mockComisionRepo, 'find').mockResolvedValue(comisiones as any);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual(comisiones);
      expect(mockComisionRepo.find).toHaveBeenCalledWith({
        relations: ['materia', 'profesor'],
      });
    });
  });

  describe('findOne', () => {
    it('should return a comision by id', async () => {
      // Arrange
      const comision = {
        id: 1,
        nombre: 'Comisión A',
        descripcion: 'Descripción de la comisión A',
        materia: { id: 1, nombre: 'Matemática' },
        profesor: { id: 1, nombre: 'Profesor', apellido: 'Apellido' }
      };

      // Mock del repositorio
      jest.spyOn(mockComisionRepo, 'findOne').mockResolvedValue(comision as any);

      // Act
      const result = await service.findOne(1);

      // Assert
      expect(result).toEqual(comision);
      expect(mockComisionRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['materia', 'profesor'],
      });
    });

    it('should throw NotFoundException when comision not found', async () => {
      // Arrange
      jest.spyOn(mockComisionRepo, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(999)).rejects.toThrow('Comisión no encontrada');
      expect(mockComisionRepo.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
        relations: ['materia', 'profesor'],
      });
    });
  });

  describe('update', () => {
    it('should update a comision successfully', async () => {
      // Arrange
      const updateDto: UpdateComisionDto = {
        nombre: 'Comisión Actualizada',
        descripcion: 'Descripción actualizada'
      };

      const existingComision = {
        id: 1,
        nombre: 'Comisión A',
        descripcion: 'Descripción de la comisión A',
        materia: { id: 1 },
        profesor: { id: 1 }
      };

      const updatedComision = {
        ...existingComision,
        ...updateDto
      };

      // Mock de los repositorios
      jest.spyOn(mockComisionRepo, 'findOne').mockResolvedValue(existingComision as any);
      jest.spyOn(mockComisionRepo, 'save').mockResolvedValue(updatedComision as any);

      // Act
      const result = await service.update(1, updateDto);

      // Assert
      expect(result).toEqual(updatedComision);
      expect(mockComisionRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['materia']
      });
      expect(mockComisionRepo.save).toHaveBeenCalled();
    });

    it('should update professor when provided', async () => {
      // Arrange
      const updateDto: UpdateComisionDto = {
        profesorId: 2
      };

      const existingComision = {
        id: 1,
        nombre: 'Comisión A',
        materia: { id: 1 },
        profesor: { id: 1 }
      };

      const profesor = {
        id: 2,
        nombre: 'Nuevo Profesor',
        apellido: 'Apellido'
      };

      const updatedComision = {
        ...existingComision,
        profesor
      };

      // Mock de los repositorios
      jest.spyOn(mockComisionRepo, 'findOne').mockResolvedValue(existingComision as any);
      jest.spyOn(mockUserRepo, 'findOne').mockResolvedValue(profesor as any);
      jest.spyOn(mockComisionRepo, 'save').mockResolvedValue(updatedComision as any);

      // Act
      const result = await service.update(1, updateDto);

      // Assert
      expect(result).toEqual(updatedComision);
      expect(mockComisionRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['materia']
      });
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({ where: { id: 2 } });
      expect(mockComisionRepo.save).toHaveBeenCalled();
    });

    it('should set professor to null when null is provided', async () => {
      // Arrange
      const updateDto: UpdateComisionDto = {
        profesorId: null
      };

      const existingComision = {
        id: 1,
        nombre: 'Comisión A',
        materia: { id: 1 },
        profesor: { id: 1 }
      };

      const updatedComision = {
        ...existingComision,
        profesor: null
      };

      // Mock de los repositorios
      jest.spyOn(mockComisionRepo, 'findOne').mockResolvedValue(existingComision as any);
      jest.spyOn(mockComisionRepo, 'save').mockResolvedValue(updatedComision as any);

      // Act
      const result = await service.update(1, updateDto);

      // Assert
      expect(result).toEqual(updatedComision);
      expect(mockComisionRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['materia']
      });
      expect(mockComisionRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when comision not found during update', async () => {
      // Arrange
      const updateDto: UpdateComisionDto = {
        nombre: 'Comisión Actualizada'
      };

      // Mock del repositorio
      jest.spyOn(mockComisionRepo, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(service.update(1, updateDto)).rejects.toThrow('Comisión no encontrada');
      expect(mockComisionRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['materia']
      });
    });
  });

  describe('remove', () => {
    it('should remove a comision successfully', async () => {
      // Arrange
      const comision = {
        id: 1,
        nombre: 'Comisión A'
      };

      // Mock de los repositorios
      jest.spyOn(mockComisionRepo, 'findOne').mockResolvedValue(comision as any);
      jest.spyOn(mockComisionRepo, 'delete').mockResolvedValue(undefined);

      // Act
      await service.remove(1);

      // Assert
      expect(mockComisionRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockComisionRepo.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when comision not found during removal', async () => {
      // Arrange
      jest.spyOn(mockComisionRepo, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove(1)).rejects.toThrow('Comisión no encontrada');
      expect(mockComisionRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  describe('findByMateria', () => {
    it('should return comisiones by materia', async () => {
      // Arrange
      const comisiones = [
        {
          id: 1,
          nombre: 'Comisión A',
          profesor: { id: 1, nombre: 'Profesor', apellido: 'Apellido' }
        }
      ];

      // Mock del repositorio
      jest.spyOn(mockComisionRepo, 'find').mockResolvedValue(comisiones as any);

      // Act
      const result = await service.findByMateria(1);

      // Assert
      expect(result).toEqual(comisiones);
      expect(mockComisionRepo.find).toHaveBeenCalledWith({
        where: { materia: { id: 1 } },
        relations: ['profesor'],
      });
    });
  });
});