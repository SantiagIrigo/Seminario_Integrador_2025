// src/examen/examen.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { ExamenService } from './examen.service';
import { TestDatabaseModule } from '../test-utils/test-database.module';
import { ExamenFinal } from './entities/examen.entity';
import { Materia } from '../materia/entities/materia.entity';
import { User } from '../user/entities/user.entity';
import { Inscripcion } from '../inscripcion/entities/inscripcion.entity';

describe('ExamenService', () => {
  let service: ExamenService;
  let mockExamenRepo: any;
  let mockMateriaRepo: any;
  let mockUserRepo: any;
  let mockInscripcionRepo: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TestDatabaseModule,
        TypeOrmModule.forFeature([ExamenFinal, Materia, User, Inscripcion]),
      ],
      providers: [
        ExamenService,
      ],
    }).compile();

    service = module.get<ExamenService>(ExamenService);
    mockExamenRepo = module.get(getRepositoryToken(ExamenFinal));
    mockMateriaRepo = module.get(getRepositoryToken(Materia));
    mockUserRepo = module.get(getRepositoryToken(User));
    mockInscripcionRepo = module.get(getRepositoryToken(Inscripcion));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Tests específicos para verificar funcionalidad sin conexión real
  describe('verificarCorrelativasFinal', () => {
    it('should return true when no final correlations required', async () => {
      // Arrange
      const estudianteId = 1;
      const materiaId = 1;
      
      const materia = {
        id: materiaId,
        nombre: 'Matemática',
        correlativasFinal: []
      };

      const estudiante = {
        id: estudianteId,
        nombre: 'Juan',
        apellido: 'Pérez'
      };

      // Mock de los repositorios
      jest.spyOn(mockMateriaRepo, 'findOne').mockResolvedValue(materia as any);
      jest.spyOn(mockUserRepo, 'findOne').mockResolvedValue(estudiante as any);

      // Act
      const result = await service['verificarCorrelativasFinal'](estudianteId, materiaId);

      // Assert
      expect(result).toEqual({ cumple: true, faltantes: [] });
      expect(mockMateriaRepo.findOne).toHaveBeenCalledWith({
        where: { id: materiaId },
        relations: ['correlativasFinal'],
      });
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({ where: { id: estudianteId } });
    });

    it('should return true when student meets all final correlations', async () => {
      // Arrange
      const estudianteId = 1;
      const materiaId = 1;
      
      const materia = {
        id: materiaId,
        nombre: 'Álgebra',
        correlativasFinal: [
          { id: 2, nombre: 'Matemática' }
        ]
      };

      const estudiante = {
        id: estudianteId,
        nombre: 'Juan',
        apellido: 'Pérez'
      };

      const inscripcion = {
        id: 1,
        stc: 'aprobada'
      };

      // Mock de los repositorios
      jest.spyOn(mockMateriaRepo, 'findOne').mockResolvedValue(materia as any);
      jest.spyOn(mockUserRepo, 'findOne').mockResolvedValue(estudiante as any);
      jest.spyOn(mockInscripcionRepo, 'findOne').mockResolvedValue(inscripcion as any);

      // Act
      const result = await service['verificarCorrelativasFinal'](estudianteId, materiaId);

      // Assert
      expect(result).toEqual({ cumple: true, faltantes: [] });
      expect(mockMateriaRepo.findOne).toHaveBeenCalledWith({
        where: { id: materiaId },
        relations: ['correlativasFinal'],
      });
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({ where: { id: estudianteId } });
      expect(mockInscripcionRepo.findOne).toHaveBeenCalledWith({
        where: {
          estudiante: { id: estudianteId },
          materia: { id: 2 },
        },
      });
    });

    it('should return false when student misses final correlations', async () => {
      // Arrange
      const estudianteId = 1;
      const materiaId = 1;
      
      const materia = {
        id: materiaId,
        nombre: 'Álgebra',
        correlativasFinal: [
          { id: 2, nombre: 'Matemática' }
        ]
      };

      const estudiante = {
        id: estudianteId,
        nombre: 'Juan',
        apellido: 'Pérez'
      };

      // Mock de los repositorios
      jest.spyOn(mockMateriaRepo, 'findOne').mockResolvedValue(materia as any);
      jest.spyOn(mockUserRepo, 'findOne').mockResolvedValue(estudiante as any);
      jest.spyOn(mockInscripcionRepo, 'findOne').mockResolvedValue(null);

      // Act
      const result = await service['verificarCorrelativasFinal'](estudianteId, materiaId);

      // Assert
      expect(result).toEqual({ 
        cumple: false, 
        faltantes: [{ id: 2, nombre: 'Matemática' }] 
      });
      expect(mockMateriaRepo.findOne).toHaveBeenCalledWith({
        where: { id: materiaId },
        relations: ['correlativasFinal'],
      });
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({ where: { id: estudianteId } });
      expect(mockInscripcionRepo.findOne).toHaveBeenCalledWith({
        where: {
          estudiante: { id: estudianteId },
          materia: { id: 2 },
        },
      });
    });
  });

  describe('inscribirse', () => {
    it('should inscribe student to final exam successfully', async () => {
      // Arrange
      const userId = 1;
      const materiaId = 1;
      
      const estudiante = {
        id: userId,
        nombre: 'Juan',
        apellido: 'Pérez'
      };

      const materia = {
        id: materiaId,
        nombre: 'Álgebra',
        correlativasFinal: []
      };

      const savedExamen = {
        id: 1,
        estudiante,
        materia,
        estado: 'inscripto'
      };

      // Mock de los repositorios
      jest.spyOn(mockUserRepo, 'findOne').mockResolvedValue(estudiante as any);
      jest.spyOn(mockMateriaRepo, 'findOne').mockResolvedValue(materia as any);
      jest.spyOn(mockExamenRepo, 'findOne').mockResolvedValue(null); // No inscrito previamente
      jest.spyOn(service as any, 'verificarCorrelativasFinal').mockResolvedValue({ cumple: true, faltantes: [] });
      jest.spyOn(mockExamenRepo, 'create').mockImplementation((data) => data);
      jest.spyOn(mockExamenRepo, 'save').mockResolvedValue(savedExamen as any);

      // Act
      const result = await service.inscribirse(userId, materiaId);

      // Assert
      expect(result).toEqual(savedExamen);
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(mockMateriaRepo.findOne).toHaveBeenCalledWith({ where: { id: materiaId } });
      expect(mockExamenRepo.findOne).toHaveBeenCalledWith({
        where: { estudiante: { id: userId }, materia: { id: materiaId } },
      });
      expect((service as any).verificarCorrelativasFinal).toHaveBeenCalledWith(userId, materiaId);
      expect(mockExamenRepo.save).toHaveBeenCalled();
    });

    it('should throw error when student already inscribed', async () => {
      // Arrange
      const userId = 1;
      const materiaId = 1;
      
      const estudiante = {
        id: userId,
        nombre: 'Juan',
        apellido: 'Pérez'
      };

      const materia = {
        id: materiaId,
        nombre: 'Álgebra'
      };

      const yaInscripto = {
        id: 1,
        estudiante,
        materia
      };

      // Mock de los repositorios
      jest.spyOn(mockUserRepo, 'findOne').mockResolvedValue(estudiante as any);
      jest.spyOn(mockMateriaRepo, 'findOne').mockResolvedValue(materia as any);
      jest.spyOn(mockExamenRepo, 'findOne').mockResolvedValue(yaInscripto as any);

      // Act & Assert
      await expect(service.inscribirse(userId, materiaId)).rejects.toThrow('Ya estás inscripto al examen final de esta materia');
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(mockMateriaRepo.findOne).toHaveBeenCalledWith({ where: { id: materiaId } });
      expect(mockExamenRepo.findOne).toHaveBeenCalledWith({
        where: { estudiante: { id: userId }, materia: { id: materiaId } },
      });
    });

    it('should throw error when student lacks final correlations', async () => {
      // Arrange
      const userId = 1;
      const materiaId = 1;
      
      const estudiante = {
        id: userId,
        nombre: 'Juan',
        apellido: 'Pérez'
      };

      const materia = {
        id: materiaId,
        nombre: 'Álgebra',
        correlativasFinal: [
          { id: 2, nombre: 'Matemática' }
        ]
      };

      // Mock de los repositorios
      jest.spyOn(mockUserRepo, 'findOne').mockResolvedValue(estudiante as any);
      jest.spyOn(mockMateriaRepo, 'findOne').mockResolvedValue(materia as any);
      jest.spyOn(mockExamenRepo, 'findOne').mockResolvedValue(null);
      jest.spyOn(service as any, 'verificarCorrelativasFinal').mockResolvedValue({ 
        cumple: false, 
        faltantes: [{ id: 2, nombre: 'Matemática' }] 
      });

      // Act & Assert
      await expect(service.inscribirse(userId, materiaId)).rejects.toThrow('No puedes rendir el final de esta materia. Faltan correlativas: Matemática');
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(mockMateriaRepo.findOne).toHaveBeenCalledWith({ where: { id: materiaId } });
      expect(mockExamenRepo.findOne).toHaveBeenCalledWith({
        where: { estudiante: { id: userId }, materia: { id: materiaId } },
      });
      expect((service as any).verificarCorrelativasFinal).toHaveBeenCalledWith(userId, materiaId);
    });

    it('should throw when student not found', async () => {
      jest.spyOn(mockUserRepo, 'findOne').mockResolvedValue(null);
      await expect(service.inscribirse(9, 1)).rejects.toThrow('Estudiante o materia no encontrados');
    });

    it('should throw when materia not found', async () => {
      jest.spyOn(mockUserRepo, 'findOne').mockResolvedValue({ id: 1 } as any);
      jest.spyOn(mockMateriaRepo, 'findOne').mockResolvedValue(null);
      await expect(service.inscribirse(1, 9)).rejects.toThrow('Estudiante o materia no encontrados');
    });
  });

  describe('esJefeDeCatedra', () => {
    it('should return true when user is department head', async () => {
      // Arrange
      const userId = 1;
      const examenId = 1;
      
      const examen = {
        id: examenId,
        materia: {
          id: 1,
          nombre: 'Álgebra',
          jefeCatedra: { id: userId }
        }
      };

      // Mock del repositorio
      jest.spyOn(mockExamenRepo, 'findOne').mockResolvedValue(examen as any);

      // Act
      const result = await service.esJefeDeCatedra(userId, examenId);

      // Assert
      expect(result).toBe(true);
      expect(mockExamenRepo.findOne).toHaveBeenCalledWith({
        where: { id: examenId },
        relations: ['materia', 'materia.jefeCatedra'],
      });
    });

    it('should return false when user is not department head', async () => {
      // Arrange
      const userId = 1;
      const examenId = 1;
      
      const examen = {
        id: examenId,
        materia: {
          id: 1,
          nombre: 'Álgebra',
          jefeCatedra: { id: 2 } // Diferente usuario
        }
      };

      // Mock del repositorio
      jest.spyOn(mockExamenRepo, 'findOne').mockResolvedValue(examen as any);

      // Act
      const result = await service.esJefeDeCatedra(userId, examenId);

      // Assert
      expect(result).toBe(false);
      expect(mockExamenRepo.findOne).toHaveBeenCalledWith({
        where: { id: examenId },
        relations: ['materia', 'materia.jefeCatedra'],
      });
    });

    it('should return false when examen not found', async () => {
      // Arrange
      const userId = 1;
      const examenId = 1;
      
      // Mock del repositorio
      jest.spyOn(mockExamenRepo, 'findOne').mockResolvedValue(null);

      // Act
      const result = await service.esJefeDeCatedra(userId, examenId);

      // Assert
      expect(result).toBe(false);
      expect(mockExamenRepo.findOne).toHaveBeenCalledWith({
        where: { id: examenId },
        relations: ['materia', 'materia.jefeCatedra'],
      });
    });
  });

  describe('cargarNota', () => {
    it('should load exam grade successfully', async () => {
      // Arrange
      const examenId = 1;
      const nota = 8;
      const estado = 'aprobado';
      
      const examen = {
        id: examenId,
        materia: { id: 1, nombre: 'Álgebra', jefeCatedra: { id: 1 } },
        estudiante: { id: 1, nombre: 'Juan' },
        nota: 0,
        estado: 'inscripto'
      };

      const updatedExamen = {
        ...examen,
        nota,
        estado
      };

      // Mock del repositorio
      jest.spyOn(mockExamenRepo, 'findOne').mockResolvedValue(examen as any);
      jest.spyOn(mockExamenRepo, 'save').mockResolvedValue(updatedExamen as any);

      // Act
      const result = await service.cargarNota(examenId, nota, estado);

      // Assert
      expect(result).toEqual(updatedExamen);
      expect(mockExamenRepo.findOne).toHaveBeenCalledWith({
        where: { id: examenId },
        relations: ['materia', 'materia.jefeCatedra', 'estudiante'],
      });
      expect(mockExamenRepo.save).toHaveBeenCalledWith({
        ...examen,
        nota,
        estado
      });
    });

    it('should throw error when grade is out of range', async () => {
      // Arrange
      const examenId = 1;
      const nota = 15; // Fuera del rango 0-10
      const estado = 'aprobado';

      jest.spyOn(mockExamenRepo, 'findOne').mockResolvedValue({
        id: examenId,
        materia: { id: 1, nombre: 'Álgebra', jefeCatedra: { id: 1 } },
        estudiante: { id: 1, nombre: 'Juan' },
        nota: 0,
        estado: 'inscripto',
      } as any);

      // Act & Assert
      await expect(service.cargarNota(examenId, nota, estado)).rejects.toThrow('La nota debe estar entre 0 y 10');
    });

    it('should throw error when examen not found', async () => {
      // Arrange
      const examenId = 1;
      const nota = 8;
      const estado = 'aprobado';

      // Mock del repositorio
      jest.spyOn(mockExamenRepo, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(service.cargarNota(examenId, nota, estado)).rejects.toThrow('Examen no encontrado');
      expect(mockExamenRepo.findOne).toHaveBeenCalledWith({
        where: { id: examenId },
        relations: ['materia', 'materia.jefeCatedra', 'estudiante'],
      });
    });
  });

  describe('verExamenes', () => {
    it('should return student exams', async () => {
      // Arrange
      const userId = 1;
      
      const examenes = [
        {
          id: 1,
          estudiante: { id: userId },
          materia: { id: 1, nombre: 'Álgebra' },
          estado: 'inscripto'
        }
      ];

      // Mock del repositorio
      jest.spyOn(mockExamenRepo, 'find').mockResolvedValue(examenes as any);

      // Act
      const result = await service.verExamenes(userId);

      // Assert
      expect(result).toEqual(examenes);
      expect(mockExamenRepo.find).toHaveBeenCalledWith({
        where: { estudiante: { id: userId } },
        relations: ['materia'],
        order: { id: 'DESC' },
      });
    });
  });
});