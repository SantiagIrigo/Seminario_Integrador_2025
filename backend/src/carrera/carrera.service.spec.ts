// src/carrera/carrera.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { CarreraService } from './carrera.service';
import { TestDatabaseModule } from '../test-utils/test-database.module';
import { Carrera } from './entities/carrera.entity';
import { PlanEstudio } from '../plan-estudio/entities/plan-estudio.entity';
import { Materia } from '../materia/entities/materia.entity';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

describe('CarreraService', () => {
  let service: CarreraService;
  let carreraRepository: Repository<Carrera>;
  
  const mockCarreraRepository = {
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CarreraService, {
        provide: getRepositoryToken(Carrera),
        useValue: mockCarreraRepository
      }
    ],
  }).compile();

    service = module.get<CarreraService>(CarreraService);
    carreraRepository = module.get<Repository<Carrera>>(getRepositoryToken(Carrera));
  });

  it('debe crear una carrera y guardarla en la base de datos', async () => {
    const dto = { nombre: 'Ingeniería en Sistemas', descripcion: 'Carrera de sistemas de información' };
    const carreraEntity = { id: 1, ...dto };

    mockCarreraRepository.create.mockReturnValue(carreraEntity);
    mockCarreraRepository.save.mockResolvedValue(carreraEntity);

    const result = await service.create(dto);

    expect(mockCarreraRepository.create).toHaveBeenCalledWith(dto);
    expect(mockCarreraRepository.save).toHaveBeenCalledWith(carreraEntity);
    expect(result).toEqual(carreraEntity);
  });

  it('debe eliminar una carrera por medio de su id', async () => {
    const carreraEntity = { id: 1, nombre: 'Ingeniería en Sistemas', descripcion: 'Carrera de sistemas de información' };
    
    jest.spyOn(service, 'findOne').mockResolvedValue(carreraEntity as Carrera);
    
    mockCarreraRepository.remove.mockResolvedValue(undefined);

    await service.remove(1);

    expect(service.findOne).toHaveBeenCalledWith(1);
    expect(mockCarreraRepository.remove).toHaveBeenCalledWith(carreraEntity);
  });

  it('debe encontrar todas las carreras', async () => {
    const carreras = [
      { id: 1, nombre: 'Ingeniería en Sistemas', descripcion: 'Carrera de sistemas de información', planesEstudio: [] },
      { id: 2, nombre: 'Licenciatura en Administración', descripcion: 'Carrera de administración de empresas', planesEstudio: [] },
    ];

    mockCarreraRepository.find.mockResolvedValue(carreras);
    
    const result = await service.findAll();

    expect(mockCarreraRepository.find).toHaveBeenCalledWith({ relations: ['planesEstudio'] });
    expect(result).toEqual(carreras);
  });

  it('debe retornar una carrera por su id', async () => {
    const carreraEntity = { id: 1, nombre: 'Ingeniería en Sistemas', planesEstudio: [] };

    mockCarreraRepository.findOne.mockResolvedValue(carreraEntity);

    const result = await service.findOne(1);

    expect(mockCarreraRepository.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
      relations: ['planesEstudio'],
    });
    expect(result).toEqual(carreraEntity);
  });

  it('debe lanzar NotFoundException si no encuentra la carrera', async () => {
    mockCarreraRepository.findOne.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toThrow(
      new NotFoundException('Carrera con id 999 no encontrada')
    );

    expect(mockCarreraRepository.findOne).toHaveBeenCalledWith({
      where: { id: 999 },
      relations: ['planesEstudio'],
    });
  });

  it('debe actualizar una carrera existente', async () => {
    const carreraOriginal = { id: 1, nombre: 'Ingeniería en Sistemas', descripcion: 'Carrera vieja' };
    const dto = { descripcion: 'Carrera actualizada' };
    const carreraActualizada = { ...carreraOriginal, ...dto };

    jest.spyOn(service, 'findOne').mockResolvedValue(carreraOriginal as Carrera);
    mockCarreraRepository.save.mockResolvedValue(carreraActualizada);

    const result = await service.update(1, dto);

    expect(service.findOne).toHaveBeenCalledWith(1);
    expect(mockCarreraRepository.save).toHaveBeenCalledWith(carreraActualizada);
    expect(result).toEqual(carreraActualizada);
  });
});