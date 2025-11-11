import { Test, TestingModule } from '@nestjs/testing';
import { CorrelativasController } from './correlativas.controller';
import { CorrelativasService } from './correlativas.service';

describe('CorrelativasController', () => {
  let controller: CorrelativasController;
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CorrelativasController],
      providers: [
        {
          provide: CorrelativasService,
          useValue: {
            verificarCorrelativasCursada: jest.fn(),
            verificarCorrelativasFinales: jest.fn(),
            verificarTodasCorrelativas: jest.fn(),
            verificarInscripcionExamenFinal: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CorrelativasController>(CorrelativasController);
    service = module.get(CorrelativasService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('verificarCorrelativasCursada should call service with userId and materiaId', async () => {
    service.verificarCorrelativasCursada.mockResolvedValue({});
    await controller.verificarCorrelativasCursada('5', { user: { userId: 1 } } as any);
    expect(service.verificarCorrelativasCursada).toHaveBeenCalledWith(1, 5);
  });

  it('verificarCorrelativasFinales should call service with userId and materiaId', async () => {
    service.verificarCorrelativasFinales.mockResolvedValue({});
    await controller.verificarCorrelativasFinales('7', { user: { userId: 2 } } as any);
    expect(service.verificarCorrelativasFinales).toHaveBeenCalledWith(2, 7);
  });

  it('verificarTodasCorrelativas should call service with userId and materiaId', async () => {
    service.verificarTodasCorrelativas.mockResolvedValue({});
    await controller.verificarTodasCorrelativas('8', { user: { userId: 3 } } as any);
    expect(service.verificarTodasCorrelativas).toHaveBeenCalledWith(3, 8);
  });

  it('verificarInscripcionExamenFinal should call service with userId and inscripcionId', async () => {
    service.verificarInscripcionExamenFinal.mockResolvedValue({});
    await controller.verificarInscripcionExamenFinal({ inscripcionId: 9 } as any, { user: { userId: 4 } } as any);
    expect(service.verificarInscripcionExamenFinal).toHaveBeenCalledWith(4, 9);
  });
});
