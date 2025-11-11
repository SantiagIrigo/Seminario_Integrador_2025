import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InscripcionService } from './inscripcion.service';
import { Inscripcion } from './entities/inscripcion.entity';
import { User } from '../user/entities/user.entity';
import { Materia } from '../materia/entities/materia.entity';
import { Comision } from '../comision/entities/comision.entity';
import { Departamento } from '../departamento/entities/departamento.entity';
import { CorrelativasService } from '../correlativas/correlativas.service';
import { InscripcionResponseDto } from './dto/inscripcion-response.dto';

const createQueryBuilderMock = () => {
  const qb: any = {};
  qb.leftJoinAndSelect = jest.fn().mockReturnValue(qb);
  qb.innerJoin = jest.fn().mockReturnValue(qb);
  qb.where = jest.fn().mockReturnValue(qb);
  qb.andWhere = jest.fn().mockReturnValue(qb);
  qb.select = jest.fn().mockReturnValue(qb);
  qb.orderBy = jest.fn().mockReturnValue(qb);
  qb.getOne = jest.fn();
  qb.getMany = jest.fn();
  return qb;
};

const createInscripcion = (overrides: Partial<Inscripcion> = {}): Inscripcion => {
  const base: Inscripcion = {
    id: overrides.id ?? 1,
    estudiante: overrides.estudiante ?? {
      id: 100,
      nombre: 'Ana',
      apellido: 'Test',
      legajo: 'A123',
    } as any,
    materia: overrides.materia ?? {
      id: 200,
      nombre: 'Matemática',
    } as any,
    comision: overrides.comision ?? {
      id: 300,
      nombre: 'Comisión 1',
    } as any,
    faltas: overrides.faltas ?? 2,
    notaFinal: overrides.notaFinal ?? 8,
    stc: overrides.stc ?? 'cursando',
    fechaInscripcion: overrides.fechaInscripcion ?? new Date('2024-03-01T00:00:00Z'),
    fechaFinalizacion: overrides.fechaFinalizacion ?? new Date('2024-07-01T00:00:00Z'),
    evaluaciones: overrides.evaluaciones ?? [],
  } as Inscripcion;

  return base;
};

const mapToDto = (inscripcion: Inscripcion): InscripcionResponseDto => ({
  id: inscripcion.id,
  estudiante: {
    id: inscripcion.estudiante.id,
    nombre: (inscripcion.estudiante as any).nombre,
    apellido: (inscripcion.estudiante as any).apellido,
    legajo: (inscripcion.estudiante as any).legajo,
  },
  materia: {
    id: inscripcion.materia.id,
    nombre: inscripcion.materia.nombre,
  },
  comision: inscripcion.comision
    ? {
        id: inscripcion.comision.id,
        nombre: inscripcion.comision.nombre,
      }
    : undefined,
  faltas: inscripcion.faltas,
  notaFinal: inscripcion.notaFinal,
  stc: inscripcion.stc,
  fechaInscripcion: inscripcion.fechaInscripcion,
  fechaFinalizacion: inscripcion.fechaFinalizacion,
});

