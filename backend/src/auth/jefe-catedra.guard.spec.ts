import { JefeDeCatedraGuard } from './jefe-catedra.guard';
import { ExecutionContext } from '@nestjs/common';

describe('JefeDeCatedraGuard', () => {
  const makeCtx = (user: any, examenId?: string) => ({
    switchToHttp: () => ({ getRequest: () => ({ user, params: { examenId } }) }),
  }) as unknown as ExecutionContext;

  it('should deny when no user or examenId', async () => {
    const guard = new JefeDeCatedraGuard({ esJefeDeCatedra: jest.fn() } as any);
    expect(await guard.canActivate(makeCtx(null as any))).toBe(false);
    expect(await guard.canActivate(makeCtx({ rol: 'profesor' }, undefined))).toBe(false);
  });

  it('should deny when not profesor', async () => {
    const guard = new JefeDeCatedraGuard({ esJefeDeCatedra: jest.fn() } as any);
    expect(await guard.canActivate(makeCtx({ rol: 'estudiante' }, '1'))).toBe(false);
  });

  it('should call service and return its result when profesor', async () => {
    const svc = { esJefeDeCatedra: jest.fn().mockResolvedValue(true) } as any;
    const guard = new JefeDeCatedraGuard(svc);
    const res = await guard.canActivate(makeCtx({ rol: 'profesor', userId: 7 }, '9'));
    expect(res).toBe(true);
    expect(svc.esJefeDeCatedra).toHaveBeenCalledWith(7, 9);
  });
});