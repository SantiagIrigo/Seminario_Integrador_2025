import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm'; // Importamos Repository
import { NotFoundException } from '@nestjs/common';
import { CorrelativasService } from './correlativas.service';
import { TestDatabaseModule } from '../test-utils/test-database.module';
import { Materia } from '../materia/entities/materia.entity';
import { Inscripcion } from '../inscripcion/entities/inscripcion.entity';
import { CorrelativasCursada } from './entities/correlativas-cursada.entity';
import { CorrelativasFinal } from './entities/correlativas-final.entity';
import { CorrelativasCursadaPlan } from './entities/correlativas-cursada-plan.entity';
import { CorrelativasFinalPlan } from './entities/correlativas-final-plan.entity';
import { MateriaPlanEstudio } from '../materia/entities/materia-plan-estudio.entity';

// Función utilitaria para crear mocks de repositorios (con tipado mejorado)
const mockRepository = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  save: jest.fn(),
});

describe('CorrelativasService', () => {
  // Tipado estricto: usamos jest.Mocked<Repository<Entity>>
  let service: CorrelativasService;
  let mockMateriaRepo: jest.Mocked<Repository<Materia>>;
  let mockInscripcionRepo: jest.Mocked<Repository<Inscripcion>>;
  let mockCorrelativasCursadaRepo: jest.Mocked<Repository<CorrelativasCursada>>;
  // 'mockCorrelativasFinalRepo' fue removido de aquí ya que no se usa en los tests
  // pero su mock de TypeORM se mantiene en 'providers' para satisfacer dependencias.

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TestDatabaseModule],
      providers: [
        CorrelativasService,
        // Provisión de MOCKS (necesarios para la inyección del servicio)
        {
          provide: getRepositoryToken(Materia),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Inscripcion),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(CorrelativasCursada),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(CorrelativasFinal),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(CorrelativasCursadaPlan),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(CorrelativasFinalPlan),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(MateriaPlanEstudio),
          useValue: mockRepository(),
        },
      ],
    }).compile();

    service = module.get<CorrelativasService>(CorrelativasService);

    // Asignación de mocks.
    mockMateriaRepo = module.get(getRepositoryToken(Materia));
    mockInscripcionRepo = module.get(getRepositoryToken(Inscripcion));
    mockCorrelativasCursadaRepo = module.get(
      getRepositoryToken(CorrelativasCursada),
    );

    mockInscripcionRepo.find.mockResolvedValue([]);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verificarCorrelativasCursada', () => {
    it('should return true when no correlativas required', async () => {
      // Arrange
      const materia = {
        id: 1,
        nombre: 'Matemática',
        correlativasCursada: [],
      };

      // Usamos .mockResolvedValue directamente en el mock (sin jest.spyOn)
      mockMateriaRepo.findOne.mockResolvedValue(materia as unknown as Materia);
      mockCorrelativasCursadaRepo.find.mockResolvedValue([]);

      // Act
      const result = await service.verificarCorrelativasCursada(1, 1);

      // Assert
      expect(result).toEqual({ cumple: true, faltantes: [] });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockMateriaRepo.findOne).toHaveBeenCalledWith(expect.anything());
    });

    it('should return true when student meets all prerequisites', async () => {
      // Arrange
      const materiaId = 1;
      const estudianteId = 1;
      const correlativaRequerida = { id: 2, nombre: 'Matemática' };

      // Usamos .mockResolvedValue directamente
      mockMateriaRepo.findOne.mockResolvedValue({
        id: materiaId,
        nombre: 'Álgebra',
        correlativasCursada: [
          { correlativa: correlativaRequerida } as unknown as CorrelativasCursada,
        ],
      } as unknown as Materia);

      mockInscripcionRepo.find.mockResolvedValue([
        {
          id: 1,
          stc: 'aprobada',
          notaFinal: 8,
          materia: { id: correlativaRequerida.id, nombre: correlativaRequerida.nombre },
        } as unknown as Inscripcion,
      ]);

      // Act
      const result = await service.verificarCorrelativasCursada(
        materiaId,
        estudianteId,
      );

      // Assert
      expect(result).toEqual({ cumple: true, faltantes: [] });
    });

    it('should return false when student misses prerequisites', async () => {
      // Arrange
      const materiaId = 1;
      const estudianteId = 1;
      const correlativaRequerida = { id: 2, nombre: 'Matemática' };

      mockMateriaRepo.findOne.mockResolvedValue({
        id: materiaId,
        nombre: 'Álgebra',
        correlativasCursada: [
          { correlativa: correlativaRequerida } as unknown as CorrelativasCursada,
        ],
      } as unknown as Materia);

      mockInscripcionRepo.find.mockResolvedValue([]); // No tiene la inscripción

      // Act
      const result = await service.verificarCorrelativasCursada(
        materiaId,
        estudianteId,
      );

      // Assert
      expect(result).toEqual({
        cumple: false,
        faltantes: [correlativaRequerida],
      });
    });

    it('should include fallback correlativa when nombre missing', async () => {
      mockMateriaRepo.findOne.mockResolvedValue({
        id: 1,
        nombre: 'Álgebra',
        correlativasCursada: [
          { correlativa: { id: 9 } } as any, // falta nombre
        ],
      } as unknown as Materia);
      mockInscripcionRepo.find.mockResolvedValue([]);
      const res = await service.verificarCorrelativasCursada(1, 1);
      expect(res.cumple).toBe(false);
      expect(res.faltantes).toEqual([{ id: 9, nombre: 'Materia desconocida' }]);
    });

    it('should throw NotFoundException when materia not found', async () => {
      // Arrange
      mockMateriaRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.verificarCorrelativasCursada(1, 1)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.verificarCorrelativasCursada(1, 1)).rejects.toThrow(
        'Materia no encontrada',
      );
    });
  });

  describe('verificarCorrelativasFinales', () => {
    it('should return true when no final correlativas required', async () => {
      // Arrange
      mockMateriaRepo.findOne.mockResolvedValue({
        id: 1,
        nombre: 'Matemática',
        correlativasFinal: [],
      } as unknown as Materia);

      // Act
      const result = await service.verificarCorrelativasFinales(1, 1);

      // Assert
      expect(result).toEqual({ cumple: true, faltantes: [] });
    });

    it('should return faltantes when finals not approved', async () => {
      mockMateriaRepo.findOne.mockResolvedValue({
        id: 1,
        nombre: 'Matemática',
        correlativasFinal: [
          { correlativa: { id: 9, nombre: 'Álgebra' } } as unknown as CorrelativasFinal,
        ],
      } as unknown as Materia);

      mockInscripcionRepo.find.mockResolvedValue([
        {
          id: 1,
          stc: 'cursada',
          materia: { id: 9, nombre: 'Álgebra' },
        } as unknown as Inscripcion,
      ]);

      const result = await service.verificarCorrelativasFinales(1, 1);
      expect(result.cumple).toBe(false);
      expect(result.faltantes).toEqual([{ id: 9, nombre: 'Álgebra' }]);
    });

    it('should include fallback nombre for finales when missing', async () => {
      mockMateriaRepo.findOne.mockResolvedValue({
        id: 1,
        nombre: 'X',
        correlativasFinal: [ { correlativa: { id: 5 } } as any ],
      } as any);
      mockInscripcionRepo.find.mockResolvedValue([]);
      const res = await service.verificarCorrelativasFinales(1, 1);
      expect(res.cumple).toBe(false);
      expect(res.faltantes).toEqual([{ id: 5, nombre: 'Materia desconocida' }]);
    });
  });

  describe('verificarTodasCorrelativas', () => {
    it('should aggregate results and compute aprobado correctly', async () => {
      jest.spyOn(service, 'verificarCorrelativasCursada').mockResolvedValue({ cumple: true, faltantes: [] });
      jest.spyOn(service, 'verificarCorrelativasFinales').mockResolvedValue({ cumple: false, faltantes: [{ id:1, nombre:'X'}] });
      const res = await service.verificarTodasCorrelativas(1, 2);
      expect(res.cursada.cumple).toBe(true);
      expect(res.final.cumple).toBe(false);
      expect(res.aprobado).toBe(false);
    });
  });

  describe('verificarInscripcionExamenFinal', () => {
    it('should return success when student can inscribe to final exam', async () => {
      // Arrange
      const inscripcion = {
        id: 1,
        stc: 'cursada',
        materia: { id: 1 },
        estudiante: { id: 1 },
      };

      // Usamos .mockResolvedValue directamente
      mockInscripcionRepo.findOne.mockResolvedValue(
        inscripcion as unknown as Inscripcion,
      );
      // Mock del servicio de correlativas (clave para este test)
      jest
        .spyOn(service, 'verificarCorrelativasFinales')
        .mockResolvedValue({ cumple: true, faltantes: [] });

      // Act
      const result = await service.verificarInscripcionExamenFinal(1, 1);

      // Assert
      expect(result).toEqual({
        cumple: true,
        faltantes: [],
      });
    });

    it('should return error when student has not completed course (stc: pendiente)', async () => {
      // Arrange
      const inscripcion = {
        id: 1,
        stc: 'pendiente', // No ha cursado la materia
        materia: { id: 1 },
        estudiante: { id: 1 },
      };

      // Usamos .mockResolvedValue directamente
      mockInscripcionRepo.findOne.mockResolvedValue(
        inscripcion as unknown as Inscripcion,
      );

      // Arrange correlativas finales
      jest
        .spyOn(service, 'verificarCorrelativasFinales')
        .mockResolvedValue({ cumple: false, faltantes: [] });

      // Act
      const result = await service.verificarInscripcionExamenFinal(1, 1);

      // Assert - el servicio refleja el resultado de correlativas finales
      expect(result).toEqual({ cumple: false, faltantes: [] });
    });

    it('should throw BadRequest when inscription missing or belongs to other student', async () => {
      // missing
      (mockInscripcionRepo.findOne as jest.Mock).mockResolvedValueOnce(null);
      await expect(service.verificarInscripcionExamenFinal(5, 99)).rejects.toThrow('Inscripción no encontrada o no pertenece al estudiante');
      // belongs to another
      (mockInscripcionRepo.findOne as jest.Mock).mockResolvedValueOnce({ id: 9, estudiante: { id: 2 }, materia: { id: 3 } } as any);
      await expect(service.verificarInscripcionExamenFinal(1, 9)).rejects.toThrow('Inscripción no encontrada o no pertenece al estudiante');
    });
  });
});
