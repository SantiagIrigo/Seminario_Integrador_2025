import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstadisticasService } from './estadisticas.service';
import { User } from '../user/entities/user.entity';
import { Inscripcion } from '../inscripcion/entities/inscripcion.entity';
import { MateriaPlanEstudio } from '../materia/entities/materia-plan-estudio.entity';
import { Asistencia, EstadoAsistencia } from '../asistencia/entities/asistencia.entity';
import { ExamenFinal } from '../examen-final/entities/examen-final.entity';

// Mocks de entidades
export const mockUser: User = {
  id: 1,
  nombre: 'Juan',
  apellido: 'Pérez',
  email: 'juan.perez@universidad.edu',
  password: 'hashedpassword',
  legajo: 'EST001',
  dni: '12345678',
  rol: 'estudiante' as any,
  createdAt: new Date(),
  inscripciones: [],
  materiasDictadas: [],
  evaluacionesRecibidas: [],
  examenes: [],
  examenesFinales: [],
  horariosDictados: [],
  asistencias: [],
  clasesDictadas: [],
  planEstudio: {
    id: 1,
    nombre: 'Plan 2025',
    descripcion: 'Plan de estudios 2025',
    año: 2025,
    carrera: {
      id: 1,
      nombre: 'Ingeniería en Sistemas',
      descripcion: 'Carrera de Ingeniería en Sistemas',
    } as any,
  } as any,
};

export const mockMateria = {
  id: 1,
  nombre: 'Análisis Matemático I',
  descripcion: 'Materia básica de matemáticas',
};

export const mockInscripcion: Inscripcion = {
  id: 1,
  estudiante: mockUser,
  materia: mockMateria as any,
  comision: undefined,
  faltas: 0,
  notaFinal: undefined as any,
  stc: 'Aprobado',
  planEstudio: mockUser.planEstudio,
  fechaInscripcion: new Date(),
  fechaFinalizacion: new Date(),
  evaluaciones: [],
  examenesInscritos: [],
};

export const mockMateriaPlanEstudio: MateriaPlanEstudio = {
  id: 1,
  materiaId: 1,
  planEstudioId: 1,
  nivel: 1,
} as unknown as MateriaPlanEstudio;

export const mockAsistencia: Asistencia = {
  id: 1,
  clase: {
    id: 1,
    nombre: 'Clase 1',
    materia: mockMateria as any,
  } as any,
  estudiante: mockUser,
  estado: EstadoAsistencia.PRESENTE,
motivoJustificacion: undefined,
  fechaRegistro: new Date(),
};

export const mockExamenFinal: ExamenFinal = {
  id: 1,
  materia: mockMateria as any,
  docente: undefined as any,
  fecha: new Date(),
  horaInicioTeorico: '10:00',
  horaFinTeorico: '12:00',
  aulaTeorico: 'Aula 1',
  inscripciones: [],
} as unknown as ExamenFinal;

