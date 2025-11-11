// src/horario/horario.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { HorarioController } from './horario.controller';
import { HorarioService } from './horario.service';

describe('HorarioController', () => {
  let controller: HorarioController;
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HorarioController],
      providers: [
        {
          provide: HorarioService,
          useValue: {
            crearHorario: jest.fn(),
            obtenerHorariosPorMateria: jest.fn(),
            obtenerHorarioPersonal: jest.fn(),
            actualizarHorario: jest.fn(),
            eliminarHorario: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<HorarioController>(HorarioController);
    service = module.get(HorarioService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('crearHorario should pass dto to service', async () => {
    const dto = { materiaId: 1, dia: 1, horaInicio: '08:00', horaFin: '10:00', aula: 'A1' } as any;
    service.crearHorario.mockResolvedValue({ id: 1 });
    const res = await controller.crearHorario(dto);
    expect(res).toEqual({ id: 1 });
    expect(service.crearHorario).toHaveBeenCalledWith(1, 1, '08:00', '10:00', 'A1');
  });

  it('obtenerHorariosPorMateria should parse id and call service', async () => {
    service.obtenerHorariosPorMateria.mockResolvedValue([{ id: 1 }]);
    const res = await controller.obtenerHorariosPorMateria('5');
    expect(res).toEqual([{ id: 1 }]);
    expect(service.obtenerHorariosPorMateria).toHaveBeenCalledWith(5);
  });

  it('obtenerHorarioPersonal should return [] if no user', async () => {
    const res = await controller.obtenerHorarioPersonal({ user: null } as any);
    expect(res).toEqual([]);
    expect(service.obtenerHorarioPersonal).not.toHaveBeenCalled();
  });

  it('obtenerHorarioPersonal should call service with parsed dates', async () => {
    service.obtenerHorarioPersonal.mockResolvedValue([]);
    const res = await controller.obtenerHorarioPersonal(
      { user: { userId: 9 } } as any,
      '2025-01-01',
      '2025-01-07',
    );
    expect(res).toEqual([]);
    expect(service.obtenerHorarioPersonal).toHaveBeenCalled();
  });

  it('obtenerHorarioPersonal should use default dates when not provided', async () => {
    service.obtenerHorarioPersonal.mockResolvedValue([]);
    await controller.obtenerHorarioPersonal({ user: { userId: 1 } } as any);
    expect(service.obtenerHorarioPersonal).toHaveBeenCalledWith(1, expect.any(Date), expect.any(Date));
  });

  it('actualizarHorario should map dto to service', async () => {
    service.actualizarHorario.mockResolvedValue({ id: 1 });
    const res = await controller.actualizarHorario('7', { dia: 2, horaInicio: '09:00', horaFin: '11:00', aula: 'A2' } as any);
    expect(res).toEqual({ id: 1 });
    expect(service.actualizarHorario).toHaveBeenCalledWith(7, 2, '09:00', '11:00', 'A2');
  });

  it('eliminarHorario should map id to number', async () => {
    service.eliminarHorario.mockResolvedValue(undefined);
    await controller.eliminarHorario('10');
    expect(service.eliminarHorario).toHaveBeenCalledWith(10);
  });
});
