import { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  it('should delegate to super.canActivate', () => {
    // Patch parent canActivate to return true and track calls
    const parentProto = Object.getPrototypeOf(JwtAuthGuard.prototype);
    const superSpy = jest.spyOn(parentProto, 'canActivate').mockReturnValue(true as any);

    const guard = new JwtAuthGuard() as any;
    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({}) }),
    } as unknown as ExecutionContext;

    const res = guard.canActivate(ctx);
    expect(res).toBe(true);
    expect(superSpy).toHaveBeenCalledWith(ctx);
  });
});
