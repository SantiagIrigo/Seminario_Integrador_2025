// src/asistencia/asistencia.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AsistenciaController } from './asistencia.controller';
import { AsistenciaService } from './asistencia.service';
import { CreateAsistenciaDto } from './dto/create-asistencia.dto';
import { UpdateAsistenciaDto } from './dto/update-asistencia.dto';
import { EstadoAsistencia } from './entities/asistencia.entity';

describe('AsistenciaController', () => {
  let controller: AsistenciaController;
  let mockAsistenciaService: Partial<AsistenciaService>;

  beforeEach(async () => {
    mockAsistenciaService = {
      registrarAsistencia: jest.fn(),
      obtenerAsistenciasPorClase: jest.fn(),
      obtenerAsistenciasPorEstudiante: jest.fn(),
      obtenerResumenAsistencias: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AsistenciaController],
      providers: [
        {
          provide: AsistenciaService,
          useValue: mockAsistenciaService,
        },
      ],
    }).compile();

    controller = module.get<AsistenciaController>(AsistenciaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('registrarAsistencia', () => {
    it('should register attendance', async () => {
      // Arrange
      const claseId = '1';
      const estudianteId = '1';
      const dto: CreateAsistenciaDto = {
        claseId: 1,
        estudianteId: 1,
        estado: EstadoAsistencia.PRESENTE
      };
      
      const expectedResult = {
        id: 1,
        ...dto,
        fechaRegistro: new Date()
      };
      
      (mockAsistenciaService.registrarAsistencia as jest.Mock).mockResolvedValue(expectedResult);

      const req = { user: { id: 5, rol: 'profesor' } };

      // Act
      const result = await controller.registrarAsistencia(claseId, estudianteId, dto, req as any);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockAsistenciaService.registrarAsistencia).toHaveBeenCalledWith(
        1, 1, EstadoAsistencia.PRESENTE, undefined, 5, 'profesor'
      );
    });
  });

  describe('obtenerAsistenciasPorClase', () => {
    it('should return attendance records for a class', async () => {
      // Arrange
      const claseId = '1';
      const expectedResult = [{
        id: 1,
        claseId: 1,
        estudianteId: 1,
        estado: EstadoAsistencia.PRESENTE,
        fechaRegistro: new Date()
      }];
      
      (mockAsistenciaService.obtenerAsistenciasPorClase as jest.Mock).mockResolvedValue(expectedResult);

      // Act
      const result = await controller.obtenerAsistenciasPorClase(claseId);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockAsistenciaService.obtenerAsistenciasPorClase).toHaveBeenCalledWith(1);
    });
  });

  describe('obtenerAsistenciasPorEstudiante', () => {
    it('should return attendance records for a student', async () => {
      // Arrange
      const mockRequest = { user: { id: 1 } };
      const expectedResult = [{
        id: 1,
        claseId: 1,
        estudianteId: 1,
        estado: EstadoAsistencia.PRESENTE,
        fechaRegistro: new Date()
      }];
      
      (mockAsistenciaService.obtenerAsistenciasPorEstudiante as jest.Mock).mockResolvedValue(expectedResult);

      // Act
      const result = await controller.obtenerAsistenciasPorEstudiante(mockRequest);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockAsistenciaService.obtenerAsistenciasPorEstudiante).toHaveBeenCalledWith(1);
    });
  });

  describe('obtenerResumenAsistencias', () => {
    it('should return attendance summary', async () => {
      // Arrange
      const mockRequest = { user: { id: 1 } };
      const expectedResult = {
        total: 10,
        presentes: 8,
        justificadas: 1,
        ausentes: 1
      };
      
      (mockAsistenciaService.obtenerResumenAsistencias as jest.Mock).mockResolvedValue(expectedResult);

      // Act
      const result = await controller.obtenerResumenAsistencias(mockRequest, undefined);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockAsistenciaService.obtenerResumenAsistencias).toHaveBeenCalledWith(1, undefined);
    });

    it('should parse materiaId when provided', async () => {
      const mockRequest = { user: { id: 5 } };
      (mockAsistenciaService.obtenerResumenAsistencias as jest.Mock).mockResolvedValue({ total: 0, presentes: 0, justificadas: 0, ausentes: 0 });
      await controller.obtenerResumenAsistencias(mockRequest, '2');
      expect(mockAsistenciaService.obtenerResumenAsistencias).toHaveBeenCalledWith(5, 2);
    });
  });

  describe('obtenerAsistenciasPorMateria', () => {
    it('should return attendance records by subject', async () => {
      // Arrange
      const mockRequest = { user: { id: 1 } };
      const materiaId = '1';
      const expectedResult = {
        total: 5,
        presentes: 4,
        justificadas: 0,
        ausentes: 1
      };
      
      (mockAsistenciaService.obtenerResumenAsistencias as jest.Mock).mockResolvedValue(expectedResult);

      // Act
      const result = await controller.obtenerAsistenciasPorMateria(mockRequest, materiaId);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockAsistenciaService.obtenerResumenAsistencias).toHaveBeenCalledWith(1, 1);
    });
  });
});