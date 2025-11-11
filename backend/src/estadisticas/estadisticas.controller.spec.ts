import { Test, TestingModule } from '@nestjs/testing';
import { EstadisticasController } from './estadisticas.controller';
import { EstadisticasService } from './estadisticas.service';

// Mock del servicio
const mockEstadisticasService = {
  obtenerEstadisticasEstudiante: jest.fn(),
  obtenerActividadReciente: jest.fn(),
  obtenerProximosEventos: jest.fn(),
};

// Mock del request
const mockRequest = {
  user: {
    id: 1,
    nombre: 'Juan Pérez',
    email: 'juan.perez@universidad.edu',
  },
};

describe('EstadisticasController', () => {
  let controller: EstadisticasController;
  let service: jest.Mocked<EstadisticasService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EstadisticasController],
      providers: [
        {
          provide: EstadisticasService,
          useValue: mockEstadisticasService,
        },
      ],
    }).compile();

    controller = module.get<EstadisticasController>(EstadisticasController);
    service = module.get(EstadisticasService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('obtenerEstadisticasEstudiante', () => {
    it('debe retornar estadísticas del estudiante autenticado', async () => {
      // Arrange
      const userId = 1;
      const mockStats = {
        totalMaterias: 25,
        materiasInscriptas: 4,
        asistenciaPromedio: 85,
        proximosExamenes: 2,
        proximosClases: 0,
      };

      service.obtenerEstadisticasEstudiante.mockResolvedValue(mockStats);

      // Act
      const result = await controller.obtenerEstadisticasEstudiante(mockRequest as any);

      // Assert
      expect(result).toEqual(mockStats);
      expect(service.obtenerEstadisticasEstudiante).toHaveBeenCalledWith(userId);
      expect(service.obtenerEstadisticasEstudiante).toHaveBeenCalledTimes(1);
    });

    it('debe devolver valores por defecto cuando el usuario no está autenticado', async () => {
      // Arrange
      const requestSinUsuario = { user: null };

      // Act
      const result = await controller.obtenerEstadisticasEstudiante(requestSinUsuario as any);

      // Assert
      expect(result).toEqual({
        totalMaterias: 0,
        materiasInscriptas: 0,
        asistenciaPromedio: 0,
        proximosExamenes: 0,
        proximosClases: 0,
      });
      expect(service.obtenerEstadisticasEstudiante).not.toHaveBeenCalled();
    });

    it('debe manejar errores del servicio correctamente', async () => {
      // Arrange
      const errorMessage = 'Error en la base de datos';
      service.obtenerEstadisticasEstudiante.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(controller.obtenerEstadisticasEstudiante(mockRequest as any))
        .rejects
        .toThrow(errorMessage);
    });
  });

  describe('obtenerActividadReciente', () => {
    it('debe retornar actividad reciente del estudiante autenticado', async () => {
      // Arrange
      const userId = 1;
      const mockActividad = [
        {
          fecha: new Date('2025-01-15T10:30:00'),
          hora: '10:30',
          accion: 'Inscripción a Análisis Matemático I',
          estado: 'activa',
        },
        {
          fecha: new Date('2025-01-15T09:00:00'),
          hora: '09:00',
          accion: 'Asistencia registrada - Física I',
          presente: true,
        },
      ];

      service.obtenerActividadReciente.mockResolvedValue(mockActividad);

      // Act
      const result = await controller.obtenerActividadReciente(mockRequest as any);

      // Assert
      expect(result).toEqual(mockActividad);
      expect(service.obtenerActividadReciente).toHaveBeenCalledWith(userId);
      expect(service.obtenerActividadReciente).toHaveBeenCalledTimes(1);
    });

    it('debe devolver lista vacía cuando el usuario no está autenticado', async () => {
      // Arrange
      const requestSinUsuario = { user: null };

      // Act
      const result = await controller.obtenerActividadReciente(requestSinUsuario as any);

      // Assert
      expect(result).toEqual([]);
      expect(service.obtenerActividadReciente).not.toHaveBeenCalled();
    });

    it('debe manejar errores del servicio correctamente', async () => {
      // Arrange
      const errorMessage = 'Error al obtener actividad reciente';
      service.obtenerActividadReciente.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(controller.obtenerActividadReciente(mockRequest as any))
        .rejects
        .toThrow(errorMessage);
    });

    it('debe pasar parámetros adicionales al servicio correctamente', async () => {
      // Arrange
      const limite = 5;
      const mockActividad = [];

      service.obtenerActividadReciente.mockResolvedValue(mockActividad);

      // Act
      await controller.obtenerActividadReciente(mockRequest as any);

      // Assert
      expect(service.obtenerActividadReciente).toHaveBeenCalledWith(1); // Solo userId, límite por defecto
    });
  });

  describe('obtenerProximosEventos', () => {
    it('debe retornar próximos eventos del estudiante autenticado', async () => {
      // Arrange
      const userId = 1;
      const mockEventos = [
        {
          titulo: 'Clase - Análisis Matemático I',
          fecha: 'LUNES',
          hora: '08:00',
          descripcion: 'Aula 101',
        },
        {
          titulo: 'Examen Final - Física I',
          fecha: '2025-01-20',
          hora: '14:00',
          descripcion: 'Aula Magna',
        },
      ];

      service.obtenerProximosEventos.mockResolvedValue(mockEventos);

      // Act
      const result = await controller.obtenerProximosEventos(mockRequest as any);

      // Assert
      expect(result).toEqual(mockEventos);
      expect(service.obtenerProximosEventos).toHaveBeenCalledWith(userId);
      expect(service.obtenerProximosEventos).toHaveBeenCalledTimes(1);
    });

    it('debe devolver lista vacía cuando el usuario no está autenticado', async () => {
      // Arrange
      const requestSinUsuario = { user: null };

      // Act
      const result = await controller.obtenerProximosEventos(requestSinUsuario as any);

      // Assert
      expect(result).toEqual([]);
      expect(service.obtenerProximosEventos).not.toHaveBeenCalled();
    });

    it('debe manejar errores del servicio correctamente', async () => {
      // Arrange
      const errorMessage = 'Error al obtener eventos próximos';
      service.obtenerProximosEventos.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(controller.obtenerProximosEventos(mockRequest as any))
        .rejects
        .toThrow(errorMessage);
    });

    it('debe pasar parámetros adicionales al servicio correctamente', async () => {
      // Arrange
      const limite = 3;
      const mockEventos = [];

      service.obtenerProximosEventos.mockResolvedValue(mockEventos);

      // Act
      await controller.obtenerProximosEventos(mockRequest as any);

      // Assert
      expect(service.obtenerProximosEventos).toHaveBeenCalledWith(1); // Solo userId, límite por defecto
    });
  });

  describe('Integración de endpoints', () => {
    it('todos los endpoints deben usar correctamente el servicio', async () => {
      // Arrange
      const mockStats = { totalMaterias: 10, materiasInscriptas: 3, asistenciaPromedio: 80, proximosExamenes: 1, proximosClases: 0 };
      const mockActividad = [{ fecha: new Date(), hora: '10:00', accion: 'Test' }];
      const mockEventos = [{ titulo: 'Evento de prueba', fecha: '2025-01-01', hora: '09:00', descripcion: 'Test' }];

      service.obtenerEstadisticasEstudiante.mockResolvedValue(mockStats);
      service.obtenerActividadReciente.mockResolvedValue(mockActividad);
      service.obtenerProximosEventos.mockResolvedValue(mockEventos);

      // Act
      const statsResult = await controller.obtenerEstadisticasEstudiante(mockRequest as any);
      const actividadResult = await controller.obtenerActividadReciente(mockRequest as any);
      const eventosResult = await controller.obtenerProximosEventos(mockRequest as any);

      // Assert
      expect(statsResult).toEqual(mockStats);
      expect(actividadResult).toEqual(mockActividad);
      expect(eventosResult).toEqual(mockEventos);

      expect(service.obtenerEstadisticasEstudiante).toHaveBeenCalledWith(1);
      expect(service.obtenerActividadReciente).toHaveBeenCalledWith(1);
      expect(service.obtenerProximosEventos).toHaveBeenCalledWith(1);
    });

    it('debe manejar errores consistentes en todos los endpoints', async () => {
      // Arrange
      const errorMessage = 'Error de servicio';
      service.obtenerEstadisticasEstudiante.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(controller.obtenerEstadisticasEstudiante(mockRequest as any))
        .rejects
        .toThrow(errorMessage);

      // Verificar que otros servicios no fueron llamados
      expect(service.obtenerActividadReciente).not.toHaveBeenCalled();
      expect(service.obtenerProximosEventos).not.toHaveBeenCalled();
    });
  });

  describe('Casos edge', () => {
    it('debe manejar userId como 0 correctamente', async () => {
      // Arrange
      const requestConUserIdCero = { user: { id: 0 } };

      // Act
      const result = await controller.obtenerEstadisticasEstudiante(requestConUserIdCero as any);

      // Assert
      expect(result).toEqual({
        totalMaterias: 0,
        materiasInscriptas: 0,
        asistenciaPromedio: 0,
        proximosExamenes: 0,
        proximosClases: 0,
      });
      expect(service.obtenerEstadisticasEstudiante).not.toHaveBeenCalled();
    });

    it('debe manejar userId negativo correctamente', async () => {
      // Arrange
      const requestConUserIdNegativo = { user: { id: -1 } };
      const mockStats = { totalMaterias: 0, materiasInscriptas: 0, asistenciaPromedio: 0, proximosExamenes: 0, proximosClases: 0 };

      service.obtenerEstadisticasEstudiante.mockResolvedValue(mockStats);

      // Act
      const result = await controller.obtenerEstadisticasEstudiante(requestConUserIdNegativo as any);

      // Assert
      expect(result).toEqual(mockStats);
      expect(service.obtenerEstadisticasEstudiante).toHaveBeenCalledWith(-1);
    });

    it('debe manejar respuestas vacías del servicio correctamente', async () => {
      // Arrange
      service.obtenerActividadReciente.mockResolvedValue([]);
      service.obtenerProximosEventos.mockResolvedValue([]);

      // Act
      const actividadResult = await controller.obtenerActividadReciente(mockRequest as any);
      const eventosResult = await controller.obtenerProximosEventos(mockRequest as any);

      // Assert
      expect(actividadResult).toEqual([]);
      expect(eventosResult).toEqual([]);
    });
  });
});
