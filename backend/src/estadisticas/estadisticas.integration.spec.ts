import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstadisticasService } from './estadisticas.service';
import { User } from '../user/entities/user.entity';
import { Inscripcion } from '../inscripcion/entities/inscripcion.entity';
import { MateriaPlanEstudio } from '../materia/entities/materia-plan-estudio.entity';
import { Asistencia, EstadoAsistencia } from '../asistencia/entities/asistencia.entity';
import { ExamenFinal } from '../examen-final/entities/examen-final.entity';

describe('EstadisticasService - Casos Extremos y Errores', () => {
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

  describe('Casos de Error en obtenerEstadisticasEstudiante', () => {
    it('debe manejar errores de base de datos correctamente', async () => {
      // Arrange
      const userId = 1;
      userRepository.findOne.mockRejectedValue(new Error('Error de conexión a BD'));

      // Act
      const result = await service.obtenerEstadisticasEstudiante(userId);

      // Assert - Ahora retorna valores por defecto en vez de lanzar
      expect(result).toEqual({
        totalMaterias: 0,
        materiasInscriptas: 0,
        asistenciaPromedio: 0,
        proximosExamenes: 0,
        proximosClases: 0,
      });
    });

    it('debe manejar errores en consultas de repositorios', async () => {
      // Arrange
      const userId = 1;
      const mockUser = {
        id: 1,
        planEstudio: { id: 1 },
      } as any;

      userRepository.findOne.mockResolvedValue(mockUser);
      materiaPlanRepository.count.mockRejectedValue(new Error('Error en consulta de materias'));

      // Act
      const result = await service.obtenerEstadisticasEstudiante(userId);

      // Assert - Valores por defecto
      expect(result).toEqual({
        totalMaterias: 0,
        materiasInscriptas: 0,
        asistenciaPromedio: 0,
        proximosExamenes: 0,
        proximosClases: 0,
      });
    });

    it('debe manejar datos inconsistentes en asistencias', async () => {
      // Arrange
      const userId = 1;
      const mockUser = {
        id: 1,
        planEstudio: { id: 1 },
      } as any;

      userRepository.findOne.mockResolvedValue(mockUser);
      materiaPlanRepository.count.mockResolvedValue(10);
      inscripcionRepository.count.mockResolvedValue(2);

      // Asistencias con estado inválido
      asistenciaRepository.find.mockResolvedValue([
        { estado: 'INVALIDO' } as any,
        { estado: EstadoAsistencia.PRESENTE } as any,
      ]);

      examenFinalRepository.count.mockResolvedValue(1);

      // Act
      const result = await service.obtenerEstadisticasEstudiante(userId);

      // Assert - Solo debe contar las asistencias con estado PRESENTE válido
      expect(result.asistenciaPromedio).toBe(50); // 1 presente de 2 = 50%
    });

    it('debe manejar fechas inválidas en exámenes finales', async () => {
      // Arrange
      const userId = 1;
      const mockUser = {
        id: 1,
        planEstudio: { id: 1 },
      } as any;

      userRepository.findOne.mockResolvedValue(mockUser);
      materiaPlanRepository.count.mockResolvedValue(5);
      inscripcionRepository.count.mockResolvedValue(1);
      asistenciaRepository.find.mockResolvedValue([]);
      examenFinalRepository.count.mockResolvedValue(0);

      // Act
      const result = await service.obtenerEstadisticasEstudiante(userId);

      // Assert
      expect(result.proximosExamenes).toBe(0);
      expect(result).toEqual({
        totalMaterias: 5,
        materiasInscriptas: 1,
        asistenciaPromedio: 0,
        proximosExamenes: 0,
        proximosClases: 0,
      });
    });
  });

  describe('Casos de Error en obtenerActividadReciente', () => {
    it('debe manejar errores en consultas de inscripciones', async () => {
      // Arrange
      const userId = 1;
      inscripcionRepository.find.mockRejectedValue(new Error('Error en consulta de inscripciones'));

      // Act
      const result = await service.obtenerActividadReciente(userId);

      // Assert - Retorna [] en errores
      expect(result).toEqual([]);
    });

    it('debe manejar errores en consultas de asistencias', async () => {
      // Arrange
      const userId = 1;
      inscripcionRepository.find.mockResolvedValue([]);
      asistenciaRepository.find.mockRejectedValue(new Error('Error en consulta de asistencias'));

      // Act
      const result = await service.obtenerActividadReciente(userId);

      // Assert
      expect(result).toEqual([]);
    });

    it('debe manejar datos de inscripciones mal formateados', async () => {
      // Arrange
      const userId = 1;
      const inscripcionMalFormateada = {
        fechaInscripcion: 'fecha-inválida',
      } as any;

      inscripcionRepository.find.mockResolvedValue([inscripcionMalFormateada]);
      asistenciaRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.obtenerActividadReciente(userId);

      // Assert - Ahora retorna [] en caso de errores en el formateo
      expect(result).toEqual([]);
    });

    it('debe manejar datos de asistencias mal formateados', async () => {
      // Arrange
      const userId = 1;
      inscripcionRepository.find.mockResolvedValue([]);
      const asistenciaMalFormateada = {
        fechaRegistro: 'fecha-inválida',
        clase: { materia: { nombre: 'Materia X' } },
        estado: EstadoAsistencia.PRESENTE,
      } as any;

      asistenciaRepository.find.mockResolvedValue([asistenciaMalFormateada]);

      // Act
      const result = await service.obtenerActividadReciente(userId);

      // Assert - Debe manejar el dato y continuar
      expect(result).toHaveLength(1);
      expect(result[0].fecha).toBeInstanceOf(Date);
    });
  });

  describe('Casos de Error en obtenerProximosEventos', () => {
    it('debe manejar errores en consultas de inscripciones con horarios', async () => {
      // Arrange
      const userId = 1;
      inscripcionRepository.find.mockRejectedValue(new Error('Error en consulta de inscripciones'));

      // Act
      const result = await service.obtenerProximosEventos(userId);

      // Assert - ahora retorna [] en errores
      expect(result).toEqual([]);
    });

    it('debe manejar errores en consultas de exámenes finales', async () => {
      // Arrange
      const userId = 1;
      inscripcionRepository.find.mockResolvedValue([]);
      examenFinalRepository.find.mockRejectedValue(new Error('Error en consulta de exámenes'));

      // Act
      const result = await service.obtenerProximosEventos(userId);

      // Assert
      expect(result).toEqual([]);
    });

    it('debe manejar horarios mal formateados', async () => {
      // Arrange
      const userId = 1;
      const inscripcionConHorarioInvalido = {
        materia: { nombre: 'Materia Horario' },
        comision: {
          horarios: [
            {
              dia: 'DIA_INVALIDO',
              horaInicio: 'hora-inválida',
              aula: 'Aula 101',
            },
          ],
        },
      } as any;

      inscripcionRepository.find.mockResolvedValue([inscripcionConHorarioInvalido] as any);
      examenFinalRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.obtenerProximosEventos(userId);

      // Assert - Debe incluir el evento con datos originales
      expect(result).toHaveLength(1);
      expect(result[0].fecha).toBe('DIA_INVALIDO');
    });

    it('debe manejar exámenes finales mal formateados', async () => {
      // Arrange
      const userId = 1;
      inscripcionRepository.find.mockResolvedValue([]);
      const examenFinalMalFormateado = {
        fecha: 'fecha-inválida',
        horaInicioTeorico: 'hora-inválida',
        aulaTeorico: 'Aula Magna',
        materia: { nombre: 'Materia Final' },
      } as any;

      examenFinalRepository.find.mockResolvedValue([examenFinalMalFormateado]);

      // Act
      const result = await service.obtenerProximosEventos(userId);

      // Assert - Debe incluir el evento con datos originales
      expect(result).toHaveLength(1);
      expect(result[0].fecha).toBe('fecha-inválida');
    });
  });

  describe('Casos Extremos de Datos', () => {
    it('debe manejar límite cero correctamente', async () => {
      // Arrange
      const userId = 1;
      inscripcionRepository.find.mockResolvedValue([]);
      asistenciaRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.obtenerActividadReciente(userId, 0);

      // Assert
      expect(result).toEqual([]);
    });

    it('debe manejar límite negativo correctamente', async () => {
      // Arrange
      const userId = 1;
      inscripcionRepository.find.mockResolvedValue([]);
      asistenciaRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.obtenerActividadReciente(userId, -5);

      // Assert
      expect(result).toEqual([]);
    });

    it('debe manejar userId muy grande correctamente', async () => {
      // Arrange
      const userId = Number.MAX_SAFE_INTEGER;
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

    it('debe manejar fechas muy antiguas correctamente', async () => {
      // Arrange
      const userId = 1;
      const inscripcionAntigua = {
        fechaInscripcion: new Date('1900-01-01T00:00:00'),
        materia: { nombre: 'Historia' },
        notaFinal: null,
      } as any;

      inscripcionRepository.find.mockResolvedValue([inscripcionAntigua]);
      asistenciaRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.obtenerActividadReciente(userId);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].fecha).toBeInstanceOf(Date);
    });

    it('debe manejar fechas futuras correctamente', async () => {
      // Arrange
      const userId = 1;
      const fechaFutura = new Date();
      fechaFutura.setFullYear(fechaFutura.getFullYear() + 100);

      const inscripcionFutura = {
        fechaInscripcion: fechaFutura,
        materia: { nombre: 'Futurología' },
        notaFinal: null,
      } as any;

      inscripcionRepository.find.mockResolvedValue([inscripcionFutura]);
      asistenciaRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.obtenerActividadReciente(userId);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].fecha).toBeInstanceOf(Date);
    });
  });

  describe('Casos de Concurrencia', () => {
    it('debe manejar múltiples llamadas simultáneas correctamente', async () => {
      // Arrange
      const userId = 1;
      const mockUser = { id: 1, planEstudio: { id: 1 } } as any;

      userRepository.findOne.mockResolvedValue(mockUser);
      materiaPlanRepository.count.mockResolvedValue(10);
      inscripcionRepository.count.mockResolvedValue(2);
      asistenciaRepository.find.mockResolvedValue([]);
      examenFinalRepository.count.mockResolvedValue(1);

      // Act - Múltiples llamadas simultáneas
      const promises = [
        service.obtenerEstadisticasEstudiante(userId),
        service.obtenerEstadisticasEstudiante(userId),
        service.obtenerEstadisticasEstudiante(userId),
      ];

      const results = await Promise.all(promises);

      // Assert
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toEqual({
          totalMaterias: 10,
          materiasInscriptas: 2,
          asistenciaPromedio: 0,
          proximosExamenes: 1,
          proximosClases: 0,
        });
      });

      // Verificar que las consultas se ejecutaron correctamente
      expect(userRepository.findOne).toHaveBeenCalledTimes(3);
      expect(materiaPlanRepository.count).toHaveBeenCalledTimes(3);
      expect(inscripcionRepository.count).toHaveBeenCalledTimes(3);
      expect(asistenciaRepository.find).toHaveBeenCalledTimes(3);
      expect(examenFinalRepository.count).toHaveBeenCalledTimes(3);
    });
  });
});
