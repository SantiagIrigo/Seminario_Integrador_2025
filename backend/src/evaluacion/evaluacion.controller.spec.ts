import { Test, TestingModule } from '@nestjs/testing';
import { EvaluacionController } from './evaluacion.controller';
import { EvaluacionService } from './evaluacion.service';

describe('EvaluacionController', () => {
  let controller: EvaluacionController;
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EvaluacionController],
      providers: [
        {
          provide: EvaluacionService,
          useValue: {
            crearEvaluacion: jest.fn(),
            getEvaluacionesPorMateria: jest.fn(),
            getEvaluacionesPorEstudiante: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<EvaluacionController>(EvaluacionController);
    service = module.get(EvaluacionService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('crear should pass payload and user id', async () => {
    service.crearEvaluacion.mockResolvedValue({ id: 1 });
    const res = await controller.crear({ materiaId: 1, estudianteId: 2, tipo: 'parcial', nota: 9 } as any, { user: { id: 5 } } as any);
    expect(res).toEqual({ id: 1 });
    expect(service.crearEvaluacion).toHaveBeenCalledWith(1, 2, 'parcial', 9, undefined, undefined, 5);
  });

  it('porMateria should call service', async () => {
    service.getEvaluacionesPorMateria.mockResolvedValue([]);
    const res = await controller.porMateria('7');
    expect(res).toEqual([]);
    expect(service.getEvaluacionesPorMateria).toHaveBeenCalledWith(7);
  });

  it('porEstudianteYMateria should use req.user.id and materiaId', async () => {
    service.getEvaluacionesPorEstudiante.mockResolvedValue([]);
    const res = await controller.porEstudianteYMateria('9', { user: { id: 11 } } as any);
    expect(res).toEqual([]);
    expect(service.getEvaluacionesPorEstudiante).toHaveBeenCalledWith(11, 9);
  });
});
