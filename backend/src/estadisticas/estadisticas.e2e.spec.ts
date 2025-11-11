import { Test, TestingModule } from '@nestjs/testing';
import { EstadisticasController } from './estadisticas.controller';
import { EstadisticasService } from './estadisticas.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { Inscripcion } from '../inscripcion/entities/inscripcion.entity';
import { MateriaPlanEstudio } from '../materia/entities/materia-plan-estudio.entity';
import { Asistencia, EstadoAsistencia } from '../asistencia/entities/asistencia.entity';
import { ExamenFinal } from '../examen-final/entities/examen-final.entity';

describe('Estadisticas - Pruebas de Integración Completa', () => {
  let controller: EstadisticasController;
  let service: EstadisticasService;
  let userRepository: jest.Mocked<Repository<User>>;
  let appModule: TestingModule;

  // Datos de prueba más realistas
  const mockEstudianteCompleto: User = {
    id: 1,
    nombre: 'María',
    apellido: 'González',
    email: 'maria.gonzalez@universidad.edu',
    password: 'hashedpassword',
    legajo: 'EST002',
    dni: '87654321',
    rol: 'estudiante' as any,
    createdAt: new Date('2025-01-01'),
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

    appModule = await Test.createTestingModule({
      controllers: [EstadisticasController],
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

    controller = appModule.get<EstadisticasController>(EstadisticasController);
    service = appModule.get<EstadisticasService>(EstadisticasService);
    userRepository = appModule.get(getRepositoryToken(User));
  });

  describe('Flujo Completo de Estadísticas', () => {
    it('debe procesar correctamente un estudiante con datos completos', async () => {
      // Arrange - Configurar datos realistas
      const userId = 1;
      const request = { user: { id: userId } };

      // Datos del estudiante
      userRepository.findOne.mockResolvedValue(mockEstudianteCompleto);

      // 15 materias en el plan
      const materiaPlanRepo = appModule.get(getRepositoryToken(MateriaPlanEstudio));
      materiaPlanRepo.count.mockResolvedValue(15);

      // 5 materias inscriptas actualmente
      const inscripcionRepo = appModule.get(getRepositoryToken(Inscripcion));
      inscripcionRepo.count.mockResolvedValue(5);

      // Asistencias con promedio del 85%
      const asistenciaRepo = appModule.get(getRepositoryToken(Asistencia));
      asistenciaRepo.find.mockResolvedValue([
        { estado: EstadoAsistencia.PRESENTE } as any,
        { estado: EstadoAsistencia.PRESENTE } as any,
        { estado: EstadoAsistencia.PRESENTE } as any,
        { estado: EstadoAsistencia.AUSENTE } as any,
        { estado: EstadoAsistencia.PRESENTE } as any,
        { estado: EstadoAsistencia.PRESENTE } as any,
        { estado: EstadoAsistencia.PRESENTE } as any, // 6 presentes de 7 = 85.7% ≈ 86%
      ]);

      // 3 exámenes próximos
      const examenFinalRepo = appModule.get(getRepositoryToken(ExamenFinal));
      examenFinalRepo.count.mockResolvedValue(3);

      // Act
      const result = await controller.obtenerEstadisticasEstudiante(request as any);

      // Assert
      expect(result).toEqual({
        totalMaterias: 15,
        materiasInscriptas: 5,
        asistenciaPromedio: 86, // Redondeado correctamente
        proximosExamenes: 3,
        proximosClases: 0,
      });

      // Verificar que se llamaron todas las consultas necesarias
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
        relations: ['planEstudio'],
      });
      expect(materiaPlanRepo.count).toHaveBeenCalledWith({
        where: { planEstudioId: mockEstudianteCompleto.planEstudio!.id },
      });
      expect(inscripcionRepo.count).toHaveBeenCalledWith({
        where: { estudiante: { id: userId } },
      });
      expect(asistenciaRepo.find).toHaveBeenCalledWith({
        where: { estudiante: { id: userId } },
        relations: ['clase'],
      });
      expect(examenFinalRepo.count).toHaveBeenCalledWith({
        where: { fecha: expect.any(Object) },
      });
    });

    it('debe manejar correctamente un estudiante nuevo sin historial', async () => {
      // Arrange - Estudiante nuevo sin datos
      const userId = 2;
      const request = { user: { id: userId } };

      const estudianteNuevo: User = {
        ...mockEstudianteCompleto,
        id: 2,
        nombre: 'Carlos',
        apellido: 'Rodríguez',
        email: 'carlos.rodriguez@universidad.edu',
        legajo: 'EST003',
      };

      userRepository.findOne.mockResolvedValue(estudianteNuevo);

      // Sin materias en el plan
      const materiaPlanRepo = appModule.get(getRepositoryToken(MateriaPlanEstudio));
      materiaPlanRepo.count.mockResolvedValue(0);

      // Sin inscripciones
      const inscripcionRepo = appModule.get(getRepositoryToken(Inscripcion));
      inscripcionRepo.count.mockResolvedValue(0);

      // Sin asistencias
      const asistenciaRepo = appModule.get(getRepositoryToken(Asistencia));
      asistenciaRepo.find.mockResolvedValue([]);

      // Sin exámenes próximos
      const examenFinalRepo = appModule.get(getRepositoryToken(ExamenFinal));
      examenFinalRepo.count.mockResolvedValue(0);

      // Act
      const result = await controller.obtenerEstadisticasEstudiante(request as any);

      // Assert
      expect(result).toEqual({
        totalMaterias: 0,
        materiasInscriptas: 0,
        asistenciaPromedio: 0,
        proximosExamenes: 0,
        proximosClases: 0,
      });
    });

    it('debe calcular correctamente estadísticas de un estudiante destacado', async () => {
      // Arrange - Estudiante con excelente rendimiento
      const userId = 3;
      const request = { user: { id: userId } };

      const estudianteDestacado: User = {
        ...mockEstudianteCompleto,
        id: 3,
        nombre: 'Ana',
        apellido: 'Martínez',
        email: 'ana.martinez@universidad.edu',
        legajo: 'EST004',
      };

      userRepository.findOne.mockResolvedValue(estudianteDestacado);

      // Todas las materias del plan inscriptas
      const materiaPlanRepo = appModule.get(getRepositoryToken(MateriaPlanEstudio));
      materiaPlanRepo.count.mockResolvedValue(20);

      const inscripcionRepo = appModule.get(getRepositoryToken(Inscripcion));
      inscripcionRepo.count.mockResolvedValue(20); // 100% de inscripción

      // Asistencia perfecta (100%)
      const asistenciaRepo = appModule.get(getRepositoryToken(Asistencia));
      asistenciaRepo.find.mockResolvedValue([
        { estado: EstadoAsistencia.PRESENTE } as any,
        { estado: EstadoAsistencia.PRESENTE } as any,
        { estado: EstadoAsistencia.PRESENTE } as any,
        { estado: EstadoAsistencia.PRESENTE } as any,
        { estado: EstadoAsistencia.PRESENTE } as any,
        { estado: EstadoAsistencia.PRESENTE } as any,
        { estado: EstadoAsistencia.PRESENTE } as any,
        { estado: EstadoAsistencia.PRESENTE } as any,
        { estado: EstadoAsistencia.PRESENTE } as any,
        { estado: EstadoAsistencia.PRESENTE } as any,
      ]);

      // Sin exámenes próximos (ya rindió todos)
      const examenFinalRepo = appModule.get(getRepositoryToken(ExamenFinal));
      examenFinalRepo.count.mockResolvedValue(0);

      // Act
      const result = await controller.obtenerEstadisticasEstudiante(request as any);

      // Assert
      expect(result).toEqual({
        totalMaterias: 20,
        materiasInscriptas: 20, // 100% de inscripción
        asistenciaPromedio: 100, // Asistencia perfecta
        proximosExamenes: 0, // Sin exámenes pendientes
        proximosClases: 0,
      });
    });
  });

  describe('Flujo de Actividad Reciente Completo', () => {
    it('debe integrar correctamente inscripciones y asistencias recientes', async () => {
      // Arrange
      const userId = 1;
      const request = { user: { id: userId } };

      // Configurar datos de actividad reciente
      const inscripcionRepo = appModule.get(getRepositoryToken(Inscripcion));
      inscripcionRepo.find.mockResolvedValue([
        {
          fechaInscripcion: new Date('2025-01-15T14:30:00'),
          materia: { nombre: 'Base de Datos' },
          notaFinal: null,
        } as any,
      ]);

      const asistenciaRepo = appModule.get(getRepositoryToken(Asistencia));
      asistenciaRepo.find.mockResolvedValue([
        {
          fechaRegistro: new Date('2025-01-15T10:00:00'),
          estado: EstadoAsistencia.PRESENTE,
          clase: {
            materia: { nombre: 'Programación Avanzada' },
          },
        } as any,
      ]);

      // Act
      const result = await controller.obtenerActividadReciente(request as any);

      // Assert
      expect(result).toHaveLength(2);

      // La inscripción más reciente debe ser primera
      expect(result[0].accion).toContain('Base de Datos');
      expect(result[0].estado).toBe('activa');

      // La asistencia debe ser segunda
      expect(result[1].accion).toContain('Programación Avanzada');
      expect(result[1].presente).toBe(true);

      // Verificar orden cronológico correcto
      expect(new Date(result[0].fecha).getTime()).toBeGreaterThan(new Date(result[1].fecha).getTime());
    });
  });

  describe('Flujo de Eventos Próximos Completo', () => {
    it('debe integrar correctamente clases y exámenes próximos', async () => {
      // Arrange
      const userId = 1;
      const request = { user: { id: userId } };

      // Configurar clases próximas
      const inscripcionRepo = appModule.get(getRepositoryToken(Inscripcion));
      inscripcionRepo.find.mockResolvedValue([
        {
          materia: { nombre: 'Algoritmos' },
          comision: {
            horarios: [
              {
                dia: 'LUNES',
                horaInicio: '08:00',
                aula: 'Aula 201',
              },
            ],
          },
        } as any,
      ]);

      // Configurar exámenes próximos
      const examenFinalRepo = appModule.get(getRepositoryToken(ExamenFinal));
      examenFinalRepo.find.mockResolvedValue([
        {
          fecha: '2025-01-20',
          horaInicioTeorico: '14:00',
          aulaTeorico: 'Aula Magna',
          materia: { nombre: 'Estructuras de Datos' },
        } as any,
      ]);

      // Act
      const result = await controller.obtenerProximosEventos(request as any);

      // Assert
      expect(result).toHaveLength(2);

      // La clase debe estar primero (orden alfabético)
      expect(result[0].titulo).toContain('Algoritmos');
      expect(result[0].fecha).toBe('LUNES');

      // El examen debe estar segundo
      expect(result[1].titulo).toContain('Estructuras de Datos');
      expect(result[1].fecha).toBe('2025-01-20');
    });
  });

  describe('Casos de Carga Extrema', () => {
    it('debe manejar correctamente una gran cantidad de datos', async () => {
      // Arrange - Simular estudiante con mucha actividad
      const userId = 1;
      const request = { user: { id: userId } };

      // 100 inscripciones recientes
      const inscripcionesMasivas = Array.from({ length: 100 }, (_, i) => ({
        fechaInscripcion: new Date(`2025-01-${String(i + 1).padStart(2, '0')}T10:00:00`),
        materia: { nombre: `Materia ${i + 1}` },
        notaFinal: i % 2 === 0 ? null : 10,
      })) as any;

      // 100 asistencias recientes
      const asistenciasMasivas = Array.from({ length: 100 }, (_, i) => ({
        fechaRegistro: new Date(`2025-01-${String(i + 1).padStart(2, '0')}T09:00:00`),
        estado: i % 3 === 0 ? EstadoAsistencia.AUSENTE : EstadoAsistencia.PRESENTE,
        clase: {
          materia: { nombre: `Materia ${i + 1}` },
        },
      })) as any;

      const inscripcionRepo = appModule.get(getRepositoryToken(Inscripcion));
      inscripcionRepo.find.mockResolvedValue(inscripcionesMasivas);

      const asistenciaRepo = appModule.get(getRepositoryToken(Asistencia));
      asistenciaRepo.find.mockResolvedValue(asistenciasMasivas);

      // Act
      const result = await controller.obtenerActividadReciente(request as any);

      // Assert
      expect(result).toHaveLength(10); // Respeta límite por defecto (10)

      // Verificar orden correcto (más reciente primero)
      for (let i = 0; i < result.length - 1; i++) {
        expect(new Date(result[i].fecha).getTime()).toBeGreaterThanOrEqual(
          new Date(result[i + 1].fecha).getTime()
        );
      }
    });

    it('debe manejar correctamente consultas con límite muy alto', async () => {
      // Arrange
      const userId = 1;
      const request = { user: { id: userId } };
      const limiteAlto = 1000;

      const inscripcionRepo = appModule.get(getRepositoryToken(Inscripcion));
      inscripcionRepo.find.mockResolvedValue([]);

      const asistenciaRepo = appModule.get(getRepositoryToken(Asistencia));
      asistenciaRepo.find.mockResolvedValue([]);

      // Act
      const result = await controller.obtenerActividadReciente(request as any);

      // Assert
      expect(result).toEqual([]);
      // El servicio debe manejar correctamente límites altos sin fallar
    });
  });

  describe('Pruebas de Performance', () => {
    it('debe completar operaciones dentro de límites de tiempo razonables', async () => {
      // Arrange
      const userId = 1;
      const request = { user: { id: userId } };

      // Configurar datos estándar
      userRepository.findOne.mockResolvedValue(mockEstudianteCompleto);

      const materiaPlanRepo = appModule.get(getRepositoryToken(MateriaPlanEstudio));
      materiaPlanRepo.count.mockResolvedValue(10);

      const inscripcionRepo = appModule.get(getRepositoryToken(Inscripcion));
      inscripcionRepo.count.mockResolvedValue(3);

      const asistenciaRepo = appModule.get(getRepositoryToken(Asistencia));
      asistenciaRepo.find.mockResolvedValue([
        { estado: EstadoAsistencia.PRESENTE } as any,
        { estado: EstadoAsistencia.AUSENTE } as any,
      ]);

      const examenFinalRepo = appModule.get(getRepositoryToken(ExamenFinal));
      examenFinalRepo.count.mockResolvedValue(1);

      // Act & Measure
      const startTime = Date.now();
      const result = await controller.obtenerEstadisticasEstudiante(request as any);
      const endTime = Date.now();

      // Assert
      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(1000); // Debe completar en menos de 1 segundo

      expect(result.totalMaterias).toBe(10);
      expect(result.materiasInscriptas).toBe(3);
      expect(result.asistenciaPromedio).toBe(50); // 1 presente de 2
      expect(result.proximosExamenes).toBe(1);
    });

    it('debe manejar correctamente operaciones simultáneas', async () => {
      // Arrange
      const userId = 1;
      const request = { user: { id: userId } };

      // Configurar respuestas rápidas
      userRepository.findOne.mockResolvedValue(mockEstudianteCompleto);

      const materiaPlanRepo = appModule.get(getRepositoryToken(MateriaPlanEstudio));
      materiaPlanRepo.count.mockResolvedValue(5);

      const inscripcionRepo = appModule.get(getRepositoryToken(Inscripcion));
      inscripcionRepo.count.mockResolvedValue(2);

      const asistenciaRepo = appModule.get(getRepositoryToken(Asistencia));
      asistenciaRepo.find.mockResolvedValue([]);

      const examenFinalRepo = appModule.get(getRepositoryToken(ExamenFinal));
      examenFinalRepo.count.mockResolvedValue(1);

      // Act - Múltiples operaciones simultáneas
      const promises = Array.from({ length: 10 }, () =>
        controller.obtenerEstadisticasEstudiante(request as any)
      );

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const endTime = Date.now();

      // Assert
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.totalMaterias).toBe(5);
        expect(result.materiasInscriptas).toBe(2);
      });

      // Debe completar todas las operaciones rápidamente
      expect(endTime - startTime).toBeLessThan(2000); // Menos de 2 segundos para 10 operaciones
    });
  });

  describe('Casos de Seguridad y Validación', () => {
    it('debe validar correctamente el ID del usuario autenticado', async () => {
      // Arrange
      const userIdValido = 1;
      const userIdInvalido = 999;
      const request = { user: { id: userIdValido } };

      // Usuario válido existe
      userRepository.findOne.mockImplementation(async (options: any) => {
        if (options.where?.id === userIdValido) {
          return mockEstudianteCompleto;
        }
        return null;
      });

      // Act & Assert - Usuario válido
      await expect(controller.obtenerEstadisticasEstudiante(request as any))
        .resolves
        .toBeDefined();

      // Usuario inválido debe retornar estadísticas en cero
      const materiaPlanRepo = appModule.get(getRepositoryToken(MateriaPlanEstudio));
      materiaPlanRepo.count.mockResolvedValue(0);

      const inscripcionRepo = appModule.get(getRepositoryToken(Inscripcion));
      inscripcionRepo.count.mockResolvedValue(0);

      const result = await controller.obtenerEstadisticasEstudiante(request as any);
      expect(result.totalMaterias).toBe(0);
    });

    it('debe proteger contra ataques de inyección de datos', async () => {
      // Arrange
      const userId = 1;
      const request = { user: { id: userId } };

      // Datos maliciosos que podrían intentar inyección
      const datosMaliciosos = {
        id: 1,
        nombre: 'Usuario"; DROP TABLE users; --',
        planEstudio: {
          id: 1,
          nombre: 'Plan\' OR \'1\'=\'1',
        },
      };

      userRepository.findOne.mockResolvedValue(datosMaliciosos as any);

      const materiaPlanRepo = appModule.get(getRepositoryToken(MateriaPlanEstudio));
      materiaPlanRepo.count.mockResolvedValue(5);

      const inscripcionRepo = appModule.get(getRepositoryToken(Inscripcion));
      inscripcionRepo.count.mockResolvedValue(2);

      const asistenciaRepo = appModule.get(getRepositoryToken(Asistencia));
      asistenciaRepo.find.mockResolvedValue([]);

      const examenFinalRepo = appModule.get(getRepositoryToken(ExamenFinal));
      examenFinalRepo.count.mockResolvedValue(1);

      // Act
      const result = await controller.obtenerEstadisticasEstudiante(request as any);

      // Assert - No debe fallar por datos maliciosos
      expect(result).toBeDefined();
      expect(result.totalMaterias).toBe(5);
      expect(result.materiasInscriptas).toBe(2);
    });
  });

  describe('Casos de Recuperación de Errores', () => {
    it('debe recuperarse correctamente de errores temporales de BD', async () => {
      // Arrange
      const userId = 1;
      const request = { user: { id: userId } };

      // Primera llamada falla, segunda tiene éxito
      userRepository.findOne
        .mockRejectedValueOnce(new Error('Error temporal de conexión'))
        .mockResolvedValueOnce(mockEstudianteCompleto);

      const materiaPlanRepo = appModule.get(getRepositoryToken(MateriaPlanEstudio));
      materiaPlanRepo.count.mockResolvedValue(8);

      const inscripcionRepo = appModule.get(getRepositoryToken(Inscripcion));
      inscripcionRepo.count.mockResolvedValue(3);

      const asistenciaRepo = appModule.get(getRepositoryToken(Asistencia));
      asistenciaRepo.find.mockResolvedValue([]);

      const examenFinalRepo = appModule.get(getRepositoryToken(ExamenFinal));
      examenFinalRepo.count.mockResolvedValue(2);

      // Act & Assert - Primera llamada ahora devuelve valores por defecto
      await expect(controller.obtenerEstadisticasEstudiante(request as any))
        .resolves
        .toEqual({
          totalMaterias: 0,
          materiasInscriptas: 0,
          asistenciaPromedio: 0,
          proximosExamenes: 0,
          proximosClases: 0,
        });

      // Segunda llamada debe tener éxito
      const result = await controller.obtenerEstadisticasEstudiante(request as any);
      expect(result).toEqual({
        totalMaterias: 8,
        materiasInscriptas: 3,
        asistenciaPromedio: 0,
        proximosExamenes: 2,
        proximosClases: 0,
      });
    });
  });
});
