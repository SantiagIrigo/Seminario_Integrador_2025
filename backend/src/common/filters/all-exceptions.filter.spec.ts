// src/common/filters/all-exceptions.filter.spec.ts
import { AllExceptionsFilter } from './all-exceptions.filter';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

function makeHost() {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const getResponse = () => ({ status, json });
  const getRequest = () => ({ url: '/test' });
  const switchToHttp = () => ({ getResponse, getRequest });
  return { switchToHttp } as unknown as ArgumentsHost;
}

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
  });

  it('should format HttpException with string response', () => {
    const host = makeHost();
    const ex = new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    filter.catch(ex, host);
    const res: any = (host as any).switchToHttp().getResponse();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.status().json).toHaveBeenCalledWith({
      statusCode: 403,
      message: 'Forbidden',
      error: 'Internal Server Error',
    });
  });

  it('should format HttpException with object response', () => {
    const host = makeHost();
    const ex = new HttpException({ message: 'Bad', error: 'BadRequest' }, 400);
    filter.catch(ex, host);
    const res: any = (host as any).switchToHttp().getResponse();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.status().json).toHaveBeenCalledWith({
      statusCode: 400,
      message: 'Bad',
      error: 'BadRequest',
    });
  });

  it('should format generic Error differently by env', () => {
    const host = makeHost();
    const ex = new Error('boom');
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
    filter.catch(ex, host);
    const res: any = (host as any).switchToHttp().getResponse();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.status().json).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'boom',
      error: 'Internal Server Error',
    });
    process.env.NODE_ENV = prev;
  });

  it('should format generic Error as generic message in production', () => {
    const host = makeHost();
    const ex = new Error('boom');
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    filter.catch(ex, host);
    const res: any = (host as any).switchToHttp().getResponse();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.status().json).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Internal server error',
      error: 'Internal Server Error',
    });
    process.env.NODE_ENV = prev;
  });

  it('should handle object response without error field (fallback)', () => {
    const host = makeHost();
    const ex = new (class extends (HttpException as any) {
      constructor() { super({ message: 'Algo salió mal' }, 400); }
    })();
    filter.catch(ex, host);
    const res: any = (host as any).switchToHttp().getResponse();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.status().json).toHaveBeenCalledWith({
      statusCode: 400,
      message: 'Algo salió mal',
      error: 'Internal Server Error',
    });
  });

  it('should handle unknown exception', () => {
    const host = makeHost();
    filter.catch(123 as any, host);
    const res: any = (host as any).switchToHttp().getResponse();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.status().json).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Internal server error',
      error: 'Internal Server Error',
    });
  });
});