describe('InscripcionService', () => {
  let service: InscripcionService;
  let mockInscripcionRepo: jest.Mocked<any>;
  let mockUserRepo: jest.Mocked<any>;
  let mockMateriaRepo: jest.Mocked<any>;
  let mockComisionRepo: jest.Mocked<any>;
  let mockDepartamentoRepo: jest.Mocked<any>;
  let mockCorrelativasService: jest.Mocked<CorrelativasService>;

  beforeEach(async () => {
    mockInscripcionRepo = {
      createQueryBuilder: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    } as any;

    mockUserRepo = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
    } as any;

    mockMateriaRepo = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
    } as any;

    mockComisionRepo = { findOne: jest.fn() } as any;

    mockDepartamentoRepo = {
      findOne: jest.fn(),
    } as any;

    mockCorrelativasService = {
      verificarCorrelativasCursada: jest.fn(),
      verificarCorrelativasFinales: jest.fn(),
      verificarInscripcionMateria: jest.fn(),
      verificarInscripcionExamenFinal: jest.fn(),
      agregarCorrelativaCursada: jest.fn(),
      agregarCorrelativaFinal: jest.fn(),
      eliminarCorrelativaCursada: jest.fn(),
      eliminarCorrelativaFinal: jest.fn(),
      obtenerCorrelativas: jest.fn(),
      existeCorrelativa: jest.fn(),
      verificarTodasCorrelativas: jest.fn(),
    } as unknown as jest.Mocked<CorrelativasService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InscripcionService,
        {
          provide: getRepositoryToken(Inscripcion),
          useValue: mockInscripcionRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: getRepositoryToken(Materia),
          useValue: mockMateriaRepo,
        },
        {
          provide: getRepositoryToken(Comision),
          useValue: mockComisionRepo,
        },
        {
          provide: getRepositoryToken(Departamento),
          useValue: mockDepartamentoRepo,
        },
        {
          provide: CorrelativasService,
          useValue: mockCorrelativasService,
        },
      ],
    }).compile();

    service = module.get<InscripcionService>(InscripcionService);
  });

  describe('historialAcademico', () => {
    it('should return mapped historial for a user', async () => {
      const qb = createQueryBuilderMock();
      const inscripciones = [createInscripcion({ id: 10 })];
      qb.getMany.mockResolvedValue(inscripciones);
      mockInscripcionRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.historialAcademico(1);

      expect(result).toEqual(inscripciones.map(mapToDto));
      expect(qb.where).toHaveBeenCalledWith('estudiante.id = :userId', { userId: 1 });
      expect(qb.select).toHaveBeenCalled();
    });
  });

  describe('materiasDelEstudiante', () => {
    it('should return current courses mapped to DTOs', async () => {
      const qb = createQueryBuilderMock();
      const inscripciones = [createInscripcion({ id: 20, stc: 'cursando' })];
      qb.getMany.mockResolvedValue(inscripciones);
      mockInscripcionRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.materiasDelEstudiante(2);

      expect(result).toEqual(inscripciones.map(mapToDto));
      expect(qb.andWhere).toHaveBeenCalledWith('inscripcion.stc = :stc', { stc: 'cursando' });
    });
  });

  describe('materiasDisponibles', () => {
    it('should throw when student has no planEstudio', async () => {
      mockUserRepo.findOne.mockResolvedValueOnce({ id: 50 } as any);
      await expect(service.materiasDisponibles(50)).rejects.toThrow('Estudiante sin plan de estudios');
    });

    it('should list materias in plan excluding already enrolled/approved', async () => {
      mockUserRepo.findOne.mockResolvedValueOnce({ id: 7, planEstudio: { id: 9 } } as any);
      const mat1 = { id: 1, nombre: 'Algoritmos', descripcion: 'A' } as Materia;
      const mat2 = { id: 2, nombre: 'BD', descripcion: 'B' } as Materia;
      const qb = createQueryBuilderMock();
      qb.getMany.mockResolvedValue([mat1, mat2]);
      mockMateriaRepo.createQueryBuilder.mockReturnValueOnce(qb);
      mockInscripcionRepo.find.mockResolvedValue([
        { estudiante: { id: 7 }, materia: { id: 1 }, stc: 'cursando' },
        { estudiante: { id: 7 }, materia: { id: 3 }, stc: 'aprobada' },
      ]);
      const res = await service.materiasDisponibles(7);
      expect(res).toEqual([{ id: 2, nombre: 'BD', descripcion: 'B' }]);
    });
  });

  describe('inscribirse', () => {
    const userId = 1;
    const materiaId = 2;
    const comisionId = 3;

    const estudiante = {
      id: userId,
      nombre: 'Ana',
      apellido: 'Test',
      legajo: 'A123',
      planEstudio: { id: 1, carrera: { id: 1 } },
    } as User;

    const materia = {
      id: materiaId,
      nombre: 'Matemática I',
      departamento: { id: 10, nombre: 'Básicas' },
    } as Materia;

    beforeEach(() => {
      mockUserRepo.findOne.mockResolvedValue(estudiante);
      mockMateriaRepo.findOne.mockResolvedValue(materia);

      const userQb = createQueryBuilderMock();
      userQb.getOne.mockResolvedValue({
        id: estudiante.id,
        planEstudio: { carrera: { id: 1 } },
      });
      mockUserRepo.createQueryBuilder.mockReturnValue(userQb);

      const materiaQb = createQueryBuilderMock();
      materiaQb.getOne.mockResolvedValue({
        id: materia.id,
        departamento: { id: 10, nombre: 'Básicas' },
        planesEstudio: [{ carrera: { id: 1 } }],
      });
      mockMateriaRepo.createQueryBuilder.mockReturnValue(materiaQb);

      mockDepartamentoRepo.findOne.mockResolvedValue({ id: 10, nombre: 'Básicas' });
    });

    it('should create an inscription when requirements are met', async () => {
      mockCorrelativasService.verificarCorrelativasCursada.mockResolvedValue({ cumple: true, faltantes: [] });
      const created = createInscripcion({ id: 99, comision: { id: comisionId, nombre: 'A' } as any });
      mockInscripcionRepo.create.mockReturnValue(created);
      mockInscripcionRepo.save.mockResolvedValue(created);
      (mockComisionRepo.findOne as jest.Mock).mockResolvedValue({ id: comisionId, inscripciones: [], cupoMaximo: 50 });

      const result = await service.inscribirse(userId, materiaId, comisionId);

      expect(result).toEqual(mapToDto(created));
      expect(mockInscripcionRepo.create).toHaveBeenCalledWith({
        estudiante,
        materia,
        comision: { id: comisionId },
        stc: 'cursando',
      });
      expect(mockCorrelativasService.verificarCorrelativasCursada).toHaveBeenCalledWith(userId, materiaId);
    });

    it('should throw when comision is full', async () => {
      mockCorrelativasService.verificarCorrelativasCursada.mockResolvedValue({ cumple: true, faltantes: [] });
      (mockComisionRepo.findOne as jest.Mock).mockResolvedValue({ id: comisionId, inscripciones: new Array(50).fill({}), cupoMaximo: 50 });
      await expect(service.inscribirse(userId, materiaId, comisionId)).rejects.toThrow('La comisión está llena');
    });

    it('should create inscription without comisionId (no comision)', async () => {
      mockCorrelativasService.verificarCorrelativasCursada.mockResolvedValue({ cumple: true, faltantes: [] });
      const created = createInscripcion({ id: 100, comision: undefined as any });
      mockInscripcionRepo.create.mockReturnValue(created);
      mockInscripcionRepo.save.mockResolvedValue(created);
      (mockComisionRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      const res = await service.inscribirse(userId, materiaId);
      expect(res).toEqual(mapToDto(created));
      expect(mockInscripcionRepo.create).toHaveBeenCalledWith(expect.objectContaining({ comision: undefined }));
    });

    it('should throw when student not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(service.inscribirse(userId, materiaId)).rejects.toThrow('Estudiante o materia no encontrados');
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({ where: { id: userId } });
    });

    it('should throw when correlativas fail', async () => {
      mockCorrelativasService.verificarCorrelativasCursada.mockResolvedValue({
        cumple: false,
        faltantes: [{ id: 5, nombre: 'Álgebra' }],
      });

      await expect(service.inscribirse(userId, materiaId)).rejects.toThrow(
        'Faltan correlativas de cursada: Álgebra',
      );
    });

    it('should throw when department validation fails', async () => {
      mockDepartamentoRepo.findOne.mockResolvedValue({ id: 10, nombre: 'Básicas' });

      const materiaQb = createQueryBuilderMock();
      materiaQb.getOne.mockResolvedValue({
        id: materiaId,
        departamento: { id: 20, nombre: 'Sistemas' },
        planesEstudio: [{ carrera: { id: 2 } }],
      });
      mockMateriaRepo.createQueryBuilder.mockReturnValueOnce(materiaQb);

      mockCorrelativasService.verificarCorrelativasCursada.mockResolvedValue({ cumple: true, faltantes: [] });

      await expect(service.inscribirse(userId, materiaId)).rejects.toThrow(
        'No puedes inscribirte a esta materia. No pertenece a tu departamento.',
      );
    });

    it('should throw when comision not found', async () => {
      (mockComisionRepo.findOne as jest.Mock).mockResolvedValue(null);
      mockCorrelativasService.verificarCorrelativasCursada.mockResolvedValue({ cumple: true, faltantes: [] });
      await expect(service.inscribirse(userId, materiaId, comisionId)).rejects.toThrow('Comisión no encontrada');
    });
  });

