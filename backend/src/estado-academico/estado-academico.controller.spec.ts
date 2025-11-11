// src/estado-academico/estado-academico.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { EstadoAcademicoController } from './estado-academico.controller';
import { EstadoAcademicoService } from './estado-academico.service';

describe('EstadoAcademicoController', () => {
  let controller: EstadoAcademicoController;
  let mockEstadoAcademicoService: Partial<EstadoAcademicoService>;

  beforeEach(async () => {
    mockEstadoAcademicoService = {
      obtenerEstadoAcademico: jest.fn(),
      puedeAprobarDirectamente: jest.fn(),
      puedeInscribirseExamenFinal: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EstadoAcademicoController],
      providers: [
        {
          provide: EstadoAcademicoService,
          useValue: mockEstadoAcademicoService,
        },
      ],
    }).compile();

    controller = module.get<EstadoAcademicoController>(EstadoAcademicoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('obtenerEstado', () => {
    it('should return academic status', async () => {
      // Arrange
      const userId = '1';
      const result = {
        materiasCursando: [],
        historial: []
      };

      (mockEstadoAcademicoService.obtenerEstadoAcademico as jest.Mock).mockResolvedValue(result);

      // Act
      const response = await controller.obtenerEstado(userId);

      // Assert
      expect(response).toEqual(result);
      expect(mockEstadoAcademicoService.obtenerEstadoAcademico).toHaveBeenCalledWith(1);
    });
  });

  describe('puedeAprobarDirectamente', () => {
    it('should return approval eligibility', async () => {
      // Arrange
      const inscripcionId = '1';
      const result = true;

      (mockEstadoAcademicoService.puedeAprobarDirectamente as jest.Mock).mockResolvedValue(result);

      // Act
      const response = await controller.puedeAprobarDirectamente(inscripcionId);

      // Assert
      expect(response).toEqual(result);
      expect(mockEstadoAcademicoService.puedeAprobarDirectamente).toHaveBeenCalledWith(1);
    });
  });

  describe('puedeInscribirseExamen', () => {
    it('should return exam enrollment eligibility', async () => {
      // Arrange
      const inscripcionId = '1';
      const result = true;

      (mockEstadoAcademicoService.puedeInscribirseExamenFinal as jest.Mock).mockResolvedValue(result);

      // Act
      const response = await controller.puedeInscribirseExamen(inscripcionId);

      // Assert
      expect(response).toEqual(result);
      expect(mockEstadoAcademicoService.puedeInscribirseExamenFinal).toHaveBeenCalledWith(1);
    });
  });
});