describe('EstadisticasService', () => {
  let service: EstadisticasService;
  let userRepository: jest.Mocked<Repository<User>>;
  let inscripcionRepository: jest.Mocked<Repository<Inscripcion>>;
  let materiaPlanRepository: jest.Mocked<Repository<MateriaPlanEstudio>>;
  let asistenciaRepository: jest.Mocked<Repository<Asistencia>>;
  let examenFinalRepository: jest.Mocked<Repository<ExamenFinal>>;

  beforeEach(async () => {
    const mockUserRepository = {
      findOne: jest.fn(),
    };

    const mockInscripcionRepository = {
      count: jest.fn(),
      find: jest.fn(),
    };

    const mockMateriaPlanRepository = {
      count: jest.fn(),
    };

    const mockAsistenciaRepository = {
      find: jest.fn(),
    };

    const mockExamenFinalRepository = {
      count: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EstadisticasService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Inscripcion),
          useValue: mockInscripcionRepository,
        },
        {
          provide: getRepositoryToken(MateriaPlanEstudio),
          useValue: mockMateriaPlanRepository,
        },
        {
          provide: getRepositoryToken(Asistencia),
          useValue: mockAsistenciaRepository,
        },
        {
          provide: getRepositoryToken(ExamenFinal),
          useValue: mockExamenFinalRepository,
        },
      ],
    }).compile();

    service = module.get<EstadisticasService>(EstadisticasService);
    userRepository = module.get(getRepositoryToken(User));
    inscripcionRepository = module.get(getRepositoryToken(Inscripcion));
    materiaPlanRepository = module.get(getRepositoryToken(MateriaPlanEstudio));
    asistenciaRepository = module.get(getRepositoryToken(Asistencia));
    examenFinalRepository = module.get(getRepositoryToken(ExamenFinal));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('obtenerEstadisticasEstudiante', () => {
    it('debe retornar estadísticas correctas para un estudiante válido', async () => {
      // Arrange
      const userId = 1;
      const fechaDesde = new Date();

      userRepository.findOne.mockResolvedValue(mockUser);
      materiaPlanRepository.count.mockResolvedValue(25);
      inscripcionRepository.count.mockResolvedValue(4);
      asistenciaRepository.find.mockResolvedValue([
        { ...mockAsistencia, estado: EstadoAsistencia.PRESENTE },
        { ...mockAsistencia, estado: EstadoAsistencia.AUSENTE },
        { ...mockAsistencia, estado: EstadoAsistencia.PRESENTE },
      ]);
      examenFinalRepository.count.mockResolvedValue(2);

      // Act
      const result = await service.obtenerEstadisticasEstudiante(userId);

      // Assert
      expect(result).toEqual({
        totalMaterias: 25,
        materiasInscriptas: 4,
        asistenciaPromedio: 67, // 2 presentes de 3 = 67%
        proximosExamenes: 2,
        proximosClases: 0,
      });

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
        relations: ['planEstudio'],
      });
      expect(materiaPlanRepository.count).toHaveBeenCalledWith({
        where: { planEstudioId: mockUser.planEstudio!.id },
      });
      expect(inscripcionRepository.count).toHaveBeenCalledWith({
        where: { estudiante: { id: userId } },
      });
      expect(asistenciaRepository.find).toHaveBeenCalledWith({
        where: { estudiante: { id: userId } },
        relations: ['clase'],
      });
      expect(examenFinalRepository.count).toHaveBeenCalledWith({
        where: { fecha: expect.any(Object) },
      });
    });

    it('debe retornar estadísticas en cero cuando el usuario no existe', async () => {
      // Arrange
      const userId = 999;
      userRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.obtenerEstadisticasEstudiante(userId);

      // Assert
      expect(result).toEqual({
        totalMaterias: 0,
        materiasInscriptas: 0,
        asistenciaPromedio: 0,
        proximosExamenes: 0,
        proximosClases: 0,
      });
    });

    it('debe retornar estadísticas en cero cuando el usuario no tiene plan de estudios', async () => {
      // Arrange
      const userId = 1;
      const userSinPlan = { ...mockUser, planEstudio: undefined };
      userRepository.findOne.mockResolvedValue(userSinPlan as any);

      // Act
      const result = await service.obtenerEstadisticasEstudiante(userId);

      // Assert
      expect(result).toEqual({
        totalMaterias: 0,
        materiasInscriptas: 0,
        asistenciaPromedio: 0,
        proximosExamenes: 0,
        proximosClases: 0,
      });
    });

    it('debe calcular correctamente el promedio de asistencia', async () => {
      // Arrange
      const userId = 1;
      userRepository.findOne.mockResolvedValue(mockUser);
      materiaPlanRepository.count.mockResolvedValue(10);
      inscripcionRepository.count.mockResolvedValue(2);

      // 5 asistencias: 3 presentes, 2 ausentes = 60%
      asistenciaRepository.find.mockResolvedValue([
        { ...mockAsistencia, estado: EstadoAsistencia.PRESENTE },
        { ...mockAsistencia, estado: EstadoAsistencia.AUSENTE },
        { ...mockAsistencia, estado: EstadoAsistencia.PRESENTE },
        { ...mockAsistencia, estado: EstadoAsistencia.AUSENTE },
        { ...mockAsistencia, estado: EstadoAsistencia.PRESENTE },
      ]);

      examenFinalRepository.count.mockResolvedValue(1);

      // Act
      const result = await service.obtenerEstadisticasEstudiante(userId);

      // Assert
      expect(result.asistenciaPromedio).toBe(60);
    });

    it('debe manejar correctamente cuando no hay asistencias registradas', async () => {
      // Arrange
      const userId = 1;
      userRepository.findOne.mockResolvedValue(mockUser);
      materiaPlanRepository.count.mockResolvedValue(5);
      inscripcionRepository.count.mockResolvedValue(1);
      asistenciaRepository.find.mockResolvedValue([]);
      examenFinalRepository.count.mockResolvedValue(0);

      // Act
      const result = await service.obtenerEstadisticasEstudiante(userId);

      // Assert
      expect(result.asistenciaPromedio).toBe(0);
      expect(result.totalMaterias).toBe(5);
      expect(result.materiasInscriptas).toBe(1);
      expect(result.proximosExamenes).toBe(0);
    });

    it('debe retornar valores por defecto cuando userId es falsy', async () => {
      const result = await service.obtenerEstadisticasEstudiante(0 as any);
      expect(result).toEqual({
        totalMaterias: 0,
        materiasInscriptas: 0,
        asistenciaPromedio: 0,
        proximosExamenes: 0,
        proximosClases: 0,
      });
    });
  });

  describe('obtenerActividadReciente', () => {
    it('debe retornar actividades recientes correctamente', async () => {
      // Arrange
      const userId = 1;
      const limite = 5;

      const inscripcionesRecientes = [
        {
          ...mockInscripcion,
          fechaInscripcion: new Date('2025-01-15T10:30:00'),
        },
        {
          ...mockInscripcion,
          id: 2,
          fechaInscripcion: new Date('2025-01-14T14:15:00'),
        },
      ];

      const asistenciasRecientes = [
        {
          ...mockAsistencia,
          fechaRegistro: new Date('2025-01-15T09:00:00'),
        },
        {
          ...mockAsistencia,
          id: 2,
          fechaRegistro: new Date('2025-01-14T16:30:00'),
        },
      ];

      inscripcionRepository.find.mockResolvedValue(inscripcionesRecientes as any);
      asistenciaRepository.find.mockResolvedValue(asistenciasRecientes as any);

      // Act
      const result = await service.obtenerActividadReciente(userId, limite);

      // Assert
      expect(result).toHaveLength(4); // 2 inscripciones + 2 asistencias
      expect(result[0].accion).toContain('Inscripción a');
      expect(result[1].accion).toContain('Asistencia registrada');
      expect(inscripcionRepository.find).toHaveBeenCalledWith({
        where: { estudiante: { id: userId } },
        relations: ['materia'],
        order: { fechaInscripcion: 'DESC' },
        take: limite,
      });
      expect(asistenciaRepository.find).toHaveBeenCalledWith({
        where: { estudiante: { id: userId } },
        relations: ['clase', 'clase.materia'],
        order: { fechaRegistro: 'DESC' },
        take: limite,
      });
    });

    it('debe limitar correctamente la cantidad de actividades retornadas', async () => {
      // Arrange
      const userId = 1;
      const limite = 2;

      inscripcionRepository.find.mockResolvedValue([
        mockInscripcion,
        { ...mockInscripcion, id: 2 },
        { ...mockInscripcion, id: 3 },
      ] as any);

      asistenciaRepository.find.mockResolvedValue([
        mockAsistencia,
        { ...mockAsistencia, id: 2 },
      ] as any);

      // Act
      const result = await service.obtenerActividadReciente(userId, limite);

      // Assert
      expect(result).toHaveLength(2); // Debe respetar el límite
    });

    it('debe retornar array vacío cuando no hay actividades', async () => {
      // Arrange
      const userId = 1;
      inscripcionRepository.find.mockResolvedValue([]);
      asistenciaRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.obtenerActividadReciente(userId);

      // Assert
      expect(result).toEqual([]);
    });

    it('debe retornar [] si userId es falsy', async () => {
      const result = await service.obtenerActividadReciente(0 as any);
      expect(result).toEqual([]);
    });
  });

  describe('obtenerProximosEventos', () => {
    it('debe retornar eventos próximos correctamente', async () => {
      // Arrange
      const userId = 1;
      const limite = 3;

      const inscripcionesConHorarios = [
        {
          ...mockInscripcion,
          comision: {
            id: 1,
            horarios: [
              {
                dia: 'LUNES',
                horaInicio: '08:00',
                aula: 'Aula 101',
              },
              {
                dia: 'MIERCOLES',
                horaInicio: '10:00',
                aula: 'Aula 102',
              },
            ],
          },
        },
      ];

      const examenesFinalesProximos = [
        {
          ...mockExamenFinal,
          fecha: '2025-01-20',
          horaInicioTeorico: '14:00',
          aulaTeorico: 'Aula Magna',
        },
      ];

      inscripcionRepository.find.mockResolvedValue(inscripcionesConHorarios as any);
      examenFinalRepository.find.mockResolvedValue(examenesFinalesProximos as any);

      // Act
      const result = await service.obtenerProximosEventos(userId, limite);

      // Assert
      expect(result).toHaveLength(3); // 2 clases + 1 examen
      expect(result[0].titulo).toContain('Clase');
      expect(result[2].titulo).toContain('Examen Final');
      expect(inscripcionRepository.find).toHaveBeenCalledWith({
        where: { estudiante: { id: userId } },
        relations: ['materia', 'comision', 'comision.horarios'],
      });
      expect(examenFinalRepository.find).toHaveBeenCalledWith({
        where: { fecha: expect.any(Object) },
        relations: ['materia', 'inscripcionesExamenFinal'],
        order: { fecha: 'ASC' },
      });
    });

    it('debe limitar correctamente la cantidad de eventos retornados', async () => {
      // Arrange
      const userId = 1;
      const limite = 1;

      inscripcionRepository.find.mockResolvedValue([
        {
          ...mockInscripcion,
          comision: {
            horarios: [
              { dia: 'LUNES', horaInicio: '08:00', aula: 'Aula 101' },
              { dia: 'MARTES', horaInicio: '10:00', aula: 'Aula 102' },
            ],
          },
        },
      ] as any);

      examenFinalRepository.find.mockResolvedValue([
        mockExamenFinal,
        { ...mockExamenFinal, id: 2 },
      ] as any);

      // Act
      const result = await service.obtenerProximosEventos(userId, limite);

      // Assert
      expect(result).toHaveLength(1); // Debe respetar el límite
    });

    it('debe manejar correctamente cuando no hay eventos próximos', async () => {
      // Arrange
      const userId = 1;
      inscripcionRepository.find.mockResolvedValue([]);
      examenFinalRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.obtenerProximosEventos(userId);

      // Assert
      expect(result).toEqual([]);
    });

    it('debe retornar [] si userId es falsy', async () => {
      const result = await service.obtenerProximosEventos(0 as any);
      expect(result).toEqual([]);
    });
  });
});
