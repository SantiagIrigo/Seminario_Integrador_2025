// src/inscripcion-examen/inscripcion-examen.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { InscripcionExamenService } from './inscripcion-examen.service';
import { TestDatabaseModule } from '../test-utils/test-database.module';
import { InscripcionExamen } from './entities/inscripcion-examen.entity';
import { Inscripcion } from '../inscripcion/entities/inscripcion.entity';
import { ExamenFinal } from '../examen-final/entities/examen-final.entity';
import { CorrelativasService } from '../correlativas/correlativas.service';
import { CreateInscripcionExamenDto } from './dto/create-inscripcion-examen.dto';
import { UpdateInscripcionExamenDto } from './dto/update-inscripcion-examen.dto';

describe('InscripcionExamenService', () => {
  let service: InscripcionExamenService;
  let mockInscripcionExamenRepo: any;
  let mockInscripcionRepo: any;
  let mockExamenRepo: any;
  let mockCorrelativasService: Partial<CorrelativasService>;

  beforeEach(async () => {
    mockCorrelativasService = {
      verificarInscripcionExamenFinal: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TestDatabaseModule,
        TypeOrmModule.forFeature([
          InscripcionExamen, 
          Inscripcion, 
          ExamenFinal
        ]),
      ],
      providers: [
        InscripcionExamenService,
        {
          provide: CorrelativasService,
          useValue: mockCorrelativasService,
        },
      ],
    }).compile();

    service = module.get<InscripcionExamenService>(InscripcionExamenService);
    mockInscripcionExamenRepo = module.get(getRepositoryToken(InscripcionExamen));
    mockInscripcionRepo = module.get(getRepositoryToken(Inscripcion));
    mockExamenRepo = module.get(getRepositoryToken(ExamenFinal));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Tests específicos para verificar funcionalidad sin conexión real
  describe('inscribirse', () => {
    it('should enroll student to final exam successfully', async () => {
      // Arrange
      const dto: CreateInscripcionExamenDto = {
        inscripcionId: 1,
        examenId: 1,
        estado: 'inscripto',
        nota: 8
      };

      const inscripcion = {
        id: 1,
        estudiante: { id: 1 },
        materia: { id: 1 },
        stc: 'cursada'
      };

      const examen = {
        id: 1,
        materia: { id: 1 },
        cupo: 30,
        inscriptos: 0,
      } as any;

      const savedInscripcionExamen = {
        id: 1,
        inscripcion,
        examenFinal: examen,
        estado: 'inscripto',
        nota: 8
      } as any;

      // Mock de los repositorios
      jest.spyOn(mockInscripcionRepo, 'findOne').mockResolvedValue(inscripcion as any);
      jest.spyOn(mockExamenRepo, 'findOne').mockResolvedValue(examen as any);
jest.spyOn(mockCorrelativasService, 'verificarInscripcionExamenFinal').mockResolvedValue({ 
        cumple: true, 
        faltantes: []
      });
      jest.spyOn(mockInscripcionExamenRepo, 'findOne').mockResolvedValue(null); // No inscrito previamente
      jest.spyOn(mockInscripcionExamenRepo, 'create').mockImplementation((data) => data);
      jest.spyOn(mockInscripcionExamenRepo, 'save').mockResolvedValue(savedInscripcionExamen as any);
      jest.spyOn(mockExamenRepo, 'update').mockResolvedValue({} as any);

      // Act
      const result = await service.inscribirse(dto);

      // Assert
      expect(result).toEqual(savedInscripcionExamen);
      expect(mockInscripcionRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['materia', 'estudiante']
      });
      expect(mockExamenRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['materia']
      });
      expect(mockCorrelativasService.verificarInscripcionExamenFinal).toHaveBeenCalledWith(1, 1);
      expect(mockInscripcionExamenRepo.findOne).toHaveBeenCalledWith({
        where: { inscripcion: { id: 1 }, examenFinal: { id: 1 } }
      });
      expect(mockInscripcionExamenRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when inscription not found', async () => {
      // Arrange
      const dto: CreateInscripcionExamenDto = {
        inscripcionId: 1,
        examenId: 1
      };

      // Mock de los repositorios
      jest.spyOn(mockInscripcionRepo, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(service.inscribirse(dto)).rejects.toThrow('Inscripción no encontrada');
      expect(mockInscripcionRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['materia', 'estudiante']
      });
    });

    it('should throw NotFoundException when exam not found', async () => {
      // Arrange
      const dto: CreateInscripcionExamenDto = {
        inscripcionId: 1,
        examenId: 1
      };

      const inscripcion = {
        id: 1,
        estudiante: { id: 1 },
        materia: { id: 1 },
        stc: 'cursada'
      };

      // Mock de los repositorios
      jest.spyOn(mockInscripcionRepo, 'findOne').mockResolvedValue(inscripcion as any);
      jest.spyOn(mockExamenRepo, 'findOne').mockResolvedValue(null);
      jest.spyOn(mockExamenRepo, 'update').mockResolvedValue({} as any);

      // Act & Assert
      await expect(service.inscribirse(dto)).rejects.toThrow('Examen final no encontrado');
      expect(mockInscripcionRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['materia', 'estudiante']
      });
      expect(mockExamenRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['materia']
      });
    });

    it('should throw BadRequestException when subject mismatches between inscripcion and examen', async () => {
      // Arrange
      const dto: CreateInscripcionExamenDto = {
        inscripcionId: 1,
        examenId: 1
      };

      const inscripcion = {
        id: 1,
        estudiante: { id: 1 },
        materia: { id: 1 },
        stc: 'cursada'
      };

      const examen = {
        id: 1,
        materia: { id: 2 }, // materia distinta
        cupo: 30,
        inscriptos: 0,
      } as any;

      // Mock de los repositorios
      jest.spyOn(mockInscripcionRepo, 'findOne').mockResolvedValue(inscripcion as any);
      jest.spyOn(mockExamenRepo, 'findOne').mockResolvedValue(examen as any);

      // Act & Assert
      await expect(service.inscribirse(dto)).rejects.toThrow('La inscripción no corresponde a la materia del examen');
      expect(mockInscripcionRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['materia', 'estudiante']
      });
      expect(mockExamenRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['materia']
      });
    });

    it('should throw BadRequestException when prerequisites not met', async () => {
      // Arrange
      const dto: CreateInscripcionExamenDto = {
        inscripcionId: 1,
        examenId: 1
      };

      const inscripcion = {
        id: 1,
        estudiante: { id: 1 },
        materia: { id: 1 },
        stc: 'cursada'
      };

      const examen = {
        id: 1,
        materia: { id: 1 },
        cupo: 30,
        inscriptos: 0,
      } as any;

      // Mock de los repositorios
      jest.spyOn(mockInscripcionRepo, 'findOne').mockResolvedValue(inscripcion as any);
      jest.spyOn(mockExamenRepo, 'findOne').mockResolvedValue(examen as any);
jest.spyOn(mockCorrelativasService, 'verificarInscripcionExamenFinal').mockResolvedValue({ 
        cumple: false, 
        faltantes: [{ id: 1, nombre: 'Matemática' }]
      });

      // Act & Assert
await expect(service.inscribirse(dto)).rejects.toThrow('No cumple correlativas para examen final: Matemática');
      expect(mockInscripcionRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['materia', 'estudiante']
      });
      expect(mockExamenRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['materia']
      });
      expect(mockCorrelativasService.verificarInscripcionExamenFinal).toHaveBeenCalledWith(1, 1);
    });

    it('should throw BadRequestException when student has not completed course', async () => {
      // Arrange
      const dto: CreateInscripcionExamenDto = {
        inscripcionId: 1,
        examenId: 1
      };

      const inscripcion = {
        id: 1,
        estudiante: { id: 1 },
        materia: { id: 1 },
        stc: 'pendiente' // No ha cursado la materia
      };

      const examen = {
        id: 1,
        materia: { id: 1 },
        cupo: 30,
        inscriptos: 0,
      } as any;

      // Mock de los repositorios
      jest.spyOn(mockInscripcionRepo, 'findOne').mockResolvedValue(inscripcion as any);
      jest.spyOn(mockExamenRepo, 'findOne').mockResolvedValue(examen as any);
jest.spyOn(mockCorrelativasService, 'verificarInscripcionExamenFinal').mockResolvedValue({ 
        cumple: true, 
        faltantes: []
      });

      // Act & Assert
      await expect(service.inscribirse(dto)).rejects.toThrow('No puedes inscribirte a examen final si no has cursado la materia');
      expect(mockInscripcionRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['materia', 'estudiante']
      });
      expect(mockExamenRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['materia']
      });
      expect(mockCorrelativasService.verificarInscripcionExamenFinal).toHaveBeenCalledWith(1, 1);
    });

    it('should throw BadRequestException when already enrolled', async () => {
      // Arrange
      const dto: CreateInscripcionExamenDto = {
        inscripcionId: 1,
        examenId: 1
      };

      const inscripcion = {
        id: 1,
        estudiante: { id: 1 },
        materia: { id: 1 },
        stc: 'cursada'
      };

      const examen = {
        id: 1,
        materia: { id: 1 },
        cupo: 30,
        inscriptos: 0,
      } as any;

      const yaInscripto = {
        id: 1,
        inscripcion,
        examenFinal: examen
      } as any;

      // Mock de los repositorios
      jest.spyOn(mockInscripcionRepo, 'findOne').mockResolvedValue(inscripcion as any);
      jest.spyOn(mockExamenRepo, 'findOne').mockResolvedValue(examen as any);
      jest.spyOn(mockCorrelativasService, 'verificarInscripcionExamenFinal').mockResolvedValue({ 
        cumple: true,
        faltantes: []
      });
      jest.spyOn(mockInscripcionExamenRepo, 'findOne').mockResolvedValue(yaInscripto as any);

      // Act & Assert
      await expect(service.inscribirse(dto)).rejects.toThrow('Ya estás inscripto a este examen final');
      expect(mockInscripcionRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['materia', 'estudiante']
      });
      expect(mockExamenRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['materia']
      });
      expect(mockCorrelativasService.verificarInscripcionExamenFinal).toHaveBeenCalledWith(1, 1);
      expect(mockInscripcionExamenRepo.findOne).toHaveBeenCalledWith({
        where: { inscripcion: { id: 1 }, examenFinal: { id: 1 } }
      });
    });

    it('should default estado to "inscripto" when not provided', async () => {
      const dto: CreateInscripcionExamenDto = { inscripcionId: 1, examenId: 2 } as any;
      const inscripcion = { id: 1, estudiante: { id: 1 }, materia: { id: 1 }, stc: 'cursada' };
      const examen = { id: 2, materia: { id: 1 }, cupo: 30, inscriptos: 0 } as any;
      jest.spyOn(mockInscripcionRepo, 'findOne').mockResolvedValue(inscripcion as any);
      jest.spyOn(mockExamenRepo, 'findOne').mockResolvedValue(examen as any);
      jest.spyOn(mockCorrelativasService, 'verificarInscripcionExamenFinal').mockResolvedValue({ cumple: true, faltantes: [] } as any);
      jest.spyOn(mockInscripcionExamenRepo, 'findOne').mockResolvedValue(null);
      jest.spyOn(mockInscripcionExamenRepo, 'create').mockImplementation((d) => d);
      jest.spyOn(mockInscripcionExamenRepo, 'save').mockResolvedValue({ id: 99, estado: 'inscripto' } as any);
      const res = await service.inscribirse(dto);
      expect(res).toEqual({ id: 99, estado: 'inscripto' });
    });

  });
  describe('obtenerInscripcionesPorEstudiante', () => {
    it('should return student exam enrollments', async () => {
      // Arrange
      const estudianteId = 1;
      
      const inscripciones = [
        {
          id: 1,
          inscripcion: { id: 1, estudiante: { id: estudianteId } },
          examenFinal: { id: 1, materia: { id: 1 } }
        }
      ];

      // Mock del repositorio
      jest.spyOn(mockInscripcionExamenRepo, 'find').mockResolvedValue(inscripciones as any);

      // Act
      const result = await service.obtenerInscripcionesPorEstudiante(estudianteId);

      // Assert
      expect(result).toEqual(inscripciones);
      expect(mockInscripcionExamenRepo.find).toHaveBeenCalledWith({
        where: { 
          inscripcion: { estudiante: { id: estudianteId } } 
        },
        relations: ['examenFinal', 'inscripcion', 'examenFinal.materia', 'examenFinal.docente'],
        order: { examenFinal: { id: 'DESC' } }
      });
    });
  });

  describe('obtenerInscripcionesPorMateria', () => {
    it('should return exam enrollments by subject', async () => {
      // Arrange
      const materiaId = 1;
      
      const inscripciones = [
        {
          id: 1,
          inscripcion: { id: 1 },
          examenFinal: { id: 1, materia: { id: materiaId } }
        }
      ];

      // Mock del repositorio
      jest.spyOn(mockInscripcionExamenRepo, 'find').mockResolvedValue(inscripciones as any);

      // Act
      const result = await service.obtenerInscripcionesPorMateria(materiaId);

      // Assert
      expect(result).toEqual(inscripciones);
      expect(mockInscripcionExamenRepo.find).toHaveBeenCalledWith({
        where: { 
          examenFinal: { materia: { id: materiaId } } 
        },
        relations: ['examenFinal', 'inscripcion'],
        order: { examenFinal: { id: 'DESC' } }
      });
    });
  });

  describe('obtenerInscripcionesPorExamen', () => {
    it('should return exam enrollments', async () => {
      // Arrange
      const examenId = 1;
      
      const inscripciones = [
        {
          id: 1,
          inscripcion: { id: 1 },
          examenFinal: { id: examenId }
        }
      ];

      // Mock del repositorio
      jest.spyOn(mockInscripcionExamenRepo, 'find').mockResolvedValue(inscripciones as any);

      // Act
      const result = await service.obtenerInscripcionesPorExamen(examenId);

      // Assert
      expect(result).toEqual(inscripciones);
      expect(mockInscripcionExamenRepo.find).toHaveBeenCalledWith({
        where: { examenFinal: { id: examenId } },
        relations: ['inscripcion', 'examenFinal'],
        order: { inscripcion: { id: 'ASC' } }
      });
    });
  });

  describe('actualizarEstado', () => {
    it('should update exam enrollment status', async () => {
      // Arrange
      const inscripcionExamenId = 1;
      const dto: UpdateInscripcionExamenDto = {
        estado: 'aprobado',
        nota: 9
      };

      const inscripcionExamen = {
        id: inscripcionExamenId,
        inscripcion: { id: 1 },
        examenFinal: { id: 1 },
        estado: 'inscripto',
        nota: 8
      };

      const updatedInscripcionExamen = {
        ...inscripcionExamen,
        ...dto
      };

      // Mock del repositorio
      jest.spyOn(mockInscripcionExamenRepo, 'findOne').mockResolvedValue(inscripcionExamen as any);
      jest.spyOn(mockInscripcionExamenRepo, 'save').mockResolvedValue(updatedInscripcionExamen as any);

      // Act
      const result = await service.actualizarEstado(inscripcionExamenId, dto);

      // Assert
      expect(result).toEqual(updatedInscripcionExamen);
      expect(mockInscripcionExamenRepo.findOne).toHaveBeenCalledWith({
        where: { id: inscripcionExamenId },
        relations: ['examenFinal']
      });
      expect(mockInscripcionExamenRepo.save).toHaveBeenCalledWith({
        ...inscripcionExamen,
        ...dto
      });
    });

    it('should throw NotFoundException when exam enrollment not found', async () => {
      // Arrange
      const inscripcionExamenId = 1;
      const dto: UpdateInscripcionExamenDto = {
        estado: 'aprobado'
      };

      // Mock del repositorio
      jest.spyOn(mockInscripcionExamenRepo, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(service.actualizarEstado(inscripcionExamenId, dto)).rejects.toThrow('Inscripción a examen no encontrada');
      expect(mockInscripcionExamenRepo.findOne).toHaveBeenCalledWith({
        where: { id: inscripcionExamenId },
        relations: ['examenFinal']
      });
    });
  });

  describe('removerInscripcion', () => {
    it('should remove exam enrollment', async () => {
      // Arrange
      const inscripcionExamenId = 1;
      
      const inscripcionExamen = {
        id: inscripcionExamenId,
        inscripcion: { id: 1 },
        examenFinal: { id: 1 }
      };

      // Mock del repositorio
      jest.spyOn(mockInscripcionExamenRepo, 'findOne').mockResolvedValue(inscripcionExamen as any);
      jest.spyOn(mockInscripcionExamenRepo, 'delete').mockResolvedValue(undefined as any);
      jest.spyOn(mockExamenRepo, 'update').mockResolvedValue({} as any);

      // Act
      await service.removerInscripcion(inscripcionExamenId);

      // Assert
      expect(mockInscripcionExamenRepo.findOne).toHaveBeenCalledWith({
        where: { id: inscripcionExamenId },
        relations: ['examenFinal']
      });
      expect(mockInscripcionExamenRepo.delete).toHaveBeenCalledWith(inscripcionExamenId);
    });

    it('should throw NotFoundException when exam enrollment not found', async () => {
      // Arrange
      const inscripcionExamenId = 1;
      
      // Mock del repositorio
      jest.spyOn(mockInscripcionExamenRepo, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(service.removerInscripcion(inscripcionExamenId)).rejects.toThrow('Inscripción a examen no encontrada');
      expect(mockInscripcionExamenRepo.findOne).toHaveBeenCalledWith({
        where: { id: inscripcionExamenId },
        relations: ['examenFinal']
      });
    });
  });

  describe('removerInscripcionDeEstudiante', () => {
    it('should forbid when student does not own the inscription', async () => {
      const inscripcionExamenId = 10;
      const estudianteId = 99; // distinto del dueño
      const inscripcionExamen = {
        id: inscripcionExamenId,
        inscripcion: { estudiante: { id: 1 } },
        examenFinal: { id: 5, inscriptos: 2 },
      } as any;

      jest.spyOn(mockInscripcionExamenRepo, 'findOne').mockResolvedValue(inscripcionExamen);

      await expect(
        service.removerInscripcionDeEstudiante(inscripcionExamenId, estudianteId),
      ).rejects.toThrow('No puede cancelar una inscripción que no es suya');
    });

    it('should remove when student owns the inscription and decrement exam count', async () => {
      const inscripcionExamenId = 11;
      const estudianteId = 7;
      const inscripcionExamen = {
        id: inscripcionExamenId,
        inscripcion: { estudiante: { id: estudianteId } },
        examenFinal: { id: 6, inscriptos: 3 },
      } as any;

      jest.spyOn(mockInscripcionExamenRepo, 'findOne').mockResolvedValue(inscripcionExamen);
      jest.spyOn(mockInscripcionExamenRepo, 'delete').mockResolvedValue({} as any);
      jest.spyOn(mockExamenRepo, 'update').mockResolvedValue({} as any);

      await service.removerInscripcionDeEstudiante(inscripcionExamenId, estudianteId);

      expect(mockInscripcionExamenRepo.findOne).toHaveBeenCalled();
      expect(mockInscripcionExamenRepo.delete).toHaveBeenCalledWith(inscripcionExamenId);
      expect(mockExamenRepo.update).toHaveBeenCalledWith(6, { inscriptos: 2 });
    });
  });
});
