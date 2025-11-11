// src/auth/auth.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: { login: jest.Mock; register?: jest.Mock };

  beforeEach(async () => {
    authService = {
      login: jest.fn(),
      register: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return error if missing legajo and email', async () => {
      const res = await controller.login({ password: 'x' } as any);
      expect(res).toEqual({ error: 'Se requiere email o legajo' });
      expect(authService.login).not.toHaveBeenCalled();
    });

    it('should call service with email when provided', async () => {
      authService.login.mockResolvedValue({ access_token: 't', user: { id: 1 } });
      const res = await controller.login({ email: 'a@b.com', password: 'p' });
      expect(res).toEqual({ access_token: 't', user: { id: 1 } });
      expect(authService.login).toHaveBeenCalledWith('a@b.com', 'p');
    });

    it('should call service with legajo when provided and return invalid creds error when null', async () => {
      authService.login.mockResolvedValue(null);
      const res = await controller.login({ legajo: '123', password: 'p' });
      expect(authService.login).toHaveBeenCalledWith('123', 'p');
      expect(res).toEqual({ error: 'Credenciales inválidas' });
    });

    it('should map thrown error into error object', async () => {
      authService.login.mockRejectedValue(new Error('boom'));
      const res = await controller.login({ email: 'x@y.com', password: 'p' });
      expect(res).toMatchObject({ error: 'boom' });
    });

    it('should include error details in development mode', async () => {
      const prev = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      authService.login.mockRejectedValue(new Error('dev-error'));
      const res = await controller.login({ email: 'a@b.com', password: 'p' });
      expect((res as any).error).toBe('dev-error');
      expect((res as any).details).toBeDefined();
      process.env.NODE_ENV = prev;
    });
  });

  describe('register-test', () => {
    it('should return fixed test user payload', async () => {
      const res = await controller.registerTest({ nombre: 'N', apellido: 'A', email: 'e', legajo: 'l', password: 'p' });
      expect(res).toEqual({
        message: 'Usuario de prueba creado',
        user: {
          id: 1,
          nombre: 'N',
          apellido: 'A',
          email: 'e',
          legajo: 'l',
          rol: 'estudiante',
        },
        access_token: 'test-token-12345',
      });
    });
  });

  describe('profile', () => {
    it('should return user from request', () => {
      const req = { user: { id: 9, email: 'e' } } as any;
      expect(controller.getProfile(req)).toEqual(req.user);
    });
  });
});