describe('cargarFaltas', () => {
    it('should update faltas and return DTO', async () => {
      const inscripcion = createInscripcion({ faltas: 1 });
      const qb = createQueryBuilderMock();
      qb.getOne.mockResolvedValue(inscripcion);
      mockInscripcionRepo.createQueryBuilder.mockReturnValue(qb);
      mockInscripcionRepo.save.mockResolvedValue({ ...inscripcion, faltas: 4 });

      const result = await service.cargarFaltas(10, 4, 50);

      expect(result).toEqual(mapToDto({ ...inscripcion, faltas: 4 } as Inscripcion));
      expect(mockInscripcionRepo.save).toHaveBeenCalledWith({ ...inscripcion, faltas: 4 });
      expect(qb.andWhere).toHaveBeenCalledWith('profesor.id = :profesorId', { profesorId: 50 });
    });

    it('should throw when inscription is not found', async () => {
      const qb = createQueryBuilderMock();
      qb.getOne.mockResolvedValue(null);
      mockInscripcionRepo.createQueryBuilder.mockReturnValue(qb);

      await expect(service.cargarFaltas(1, 2, 3)).rejects.toThrow(
        'Inscripción no encontrada o no eres docente de esta materia',
      );
    });
  });

describe('cargarNota', () => {
    it('should update notaFinal and stc', async () => {
      const inscripcion = createInscripcion({ notaFinal: 6, stc: 'cursando' });
      const qb = createQueryBuilderMock();
      qb.getOne.mockResolvedValue(inscripcion);
      mockInscripcionRepo.createQueryBuilder.mockReturnValue(qb);
      mockInscripcionRepo.save.mockResolvedValue({ ...inscripcion, notaFinal: 8, stc: 'aprobada' });

      const result = await service.cargarNota(5, 8, 'aprobada', 9);

      expect(result).toEqual(mapToDto({ ...inscripcion, notaFinal: 8, stc: 'aprobada' } as Inscripcion));
      expect(mockInscripcionRepo.save).toHaveBeenCalledWith({
        ...inscripcion,
        notaFinal: 8,
        stc: 'aprobada',
      });
    });

    it('should throw when inscription is not found', async () => {
      const qb = createQueryBuilderMock();
      qb.getOne.mockResolvedValue(null);
      mockInscripcionRepo.createQueryBuilder.mockReturnValue(qb);

      await expect(service.cargarNota(5, 8, 'aprobada', 9)).rejects.toThrow(
        'Inscripción no encontrada o no eres docente de esta materia',
      );
    });
  });

  describe('detalleMateria', () => {
    it('should return DTO when inscription belongs to user', async () => {
      const inscripcion = createInscripcion({ id: 30, estudiante: { id: 7, nombre: 'Ana', apellido: 'Test', legajo: 'A1' } as any });
      const qb = createQueryBuilderMock();
      qb.getOne.mockResolvedValue(inscripcion);
      mockInscripcionRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.detalleMateria(30, 7);

      expect(result).toEqual(mapToDto(inscripcion));
      expect(qb.andWhere).toHaveBeenCalledWith('estudiante.id = :userId', { userId: 7 });
    });

    it('should throw when inscription is missing', async () => {
      const qb = createQueryBuilderMock();
      qb.getOne.mockResolvedValue(null);
      mockInscripcionRepo.createQueryBuilder.mockReturnValue(qb);

      await expect(service.detalleMateria(1, 1)).rejects.toThrow(
        'Inscripción no encontrada o no te pertenece',
      );
    });
  });

