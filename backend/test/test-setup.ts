import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Configuración base para módulos de prueba
export async function createTestingModule(providers: any[], entities: any[] = []) {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      ...providers,
      // Agregar mocks para los repositorios de TypeORM
      ...entities.map(entity => ({
        provide: getRepositoryToken(entity),
        useClass: Repository,
      })),
    ],
  }).compile();

  return module;
}

// Función para obtener instancias de los servicios y repositorios mockeados
export function getTestingInstances(module: TestingModule, providers: any[]) {
  const instances = {};
  
  providers.forEach(provider => {
    const token = provider.name || provider.provide;
    instances[token] = module.get(provider);
  });

  return instances;
}

// Función para inicializar mocks de repositorios
export function initRepositoryMocks(module: TestingModule, entity: any, mockData: any) {
  const repository = module.get<Repository<any>>(getRepositoryToken(entity));
  
  // Mockear métodos comunes
  repository.find = jest.fn().mockResolvedValue(mockData);
  repository.findOne = jest.fn().mockResolvedValue(Array.isArray(mockData) ? mockData[0] : mockData);
  repository.save = jest.fn().mockImplementation(entity => Promise.resolve(entity));
  repository.update = jest.fn().mockResolvedValue({ affected: 1 });
  repository.delete = jest.fn().mockResolvedValue({ affected: 1 });
  repository.count = jest.fn().mockResolvedValue(Array.isArray(mockData) ? mockData.length : 1);
  
  return repository;
}

// Silenciar errores ruidosos en tests (por ejemplo, rutas de estadísticas simulando fallos)
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(() => {
  jest.restoreAllMocks();
});
