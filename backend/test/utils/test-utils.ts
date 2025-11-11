import { Repository } from 'typeorm';

// Mock para el Repository de TypeORM
export const mockRepository = <T = any>(entity: any): Partial<Repository<T>> => ({
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  create: jest.fn(entity => entity),
  count: jest.fn(),
  findAndCount: jest.fn(),
  query: jest.fn(),
});

// Mock para los resultados de consultas
export const mockQueryResult = <T>(data: T | T[]) => ({
  getMany: jest.fn().mockResolvedValue(Array.isArray(data) ? data : [data]),
  getOne: jest.fn().mockResolvedValue(Array.isArray(data) ? data[0] : data),
  getCount: jest.fn().mockResolvedValue(Array.isArray(data) ? data.length : 1),
});

// Mock para el contexto de autenticación
export const mockAuthContext = (user: any = { id: 1, email: 'test@example.com' }) => ({
  user,
  getRequest: jest.fn().mockReturnThis(),
  switchToHttp: jest.fn().mockReturnThis(),
  getClass: jest.fn(),
  getHandler: jest.fn(),
  getArgs: jest.fn(),
  getArgByIndex: jest.fn(),
  getType: jest.fn(),
  switchToRpc: jest.fn(),
  switchToWs: jest.fn(),
});
