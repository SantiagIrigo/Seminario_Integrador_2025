// src/evaluacion/evaluacion.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { EvaluacionService } from './evaluacion.service';
import { TestDatabaseModule } from '../test-utils/test-database.module';
import { Evaluacion } from './entities/evaluacion.entity';
import { Materia } from '../materia/entities/materia.entity';
import { User } from '../user/entities/user.entity';
import { Inscripcion } from '../inscripcion/entities/inscripcion.entity';
import { TipoEvaluacion, EstadoEvaluacion } from './entities/evaluacion.entity';

describe('EvaluacionService', () => {
  let service: EvaluacionService;
  let mockEvaluacionRepo: any;
  let mockUserRepo: any;
  let mockInscripcionRepo: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TestDatabaseModule,
        TypeOrmModule.forFeature([Evaluacion, Materia, User, Inscripcion]),
      ],
      providers: [
        EvaluacionService,
      ],
    }).compile();

    service = module.get<EvaluacionService>(EvaluacionService);
    mockEvaluacionRepo = module.get(getRepositoryToken(Evaluacion));
    mockUserRepo = module.get(getRepositoryToken(User));
    mockInscripcionRepo = module.get(getRepositoryToken(Inscripcion));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Tests específicos para verificar funcionalidad sin conexión real
  describe('crearEvaluacion', () => {
    it('should create an evaluation successfully', async () => {
      // Arrange
      const materiaId = 1;
      const estudianteId = 1;
      const cargadoPorId = 2;
      
      const inscripcion = {
        id: 1,
        materia: { id: materiaId },
        estudiante: { id: estudianteId }
      };

      const estudiante = {
        id: estudianteId,
        nombre: 'Juan',
        apellido: 'Pérez'
      };

      const evaluacionData = {
        materiaId,
        estudianteId,
        tipo: TipoEvaluacion.PARCIAL,
        nota: 8,
        titulo: 'Parcial 1',
        observaciones: 'Buen trabajo',
        cargadoPorId
      };

      const savedEvaluacion = {
        id: 1,
        ...evaluacionData,
        estado: EstadoEvaluacion.APROBADA,
        inscripcion: { id: 1 },
        materia: { id: materiaId },
        estudiante: { id: estudianteId },
        cargadoPor: { id: cargadoPorId }
      };

      // Mock de los repositorios
      jest.spyOn(mockInscripcionRepo, 'findOne').mockResolvedValue(inscripcion as any);
      jest.spyOn(mockUserRepo, 'findOne').mockResolvedValue(estudiante as any);
      jest.spyOn(mockEvaluacionRepo, 'create').mockImplementation((data) => data);
      jest.spyOn(mockEvaluacionRepo, 'save').mockResolvedValue(savedEvaluacion as any);

      // Act
      const result = await service.crearEvaluacion(
        materiaId,
        estudianteId,
        evaluacionData.tipo,
        evaluacionData.nota,
        evaluacionData.titulo,
        evaluacionData.observaciones,
        evaluacionData.cargadoPorId
      );

      // Assert
      expect(result).toEqual(savedEvaluacion);
      expect(mockInscripcionRepo.findOne).toHaveBeenCalledWith({
        where: { materia: { id: materiaId }, estudiante: { id: estudianteId } },
      });
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({ where: { id: estudianteId } });
      expect(mockEvaluacionRepo.save).toHaveBeenCalled();
    });

    it('should throw error when student is not enrolled in subject', async () => {
      // Arrange
      const materiaId = 1;
      const estudianteId = 1;
      
      // Mock de los repositorios
      jest.spyOn(mockInscripcionRepo, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(service.crearEvaluacion(
        materiaId,
        estudianteId,
        TipoEvaluacion.PARCIAL,
        8
      )).rejects.toThrow('El estudiante no está inscripto a esta materia');
      
      expect(mockInscripcionRepo.findOne).toHaveBeenCalledWith({
        where: { materia: { id: materiaId }, estudiante: { id: estudianteId } },
      });
    });

    it('should throw error when student not found', async () => {
      // Arrange
      const materiaId = 1;
      const estudianteId = 1;
      
      const inscripcion = {
        id: 1,
        materia: { id: materiaId },
        estudiante: { id: estudianteId }
      };

      // Mock de los repositorios
      jest.spyOn(mockInscripcionRepo, 'findOne').mockResolvedValue(inscripcion as any);
      jest.spyOn(mockUserRepo, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(service.crearEvaluacion(
        materiaId,
        estudianteId,
        TipoEvaluacion.PARCIAL,
        8
      )).rejects.toThrow('Estudiante no encontrado');
      
      expect(mockInscripcionRepo.findOne).toHaveBeenCalledWith({
        where: { materia: { id: materiaId }, estudiante: { id: estudianteId } },
      });
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({ where: { id: estudianteId } });
    });

    it('should set estado DESAPROBADA and omit cargadoPor when nota < 6', async () => {
      const materiaId = 1;
      const estudianteId = 2;
      jest.spyOn(mockInscripcionRepo, 'findOne').mockResolvedValue({ id: 7 } as any);
      jest.spyOn(mockUserRepo, 'findOne').mockResolvedValue({ id: estudianteId } as any);
      jest.spyOn(mockEvaluacionRepo, 'create').mockImplementation((d) => d);
      jest.spyOn(mockEvaluacionRepo, 'save').mockResolvedValue({ id: 22 } as any);
      const res = await service.crearEvaluacion(materiaId, estudianteId, TipoEvaluacion.PARCIAL, 4);
      expect(res).toEqual({ id: 22 });
      expect(mockEvaluacionRepo.create).toHaveBeenCalledWith(expect.objectContaining({ estado: EstadoEvaluacion.DESAPROBADA, cargadoPor: undefined }));
    });
  });

  describe('getEvaluacionesPorMateria', () => {
    it('should return evaluations by subject', async () => {
      // Arrange
      const materiaId = 1;
      
      const evaluaciones = [
        {
          id: 1,
          tipo: TipoEvaluacion.PARCIAL,
          nota: 8,
          estado: EstadoEvaluacion.APROBADA,
          estudiante: { id: 1, nombre: 'Juan', apellido: 'Pérez' },
          inscripcion: { id: 1 },
          cargadoPor: { id: 2 }
        }
      ];

      // Mock del repositorio
      jest.spyOn(mockEvaluacionRepo, 'find').mockResolvedValue(evaluaciones as any);

      // Act
      const result = await service.getEvaluacionesPorMateria(materiaId);

      // Assert
      expect(result).toEqual(evaluaciones);
      expect(mockEvaluacionRepo.find).toHaveBeenCalledWith({
        where: { materia: { id: materiaId } },
        relations: ['estudiante', 'inscripcion', 'cargadoPor'],
        order: { fecha: 'ASC' },
      });
    });
  });

  describe('getEvaluacionesPorEstudiante', () => {
    it('should return evaluations by student and subject', async () => {
      // Arrange
      const estudianteId = 1;
      const materiaId = 1;
      
      const evaluaciones = [
        {
          id: 1,
          tipo: TipoEvaluacion.PARCIAL,
          nota: 8,
          estado: EstadoEvaluacion.APROBADA
        }
      ];

      // Mock del repositorio
      jest.spyOn(mockEvaluacionRepo, 'find').mockResolvedValue(evaluaciones as any);

      // Act
      const result = await service.getEvaluacionesPorEstudiante(estudianteId, materiaId);

      // Assert
      expect(result).toEqual(evaluaciones);
      expect(mockEvaluacionRepo.find).toHaveBeenCalledWith({
        where: { 
          estudiante: { id: estudianteId }, 
          materia: { id: materiaId } 
        },
        order: { fecha: 'ASC' },
      });
    });
  });
});