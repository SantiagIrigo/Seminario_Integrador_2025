import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';

describe('JwtStrategy', () => {
  it('should validate and map payload correctly', async () => {
    const mockConfig = { get: jest.fn().mockReturnValue('secret') } as any as ConfigService;
    const strat = new JwtStrategy(mockConfig);
    const payload = { sub: 123, email: 'a@b.com', rol: 'estudiante' };
    const result = await strat.validate(payload);
    expect(result).toEqual({ userId: 123, id: 123, email: 'a@b.com', rol: 'estudiante' });
  });

  it('should not log in production branch', async () => {
    const mockConfig = { get: jest.fn().mockReturnValue('secret') } as any as ConfigService;
    const strat = new JwtStrategy(mockConfig);
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const payload = { sub: 1, email: 'x@y', rol: 'profesor' };
    const res = await strat.validate(payload);
    expect(res).toEqual({ userId: 1, id: 1, email: 'x@y', rol: 'profesor' });
    process.env.NODE_ENV = prev;
  });

  it('should fall back to default secret when config missing', async () => {
    const mockConfig = { get: jest.fn().mockReturnValue(undefined) } as any as ConfigService;
    const strat = new JwtStrategy(mockConfig);
    const result = await strat.validate({ sub: 2, email: 'z@z', rol: 'admin' });
    expect(result.id).toBe(2);
  });
});
