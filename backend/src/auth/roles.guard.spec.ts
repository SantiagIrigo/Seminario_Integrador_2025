import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';

describe('RolesGuard', () => {
  const makeCtx = (user: any = {}, handlerRoles?: any): [RolesGuard, ExecutionContext] => {
    const reflector = { get: jest.fn().mockReturnValue(handlerRoles) } as any as Reflector;
    const guard = new RolesGuard(reflector);
    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
      getHandler: () => ({} as any),
    } as unknown as ExecutionContext;
    return [guard, ctx];
  };

  it('should allow when no roles required', () => {
    const [guard, ctx] = makeCtx({ rol: 'estudiante' }, undefined);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow when user has required role', () => {
    const [guard, ctx] = makeCtx({ rol: 'profesor' }, ['profesor']);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should deny when user lacks role', () => {
    const [guard, ctx] = makeCtx({ rol: 'estudiante' }, ['profesor']);
    expect(guard.canActivate(ctx)).toBe(false);
  });
});