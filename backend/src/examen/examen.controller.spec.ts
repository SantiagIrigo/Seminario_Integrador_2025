import { Test, TestingModule } from '@nestjs/testing';
import { ExamenController } from './examen.controller';
import { ExamenService } from './examen.service';
import { BadRequestException } from '@nestjs/common';

describe('ExamenController', () => {
  let controller: ExamenController;
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExamenController],
      providers: [
        {
          provide: ExamenService,
          useValue: {
            inscribirse: jest.fn(),
            cargarNota: jest.fn(),
            verExamenes: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ExamenController>(ExamenController);
    service = module.get(ExamenService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('inscribirse should validate materiaId and call service', async () => {
    service.inscribirse.mockResolvedValue({ id: 1 });
    const res = await controller.inscribirse({ user: { userId: 7 } } as any, '5');
    expect(res).toEqual({ id: 1 });
    expect(service.inscribirse).toHaveBeenCalledWith(7, 5);
  });

  it('inscribirse should throw on invalid id', async () => {
    await expect(controller.inscribirse({ user: { userId: 7 } } as any, 'x')).rejects.toThrow(BadRequestException);
  });

  it('cargarNota should validate examenId and call service', async () => {
    service.cargarNota.mockResolvedValue({ id: 2 });
    const res = await controller.cargarNota('9', { nota: 8, estado: 'aprobado' } as any);
    expect(res).toEqual({ id: 2 });
    expect(service.cargarNota).toHaveBeenCalledWith(9, 8, 'aprobado');
  });

  it('cargarNota should throw on invalid id', async () => {
    await expect(controller.cargarNota('xx', { nota: 8, estado: 'aprobado' } as any)).rejects.toThrow(BadRequestException);
  });

  it('misExamenes should forward to service', async () => {
    service.verExamenes.mockResolvedValue([]);
    const res = await controller.misExamenes({ user: { userId: 3 } } as any);
    expect(res).toEqual([]);
    expect(service.verExamenes).toHaveBeenCalledWith(3);
  });
});
