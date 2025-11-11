// src/clase/clase.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ClaseController } from './clase.controller';
import { ClaseService } from './clase.service';
import { AsistenciaService } from '../asistencia/asistencia.service';

describe('ClaseController', () => {
  let controller: ClaseController;
  let claseService: any;
  let asistenciaService: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClaseController],
      providers: [
        {
          provide: ClaseService,
          useValue: {
            obtenerClasePorId: jest.fn(),
            crearClase: jest.fn(),
            obtenerClasesPorMateria: jest.fn(),
            obtenerClasesPorEstudiante: jest.fn(),
            actualizarClase: jest.fn(),
            cancelarClase: jest.fn(),
            obtenerClasesPendientesAsistencia: jest.fn(),
          },
        },
        {
          provide: AsistenciaService,
          useValue: {
            obtenerAsistenciasPorClase: jest.fn(),
            registrarAsistencia: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ClaseController>(ClaseController);
    claseService = module.get(ClaseService);
    asistenciaService = module.get(AsistenciaService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('obtenerClase should call service', async () => {
    claseService.obtenerClasePorId.mockResolvedValue({ id: 1 });
    const res = await controller.obtenerClase('1');
    expect(res).toEqual({ id: 1 });
    expect(claseService.obtenerClasePorId).toHaveBeenCalledWith(1);
  });

  it('crearClase should pass dto', async () => {
    claseService.crearClase.mockResolvedValue({ id: 1 });
    const res = await controller.crearClase({ materiaId: 1, fecha: new Date(), horarioId: 2, comisionId: 3, estado: 'programada' });
    expect(res).toEqual({ id: 1 });
    expect(claseService.crearClase).toHaveBeenCalled();
  });

  it('obtenerClasesPorMateria should parse id', async () => {
    claseService.obtenerClasesPorMateria.mockResolvedValue([{ id: 9 }]);
    const res = await controller.obtenerClasesPorMateria('7');
    expect(res).toEqual([{ id: 9 }]);
    expect(claseService.obtenerClasesPorMateria).toHaveBeenCalledWith(7);
  });

  it('obtenerClasesPorEstudiante should use req.user.id', async () => {
    claseService.obtenerClasesPorEstudiante.mockResolvedValue([]);
    const res = await controller.obtenerClasesPorEstudiante({ user: { id: 5 } } as any);
    expect(res).toEqual([]);
    expect(claseService.obtenerClasesPorEstudiante).toHaveBeenCalledWith(5);
  });

  it('actualizarClase should pass id and dto', async () => {
    claseService.actualizarClase.mockResolvedValue({ id: 1 });
    const res = await controller.actualizarClase('11', { fecha: new Date(), estado: 'realizada', motivoCancelacion: 'X' });
    expect(res).toEqual({ id: 1 });
    expect(claseService.actualizarClase).toHaveBeenCalled();
  });

  it('cancelarClase should parse id and call service', async () => {
    claseService.cancelarClase.mockResolvedValue({ id: 1 });
    const res = await controller.cancelarClase('3', 'Motivo');
    expect(res).toEqual({ id: 1 });
    expect(claseService.cancelarClase).toHaveBeenCalledWith(3, 'Motivo');
  });

  it('obtenerClasesPendientesAsistencia should call service', async () => {
    claseService.obtenerClasesPendientesAsistencia.mockResolvedValue([1]);
    const res = await controller.obtenerClasesPendientesAsistencia();
    expect(res).toEqual([1]);
  });

  it('obtenerAsistenciaClase should combine clase and asistencias', async () => {
    asistenciaService.obtenerAsistenciasPorClase.mockResolvedValue([1]);
    claseService.obtenerClasePorId.mockResolvedValue({ id: 2 });
    const res = await controller.obtenerAsistenciaClase('4');
    expect(res).toEqual({ clase: { id: 2 }, asistencias: [1] });
  });

  it('guardarAsistenciaClase should throw if clase not found', async () => {
    claseService.obtenerClasePorId.mockResolvedValue(null);
    await expect(controller.guardarAsistenciaClase('4', { asistencias: [] })).rejects.toThrow('Clase no encontrada');
  });

  it('guardarAsistenciaClase should call asistenciaService for each item', async () => {
    claseService.obtenerClasePorId.mockResolvedValue({ id: 4, estado: 'programada' });
    asistenciaService.registrarAsistencia.mockResolvedValue({ ok: true });
    claseService.actualizarClase.mockResolvedValue({ id: 4 });
    const res = await controller.guardarAsistenciaClase('4', { asistencias: [
      { inscripcionId: 1, presente: true },
      { inscripcionId: 2, presente: false, justificacion: 'medico' },
      { inscripcionId: 3, presente: false },
    ] });
    expect(res.success).toBe(true);
    expect(asistenciaService.registrarAsistencia).toHaveBeenCalledTimes(3);
    expect(claseService.actualizarClase).toHaveBeenCalled();
  });
});