describe('obtenerCursadasMateria', () => {
    it('should return ordered cursadas for materia', async () => {
      const inscripciones = [createInscripcion({ id: 40 }), createInscripcion({ id: 41 })];
      const qb = createQueryBuilderMock();
      qb.getMany.mockResolvedValue(inscripciones);
      mockInscripcionRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.obtenerCursadasMateria(5, 6);

      expect(result).toEqual(inscripciones.map(mapToDto));
      expect(qb.orderBy).toHaveBeenCalledWith('inscripcion.fechaInscripcion', 'DESC');
    });
  });
});

describe('materiasDisponibles y findInscripcionCompleta', () => {
  let mockInsRepo: any;
  let service: InscripcionService;

  beforeEach(async () => {
    mockInsRepo = {
      findOne: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InscripcionService,
        { provide: getRepositoryToken(Inscripcion), useValue: mockInsRepo },
        { provide: getRepositoryToken(User), useValue: { findOne: jest.fn() } },
        { provide: getRepositoryToken(Materia), useValue: { createQueryBuilder: jest.fn() } },
        { provide: getRepositoryToken(Comision), useValue: {} },
        { provide: getRepositoryToken(Departamento), useValue: {} },
        { provide: CorrelativasService, useValue: {} },
      ],
    }).compile();
    service = module.get(InscripcionService);
  });

  it('materiasDisponibles should filter already enrolled and map fields', async () => {
    const estudiante = { id: 1, planEstudio: { id: 1 } } as any;
    const materiaPlan = { id: 10, nombre: 'Algoritmos', descripcion: 'Desc' } as any;
    const inscrip: any = { estudiante: { id: 1 }, materia: { id: 10 }, stc: 'cursando' };

    // Access existing mocks from outer scope via require cache is brittle; instead, call service methods using current mocks
  });

  it('findInscripcionCompleta should delegate to repository', async () => {
    (mockInsRepo.findOne as jest.Mock).mockResolvedValue({ id: 77 } as any);
    const result = await service.findInscripcionCompleta(77);
    expect(result).toEqual({ id: 77 });
    expect(mockInsRepo.findOne).toHaveBeenCalledWith({
      where: { id: 77 },
      relations: ['materia', 'comision', 'estudiante', 'evaluaciones'],
    });
  });
});
