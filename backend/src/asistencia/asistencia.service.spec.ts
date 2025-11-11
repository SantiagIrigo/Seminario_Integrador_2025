// src/asistencia/asistencia.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { AsistenciaService } from './asistencia.service';
import { TestDatabaseModule } from '../test-utils/test-database.module';
import { Asistencia } from './entities/asistencia.entity';
import { Clase } from '../clase/entities/clase.entity';
import { User } from '../user/entities/user.entity';
import { Inscripcion } from '../inscripcion/entities/inscripcion.entity';
import { EstadoAsistencia } from './entities/asistencia.entity';

describe('AsistenciaService', () => {
  let service: AsistenciaService;
  let mockAsistenciaRepo: any;
  let mockClaseRepo: any;
  let mockUserRepo: any;
  let mockInscripcionRepo: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TestDatabaseModule,
        TypeOrmModule.forFeature([Asistencia, Clase, User, Inscripcion]),
      ],
      providers: [
        AsistenciaService,
      ],
    }).compile();

    service = module.get<AsistenciaService>(AsistenciaService);
    mockAsistenciaRepo = module.get(getRepositoryToken(Asistencia));
    mockClaseRepo = module.get(getRepositoryToken(Clase));
    mockUserRepo = module.get(getRepositoryToken(User));
    mockInscripcionRepo = module.get(getRepositoryToken(Inscripcion));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Test básico para verificar que el servicio se puede crear
  // Este test evita timeouts y errores de dependencias
  it('should initialize without dependency errors', () => {
    expect(service).toBeDefined();
  });

  // Tests adicionales para verificar funcionalidad específica
  describe('registrarAsistencia', () => {
    it('should register attendance correctly', async () => {
      // Mock de los repositorios para evitar conexión a DB
      jest.spyOn(mockClaseRepo, 'findOne').mockResolvedValue({
        id: 1,
        estado: 'realizada',
        materia: {
          id: 1,
          inscripciones: [
            { estudiante: { id: 1 } }
          ]
        }
      });
      
      jest.spyOn(mockUserRepo, 'findOne').mockResolvedValue({
        id: 1,
        nombre: 'Juan',
        apellido: 'Pérez'
      });
      
      jest.spyOn(mockAsistenciaRepo, 'findOne').mockResolvedValue(null);
      jest.spyOn(mockAsistenciaRepo, 'create').mockImplementation((data) => data);
      jest.spyOn(mockAsistenciaRepo, 'save').mockResolvedValue({
        id: 1,
        clase: { id: 1 },
        estudiante: { id: 1 },
        estado: 'presente'
      });

      const result = await service.registrarAsistencia(1, 1, EstadoAsistencia.PRESENTE);
      
      expect(result).toBeDefined();
      expect(mockClaseRepo.findOne).toHaveBeenCalled();
      expect(mockUserRepo.findOne).toHaveBeenCalled();
    });

    it('should throw when clase not found', async () => {
      jest.spyOn(mockClaseRepo, 'findOne').mockResolvedValue(null);
      await expect(service.registrarAsistencia(1, 1, EstadoAsistencia.PRESENTE)).rejects.toThrow('Clase no encontrada');
    });

    it('should throw when clase not REALIZADA', async () => {
      jest.spyOn(mockClaseRepo, 'findOne').mockResolvedValue({ id: 1, estado: 'programada', materia: { inscripciones: [] } });
      await expect(service.registrarAsistencia(1, 1, EstadoAsistencia.PRESENTE)).rejects.toThrow('La clase debe estar en estado REALIZADA para registrar asistencia');
    });

    it('should forbid when user is not docente', async () => {
      jest.spyOn(mockClaseRepo, 'findOne').mockResolvedValue({ id: 1, estado: 'realizada', docente: { id: 99 }, materia: { inscripciones: [{ estudiante: { id: 1 } }] } });
      jest.spyOn(mockUserRepo, 'findOne').mockResolvedValue({ id: 1 });
      await expect(service.registrarAsistencia(1, 1, EstadoAsistencia.PRESENTE, undefined, 5, 'profesor' as any)).rejects.toThrow('Solo el docente de la clase puede registrar asistencia');
    });

    it('should throw when estudiante not enrolled', async () => {
      jest.spyOn(mockClaseRepo, 'findOne').mockResolvedValue({ id: 1, estado: 'realizada', docente: { id: 5 }, materia: { inscripciones: [{ estudiante: { id: 2 } }] } });
      jest.spyOn(mockUserRepo, 'findOne').mockResolvedValue({ id: 1 });
      await expect(service.registrarAsistencia(1, 1, EstadoAsistencia.PRESENTE, undefined, 5, 'profesor' as any)).rejects.toThrow('El estudiante no está inscripto en esta materia');
    });

    it('should update existing attendance', async () => {
      jest.spyOn(mockClaseRepo, 'findOne').mockResolvedValue({ id: 1, estado: 'realizada', docente: { id: 5 }, materia: { inscripciones: [{ estudiante: { id: 1 } }] } });
      jest.spyOn(mockUserRepo, 'findOne').mockResolvedValue({ id: 1 });
      jest.spyOn(mockAsistenciaRepo, 'findOne').mockResolvedValue({ id: 10, estado: 'ausente' });
      jest.spyOn(mockAsistenciaRepo, 'save').mockResolvedValue({ id: 10, estado: 'presente' });
      const result = await service.registrarAsistencia(1, 1, EstadoAsistencia.PRESENTE, undefined, 5, 'profesor' as any);
      expect(result).toBeDefined();
      expect(mockAsistenciaRepo.save).toHaveBeenCalled();
    });
  });

  describe('obtenerResumenAsistencias', () => {
    it('should return grouped summary by materia when no materiaId provided', async () => {
      jest.spyOn(mockAsistenciaRepo, 'find').mockResolvedValue([
        { estado: EstadoAsistencia.PRESENTE, clase: { materia: { id: 1 } } },
        { estado: EstadoAsistencia.AUSENTE, clase: { materia: { id: 1 } } },
        { estado: EstadoAsistencia.JUSTIFICADA, clase: { materia: { id: 2 } } },
      ]);
      const result = await service.obtenerResumenAsistencias(1);
      expect(result.total).toBe(3);
      expect(result.porMateria?.[1].total).toBe(2);
      expect(result.porMateria?.[2].justificadas).toBe(1);
    });

    it('should filter by materiaId when provided', async () => {
      jest.spyOn(mockAsistenciaRepo, 'find').mockResolvedValue([
        { estado: EstadoAsistencia.PRESENTE, clase: { materia: { id: 9 } } },
      ]);
      const result = await service.obtenerResumenAsistencias(1, 9);
      expect(result.total).toBe(1);
      expect(result.porMateria).toBeUndefined();
    });
  });

  describe('obtenerAsistenciasPorClase', () => {
    it('should return attendances by class', async () => {
      jest.spyOn(mockAsistenciaRepo, 'find').mockResolvedValue([]);
      
      const result = await service.obtenerAsistenciasPorClase(1);
      
      expect(result).toBeDefined();
      expect(mockAsistenciaRepo.find).toHaveBeenCalled();
    });
  });

  describe('obtenerAsistenciasPorEstudiante', () => {
    it('should return attendances by student', async () => {
      jest.spyOn(mockAsistenciaRepo, 'find').mockResolvedValue([]);
      
      const result = await service.obtenerAsistenciasPorEstudiante(1);
      
      expect(result).toBeDefined();
      expect(mockAsistenciaRepo.find).toHaveBeenCalled();
    });
  });

  describe('obtenerResumenAsistencias', () => {
    it('should return attendance summary', async () => {
      jest.spyOn(mockAsistenciaRepo, 'find').mockResolvedValue([]);
      
      const result = await service.obtenerResumenAsistencias(1);
      
      expect(result).toBeDefined();
      expect(mockAsistenciaRepo.find).toHaveBeenCalled();
    });
  });
});