// src/estado-academico/estado-academico.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { EstadoAcademicoService } from './estado-academico.service';
import { InscripcionService } from '../inscripcion/inscripcion.service';
import { CorrelativasService } from '../correlativas/correlativas.service';

describe('EstadoAcademicoService', () => {
  let service: EstadoAcademicoService;
  let mockInscripcionService: jest.Mocked<Partial<InscripcionService>>;
  let mockCorrelativasService: jest.Mocked<Partial<CorrelativasService>>;

  beforeEach(async () => {
    mockInscripcionService = {
      materiasDelEstudiante: jest.fn(),
      historialAcademico: jest.fn(),
      findInscripcionCompleta: jest.fn(),
    };

    mockCorrelativasService = {
      verificarCorrelativasFinales: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EstadoAcademicoService,
        {
          provide: InscripcionService,
          useValue: mockInscripcionService,
        },
        {
          provide: CorrelativasService,
          useValue: mockCorrelativasService,
        },
      ],
    }).compile();

    service = module.get<EstadoAcademicoService>(EstadoAcademicoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('obtenerEstadoAcademico', () => {
    it('should return academic status for a user', async () => {
      const userId = 1;
      const materiasCursando = [
        {
          id: 11,
          estudiante: {
            id: 100,
            nombre: 'Ana',
            apellido: 'Test',
            legajo: '123',
          },
          materia: { id: 1, nombre: 'Matemática' },
          comision: undefined,
          faltas: 2,
          notaFinal: undefined,
          stc: 'cursando',
          fechaInscripcion: new Date('2024-03-01T00:00:00Z'),
          fechaFinalizacion: null,
        },
      ];

      const historial = [
        {
          id: 12,
          estudiante: {
            id: 100,
            nombre: 'Ana',
            apellido: 'Test',
            legajo: '12345',
            email: 'ana.test@example.com',
            password: 'hashedpassword',
            rol: 'estudiante',
            planEstudio: {
              id: 1,
              nombre: 'Plan 2023',
              duracionAnios: 5,
              resolucion: 'RES-2023-1234',
              activo: true
            },
            activo: true,
            fechaCreacion: new Date('2023-01-01T00:00:00Z'),
            fechaActualizacion: new Date('2023-01-01T00:00:00Z')
          },
          materia: { 
            id: 2, 
            nombre: 'Física',
            descripcion: 'Física general',
            creditos: 8,
            horasSemanales: 6,
            activo: true,
            departamento: {
              id: 1,
              nombre: 'Ciencias Básicas',
              descripcion: 'Departamento de ciencias básicas',
              activo: true
            },
            correlativasCursada: [],
            correlativasFinal: []
          },
          comision: {
            id: 1,
            nombre: 'Comisión A',
            cupoMaximo: 50,
            cupoDisponible: 30,
            horarios: [
              {
                id: 1,
                dia: 'Lunes',
                horaInicio: '08:00',
                horaFin: '11:00',
                aula: 'Aula 101'
              }
            ]
          },
          faltas: 2,
          notaFinal: 8,
          stc: 'aprobada',
          fechaInscripcion: new Date('2024-01-10T00:00:00Z'),
          fechaFinalizacion: new Date('2024-06-10T00:00:00Z'),
          evaluaciones: [
            {
              id: 1,
              tipo: 'Parcial 1',
              nota: 8,
              fecha: new Date('2024-04-15T00:00:00Z')
            },
            {
              id: 2,
              tipo: 'Parcial 2',
              nota: 7,
              fecha: new Date('2024-06-10T00:00:00Z')
            },
            {
              id: 3,
              tipo: 'Trabajo Práctico',
              nota: 9,
              fecha: new Date('2024-05-20T00:00:00Z')
            }
          ]
        }
      ];

      (mockInscripcionService.materiasDelEstudiante as jest.Mock).mockResolvedValue(materiasCursando);
      (mockInscripcionService.historialAcademico as jest.Mock).mockResolvedValue(historial);

      const result = await service.obtenerEstadoAcademico(userId);

      expect(result).toEqual({
        materiasCursando: [
          expect.objectContaining({
            materia: expect.objectContaining({ id: 1, nombre: 'Matemática' }),
            faltas: 2,
            notaFinal: undefined,
            stc: 'cursando',
            evaluaciones: expect.any(Array),
          }),
        ],
        historial: [
          expect.objectContaining({
            materia: expect.objectContaining({ id: 2, nombre: 'Física' }),
            notaFinal: 8,
            stc: 'aprobada',
            fechaInscripcion: expect.any(Date),
            fechaFinalizacion: expect.any(Date),
          })
        ]
      });
      expect(mockInscripcionService.materiasDelEstudiante).toHaveBeenCalledWith(userId);
      expect(mockInscripcionService.historialAcademico).toHaveBeenCalledWith(userId);
    });
  });

  describe('puedeAprobarDirectamente', () => {
    it('should return true when student meets criteria', async () => {
      const inscripcion = {
        evaluaciones: [{ nota: 9 }, { nota: 10 }, { nota: 9 }],
        faltas: 2,
        stc: 'cursada',
      };

      (mockInscripcionService.findInscripcionCompleta as jest.Mock).mockResolvedValue(inscripcion as any);

      const result = await service.puedeAprobarDirectamente(5);

      expect(result).toBe(true);
      expect(mockInscripcionService.findInscripcionCompleta).toHaveBeenCalledWith(5);
    });

    it('should return false when requirements are not met', async () => {
      const inscripcion = {
        evaluaciones: [{ nota: 7 }, { nota: 6 }, { nota: 7 }],
        faltas: 6,
        stc: 'cursada',
      };

      (mockInscripcionService.findInscripcionCompleta as jest.Mock).mockResolvedValue(inscripcion as any);

      const result = await service.puedeAprobarDirectamente(3);

      expect(result).toBe(false);
    });

    it('should return false when inscripcion is not found', async () => {
      (mockInscripcionService.findInscripcionCompleta as jest.Mock).mockResolvedValue(undefined);

      const result = await service.puedeAprobarDirectamente(10);

      expect(result).toBe(false);
    });

    it('should return false when repository throws error', async () => {
      (mockInscripcionService.findInscripcionCompleta as jest.Mock).mockRejectedValue(new Error('boom'));

      const result = await service.puedeAprobarDirectamente(10);

      expect(result).toBe(false);
    });
  });

  describe('puedeInscribirseExamenFinal', () => {
    it('should return true when status is cursada', async () => {
      (mockInscripcionService.findInscripcionCompleta as jest.Mock).mockResolvedValue({ stc: 'cursada' } as any);

      const result = await service.puedeInscribirseExamenFinal(1);

      expect(result).toBe(true);
      expect(mockInscripcionService.findInscripcionCompleta).toHaveBeenCalledWith(1);
    });

    it('should return true when status is aprobada', async () => {
      (mockInscripcionService.findInscripcionCompleta as jest.Mock).mockResolvedValue({ stc: 'aprobada' } as any);

      const result = await service.puedeInscribirseExamenFinal(2);

      expect(result).toBe(true);
    });

    it('should return false for other statuses', async () => {
      (mockInscripcionService.findInscripcionCompleta as jest.Mock).mockResolvedValue({ stc: 'pendiente' } as any);

      const result = await service.puedeInscribirseExamenFinal(3);

      expect(result).toBe(false);
    });

    it('should return false when inscripcion is missing', async () => {
      (mockInscripcionService.findInscripcionCompleta as jest.Mock).mockResolvedValue(undefined);

      const result = await service.puedeInscribirseExamenFinal(4);

      expect(result).toBe(false);
    });

    it('should return false when repository throws error', async () => {
      (mockInscripcionService.findInscripcionCompleta as jest.Mock).mockRejectedValue(new Error('boom'));

      const result = await service.puedeInscribirseExamenFinal(5);

      expect(result).toBe(false);
    });
  });

  describe('verificarCorrelativasExamenFinal', () => {
    it('should return true when correlativas result is cumple', async () => {
      (mockInscripcionService.findInscripcionCompleta as jest.Mock).mockResolvedValue({ materia: { id: 7 } } as any);
      (mockCorrelativasService.verificarCorrelativasFinales as jest.Mock).mockResolvedValue({ cumple: true, faltantes: [] });

      const result = await service.verificarCorrelativasExamenFinal(1, 2);

      expect(result).toBe(true);
      expect(mockCorrelativasService.verificarCorrelativasFinales).toHaveBeenCalledWith(2, 7);
    });

    it('should return false when correlativas result is not cumple', async () => {
      (mockInscripcionService.findInscripcionCompleta as jest.Mock).mockResolvedValue({ materia: { id: 7 } } as any);
      (mockCorrelativasService.verificarCorrelativasFinales as jest.Mock).mockResolvedValue({ cumple: false, faltantes: [] });

      const result = await service.verificarCorrelativasExamenFinal(1, 2);

      expect(result).toBe(false);
    });

    it('should return false when inscripcion is not found', async () => {
      (mockInscripcionService.findInscripcionCompleta as jest.Mock).mockResolvedValue(undefined);

      const result = await service.verificarCorrelativasExamenFinal(1, 2);

      expect(result).toBe(false);
      expect(mockCorrelativasService.verificarCorrelativasFinales).not.toHaveBeenCalled();
    });

    it('should return false when dependencies throw error', async () => {
      (mockInscripcionService.findInscripcionCompleta as jest.Mock).mockResolvedValue({ materia: { id: 7 } } as any);
      (mockCorrelativasService.verificarCorrelativasFinales as jest.Mock).mockRejectedValue(new Error('boom'));

      const result = await service.verificarCorrelativasExamenFinal(1, 2);

      expect(result).toBe(false);
    });
  });

  describe('calcularPromedioEvaluaciones', () => {
    it('should calculate average correctly', () => {
      const evaluaciones = [{ nota: 8 }, { nota: 9 }, { nota: 7 }];

      const result = (service as any).calcularPromedioEvaluaciones(evaluaciones);

      expect(result).toBe(8);
    });

    it('should return 0 when no evaluations', () => {
      const result = (service as any).calcularPromedioEvaluaciones([]);

      expect(result).toBe(0);
    });
  });

  describe('calcularAsistencia', () => {
    it('should calculate attendance correctly', () => {
      const result = (service as any).calcularAsistencia(2);

      expect(result).toBe(90);
    });

    it('should return 0 when faltas exceed max', () => {
      const result = (service as any).calcularAsistencia(25);

      expect(result).toBe(0);
    });
  });
});