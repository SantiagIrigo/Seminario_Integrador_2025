import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MateriaService } from '../../src/materia/materia.service';
import { Materia } from '../../src/materia/entities/materia.entity';
import { Departamento } from '../../src/departamento/entities/departamento.entity';
import { mockRepository } from '../utils/test-utils';
import { createTestingModule, initRepositoryMocks } from '../test-setup';

describe('MateriaService', () => {
  let service: MateriaService;
  let materiaRepository: any;
  let departamentoRepository: any;

  const mockMateria = {
    id: 1,
    nombre: 'Matemática I',
    descripcion: 'Curso introductorio de matemáticas',
    departamento: { id: 1, nombre: 'Básicas' },
  };

  beforeEach(async () => {
    const module: TestingModule = await createTestingModule(
      [MateriaService],
      [Materia, Departamento]
    );

    // Inicializar mocks de repositorios
    materiaRepository = initRepositoryMocks(module, Materia, [mockMateria]);
    departamentoRepository = module.get(getRepositoryToken(Departamento));
    
    service = module.get<MateriaService>(MateriaService);
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('debería retornar un arreglo de materias', async () => {
      const result = await service.findAll();
      expect(Array.isArray(result)).toBe(true);
      expect(materiaRepository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('debería retornar una materia por id', async () => {
      const result = await service.findOne(1);
      expect(result).toBeDefined();
      expect(materiaRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: expect.any(Array),
      });
    });

    it('debería lanzar una excepción si la materia no existe', async () => {
      materiaRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.findOne(999)).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('debería crear una nueva materia', async () => {
      const nuevaMateria = {
        nombre: 'Nueva Materia',
        descripcion: 'Descripción de prueba',
      };
      
      const result = await service.create(nuevaMateria);
      expect(result).toBeDefined();
      expect(materiaRepository.save).toHaveBeenCalledWith(
        expect.objectContaining(nuevaMateria)
      );
    });
  });

  // Agregar más pruebas para los demás métodos
});
