// src/inscripcion-examen/inscripcion-examen.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { InscripcionExamenController } from './inscripcion-examen.controller';
import { InscripcionExamenService } from './inscripcion-examen.service';

describe('InscripcionExamenController', () => {
  let controller: InscripcionExamenController;
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InscripcionExamenController],
      providers: [
        {
          provide: InscripcionExamenService,
          useValue: {
            inscribirse: jest.fn(),
            obtenerInscripcionesPorEstudiante: jest.fn(),
            obtenerInscripcionesPorMateria: jest.fn(),
            obtenerInscripcionesPorExamen: jest.fn(),
            actualizarEstado: jest.fn(),
            removerInscripcion: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<InscripcionExamenController>(InscripcionExamenController);
    service = module.get(InscripcionExamenService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('inscribirse should set dto.inscripcionId from req.user and call service', async () => {
    service.inscribirse.mockResolvedValue({ id: 1 });
    const dto: any = { examenId: 9 };
    const req: any = { user: { inscripcionId: 7 } };
    const res = await controller.inscribirse(dto, req);
    expect(res).toEqual({ id: 1 });
    expect(service.inscribirse).toHaveBeenCalledWith({ examenId: 9, inscripcionId: 7 });
  });

  it('obtenerInscripcionesPorEstudiante should parse param', async () => {
    service.obtenerInscripcionesPorEstudiante.mockResolvedValue([]);
    const res = await controller.obtenerInscripcionesPorEstudiante('5');
    expect(res).toEqual([]);
    expect(service.obtenerInscripcionesPorEstudiante).toHaveBeenCalledWith(5);
  });

  it('obtenerInscripcionesPorMateria should parse param', async () => {
    service.obtenerInscripcionesPorMateria.mockResolvedValue([]);
    await controller.obtenerInscripcionesPorMateria('3');
    expect(service.obtenerInscripcionesPorMateria).toHaveBeenCalledWith(3);
  });

  it('obtenerInscripcionesPorExamen should parse param', async () => {
    service.obtenerInscripcionesPorExamen.mockResolvedValue([]);
    await controller.obtenerInscripcionesPorExamen('11');
    expect(service.obtenerInscripcionesPorExamen).toHaveBeenCalledWith(11);
  });

  it('actualizarEstado should map id and body', async () => {
    service.actualizarEstado.mockResolvedValue({ id: 2 });
    const res = await controller.actualizarEstado('4', { estado: 'aprobado' } as any);
    expect(res).toEqual({ id: 2 });
    expect(service.actualizarEstado).toHaveBeenCalledWith(4, { estado: 'aprobado' });
  });

  it('removerInscripcion should parse id and return message', async () => {
    service.removerInscripcion.mockResolvedValue(undefined);
    const res = await controller.removerInscripcion('8');
    expect(service.removerInscripcion).toHaveBeenCalledWith(8);
    expect(res).toEqual({ message: 'Inscripción eliminada correctamente' });
  });
});
