// src/horario/horario.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HorarioService } from './horario.service';
import { Horario } from './entities/horario.entity';
import { Materia } from '../materia/entities/materia.entity';
import { User } from '../user/entities/user.entity';
import { Inscripcion } from '../inscripcion/entities/inscripcion.entity';
import { Comision } from '../comision/entities/comision.entity';
import { DiaSemana } from './entities/horario.entity';
import { BadRequestException } from '@nestjs/common';

describe('HorarioService', () => {
  let service: HorarioService;
  let mockHorarioRepo: any;
  let mockMateriaRepo: any;
  let mockUserRepo: any;
  let mockInscripcionRepo: any;
  let mockComisionRepo: any;

  beforeEach(async () => {
    // Crear mocks de repositorios
    mockHorarioRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
      remove: jest.fn(),
    };

    mockMateriaRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
    };

    mockUserRepo = {
      findOne: jest.fn(),
    };

    mockInscripcionRepo = {
      find: jest.fn(),
    };

    mockComisionRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HorarioService,
        {
          provide: getRepositoryToken(Horario),
          useValue: mockHorarioRepo,
        },
        {
          provide: getRepositoryToken(Materia),
          useValue: mockMateriaRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: getRepositoryToken(Inscripcion),
          useValue: mockInscripcionRepo,
        },
        {
          provide: getRepositoryToken(Comision),
          useValue: mockComisionRepo,
        },
      ],
    }).compile();

    service = module.get<HorarioService>(HorarioService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Tests específicos para verificar funcionalidad sin conexión real
  describe('crearHorario', () => {
    it('should create a schedule successfully', async () => {
      // Arrange
      const materiaId = 1;
      const dia = DiaSemana.LUNES;
      const horaInicio = '08:00';
      const horaFin = '10:00';
      const aula = 'Aula 101';
      
      const materia = {
        id: materiaId,
        nombre: 'Matemática'
      };

      const savedHorario = {
        id: 1,
        materia,
        dia,
        horaInicio,
        horaFin,
        aula,
        comision: null,
        docente: null
      };

      // Mock de los repositorios
      jest.spyOn(mockMateriaRepo, 'findOne').mockResolvedValue(materia as any);
      jest.spyOn(service as any, 'verificarSolapamiento').mockResolvedValue(false);
      jest.spyOn(mockHorarioRepo, 'create').mockImplementation((data) => data);
      jest.spyOn(mockHorarioRepo, 'save').mockResolvedValue(savedHorario as any);

      // Act
      const result = await service.crearHorario(
        materiaId,
        dia,
        horaInicio,
        horaFin,
        aula
      );

      // Assert
      expect(result).toEqual(savedHorario);
      expect(mockMateriaRepo.findOne).toHaveBeenCalledWith({ where: { id: materiaId } });
      expect((service as any).verificarSolapamiento).toHaveBeenCalledWith(
        materiaId,
        dia,
        horaInicio,
        horaFin,
        undefined,
        undefined
      );
      expect(mockHorarioRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when materia not found', async () => {
      // Arrange
      const materiaId = 1;
      
      // Mock de los repositorios
      jest.spyOn(mockMateriaRepo, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(service.crearHorario(
        materiaId,
        DiaSemana.LUNES,
        '08:00',
        '10:00',
        'Aula 101'
      )).rejects.toThrow('Materia no encontrada');
      
      expect(mockMateriaRepo.findOne).toHaveBeenCalledWith({ where: { id: materiaId } });
    });

    it('should throw BadRequestException when schedule overlaps', async () => {
      // Arrange
      const materiaId = 1;
      const dia = DiaSemana.LUNES;
      const horaInicio = '08:00';
      const horaFin = '10:00';
      
      const materia = {
        id: materiaId,
        nombre: 'Matemática'
      };

      // Mock de los repositorios
      jest.spyOn(mockMateriaRepo, 'findOne').mockResolvedValue(materia as any);
      jest.spyOn(service as any, 'verificarSolapamiento').mockResolvedValue(true);

      // Act & Assert
      await expect(service.crearHorario(
        materiaId,
        dia,
        horaInicio,
        horaFin,
        'Aula 101'
      )).rejects.toThrow('Ya existe un horario programado para este día y hora');
      
      expect(mockMateriaRepo.findOne).toHaveBeenCalledWith({ where: { id: materiaId } });
      expect((service as any).verificarSolapamiento).toHaveBeenCalledWith(
        materiaId,
        dia,
        horaInicio,
        horaFin,
        undefined,
        undefined
      );
    });

    it('should throw NotFoundException when comision not found', async () => {
      jest.spyOn(mockMateriaRepo, 'findOne').mockResolvedValue({ id: 1 } as any);
      jest.spyOn(service as any, 'verificarSolapamiento').mockResolvedValue(false);
      jest.spyOn(mockComisionRepo, 'findOne').mockResolvedValue(null);
      await expect(service.crearHorario(1, DiaSemana.LUNES, '08:00', '10:00', 'Aula', 99)).rejects.toThrow('Comisión no encontrada');
    });

    it('should throw NotFoundException when docente not found', async () => {
      jest.spyOn(mockMateriaRepo, 'findOne').mockResolvedValue({ id: 1 } as any);
      jest.spyOn(service as any, 'verificarSolapamiento').mockResolvedValue(false);
      jest.spyOn(mockComisionRepo, 'findOne').mockResolvedValue({ id: 1 });
      jest.spyOn(mockUserRepo, 'findOne').mockResolvedValue(null);
      await expect(service.crearHorario(1, DiaSemana.LUNES, '08:00', '10:00', 'Aula', 1, 77)).rejects.toThrow('Docente no encontrado');
    });

    it('throws when overlap exists (materiaId path)', async () => {
      jest.spyOn(mockMateriaRepo, 'findOne').mockResolvedValue({ id: 2 } as any);
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ id: 9 }),
      } as any;
      jest.spyOn(mockHorarioRepo, 'createQueryBuilder').mockReturnValue(qb);
      await expect(service.crearHorario(2, DiaSemana.MIERCOLES, '08:00', '09:00', 'C1', undefined, undefined)).rejects.toThrow(BadRequestException);
      expect(qb.andWhere).toHaveBeenCalledWith('horario.materiaId = :materiaId', { materiaId: 2 });
    });
  });

  describe('verificarSolapamiento', () => {
    it('should return false when no overlap found', async () => {
      // Arrange
      const materiaId = 1;
      const dia = DiaSemana.LUNES;
      const horaInicio = '08:00';
      const horaFin = '10:00';
      
      // Mock del QueryBuilder
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null)
      };
      
      jest.spyOn(mockHorarioRepo, 'createQueryBuilder').mockReturnValue(mockQueryBuilder);

      // Act
      const result = await service['verificarSolapamiento'](
        materiaId,
        dia,
        horaInicio,
        horaFin
      );

      // Assert
      expect(result).toBe(false);
      expect(mockHorarioRepo.createQueryBuilder).toHaveBeenCalledWith('horario');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('horario.dia = :dia', { dia });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('(horario.horaInicio < :horaFin AND horario.horaFin > :horaInicio)', { 
        horaInicio, 
        horaFin 
      });
      expect(mockQueryBuilder.getOne).toHaveBeenCalled();
    });

    it('should return true when overlap found', async () => {
      // Arrange
      const materiaId = 1;
      const dia = DiaSemana.LUNES;
      const horaInicio = '08:00';
      const horaFin = '10:00';
      
      const existingHorario = {
        id: 1,
        materia: { id: materiaId },
        dia,
        horaInicio,
        horaFin
      };

      // Mock del QueryBuilder
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(existingHorario)
      };
      
      jest.spyOn(mockHorarioRepo, 'createQueryBuilder').mockReturnValue(mockQueryBuilder);

      // Act
      const result = await service['verificarSolapamiento'](
        materiaId,
        dia,
        horaInicio,
        horaFin
      );

      // Assert
      expect(result).toBe(true);
      expect(mockHorarioRepo.createQueryBuilder).toHaveBeenCalledWith('horario');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('horario.dia = :dia', { dia });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('(horario.horaInicio < :horaFin AND horario.horaFin > :horaInicio)', { 
        horaInicio, 
        horaFin 
      });
      expect(mockQueryBuilder.getOne).toHaveBeenCalled();
    });
  });

  describe('obtenerHorariosPorMateria', () => {
    it('should return schedules by subject', async () => {
      // Arrange
      const materiaId = 1;
      
      const horarios = [
        {
          id: 1,
          dia: DiaSemana.LUNES,
          horaInicio: '08:00',
          horaFin: '10:00',
          aula: 'Aula 101',
          materia: { id: materiaId },
          comision: { id: 1, nombre: 'Comisión A' },
          docente: { id: 1, nombre: 'Profesor', apellido: 'Apellido' }
        }
      ];

      // Mock del repositorio
      jest.spyOn(mockHorarioRepo, 'find').mockResolvedValue(horarios as any);

      // Act
      const result = await service.obtenerHorariosPorMateria(materiaId);

      // Assert
      expect(result).toEqual(horarios);
      expect(mockHorarioRepo.find).toHaveBeenCalledWith({
        where: { materia: { id: materiaId } },
        relations: ['comision', 'docente'],
        order: { dia: 'ASC', horaInicio: 'ASC' },
      });
    });
  });

  describe('obtenerHorariosPorComision', () => {
    it('should return schedules by comision', async () => {
      const comisionId = 7;
      const horarios = [
        { id: 2, dia: DiaSemana.MARTES, horaInicio: '10:00', horaFin: '12:00', aula: 'Aula 202', comision: { id: comisionId }, materia: { id: 3 }, docente: { id: 9 } },
      ];
      jest.spyOn(mockHorarioRepo, 'find').mockResolvedValue(horarios as any);
      const result = await service.obtenerHorariosPorComision(comisionId);
      expect(result).toEqual(horarios);
      expect(mockHorarioRepo.find).toHaveBeenCalledWith({
        where: { comision: { id: comisionId } },
        relations: ['materia', 'docente'],
        order: { dia: 'ASC', horaInicio: 'ASC' },
      });
    });

  });

  describe('actualizarHorario', () => {
    it('should update schedule successfully', async () => {
      // Arrange
      const id = 1;
      const dia = DiaSemana.MARTES;
      const horaInicio = '10:00';
      const horaFin = '12:00';
      const aula = 'Aula 202';
      
      const existingHorario = {
        id,
        dia: DiaSemana.LUNES,
        horaInicio: '08:00',
        horaFin: '10:00',
        aula: 'Aula 101',
        materia: { id: 1 },
        comision: null,
        docente: null
      };

      const updatedHorario = {
        ...existingHorario,
        dia,
        horaInicio,
        horaFin,
        aula
      };

      // Mock de los repositorios
      jest.spyOn(mockHorarioRepo, 'findOne').mockResolvedValue(existingHorario as any);
      jest.spyOn(service as any, 'verificarSolapamiento').mockResolvedValue(false);
      jest.spyOn(mockHorarioRepo, 'save').mockResolvedValue(updatedHorario as any);

      // Act
      const result = await service.actualizarHorario(
        id,
        dia,
        horaInicio,
        horaFin,
        aula
      );

      // Assert
      expect(result).toEqual(updatedHorario);
      expect(mockHorarioRepo.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['materia']
      });
      expect((service as any).verificarSolapamiento).toHaveBeenCalledWith(
        existingHorario.materia.id,
        dia,
        horaInicio,
        horaFin,
        undefined,
        undefined
      );
      expect(mockHorarioRepo.save).toHaveBeenCalled();
    });

    it('can set valid comision and docente', async () => {
      const existing = { id: 1, dia: DiaSemana.LUNES, horaInicio: '08:00', horaFin: '10:00', aula: 'A', materia: { id: 2 }, comision: null, docente: null } as any;
      jest.spyOn(mockHorarioRepo, 'findOne').mockResolvedValue(existing);
      const qb = { where: jest.fn().mockReturnThis(), andWhere: jest.fn().mockReturnThis(), getOne: jest.fn().mockResolvedValue(null) } as any;
      jest.spyOn(mockHorarioRepo, 'createQueryBuilder').mockReturnValue(qb);
      jest.spyOn(mockComisionRepo, 'findOne').mockResolvedValue({ id: 6 });
      jest.spyOn(mockUserRepo, 'findOne').mockResolvedValue({ id: 7 });
      jest.spyOn(mockHorarioRepo, 'save').mockImplementation(async (h: any) => h);
      const res: any = await service.actualizarHorario(1, undefined, undefined, undefined, undefined, 6, 7);
      expect(res.comision.id).toBe(6);
      expect(res.docente.id).toBe(7);
    });

    it('should throw NotFoundException when comision to set not found', async () => {
      jest.spyOn(mockHorarioRepo, 'findOne').mockResolvedValue({ id: 1, materia: { id: 1 }, comision: null, docente: null } as any);
      jest.spyOn(service as any, 'verificarSolapamiento').mockResolvedValue(false);
      jest.spyOn(mockComisionRepo, 'findOne').mockResolvedValue(null);
      await expect(service.actualizarHorario(1, undefined, undefined, undefined, undefined, 99)).rejects.toThrow('Comisión no encontrada');
    });

    it('should throw NotFoundException when docente to set not found', async () => {
      jest.spyOn(mockHorarioRepo, 'findOne').mockResolvedValue({ id: 1, materia: { id: 1 }, comision: null, docente: null } as any);
      jest.spyOn(service as any, 'verificarSolapamiento').mockResolvedValue(false);
      jest.spyOn(mockUserRepo, 'findOne').mockResolvedValue(null);
      await expect(service.actualizarHorario(1, undefined, undefined, undefined, undefined, undefined, 77)).rejects.toThrow('Docente no encontrado');
    });

    it('should unset comision and docente when null provided', async () => {
      const existingHorario: any = { id: 1, materia: { id: 1 }, comision: { id: 5 }, docente: { id: 6 }, dia: DiaSemana.LUNES, horaInicio: '08:00', horaFin: '10:00', aula: 'A1' };
      jest.spyOn(mockHorarioRepo, 'findOne').mockResolvedValue(existingHorario);
      jest.spyOn(service as any, 'verificarSolapamiento').mockResolvedValue(false);
      jest.spyOn(mockHorarioRepo, 'save').mockImplementation(async (h: any) => h);
      const result = await service.actualizarHorario(1, undefined, undefined, undefined, undefined, null, null);
      expect(result.comision).toBeNull();
      expect(result.docente).toBeNull();
    });

    it('should throw NotFoundException when schedule not found', async () => {
      // Arrange
      const id = 1;
      
      // Mock del repositorio
      jest.spyOn(mockHorarioRepo, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(service.actualizarHorario(id)).rejects.toThrow('Horario no encontrado');
      expect(mockHorarioRepo.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['materia']
      });
    });
  });

  describe('eliminarHorario', () => {
    it('should delete schedule successfully', async () => {
      // Arrange
      const id = 1;
      
      const horario = {
        id,
        materia: { id: 1 }
      };

      // Mock del repositorio
      jest.spyOn(mockHorarioRepo, 'findOne').mockResolvedValue(horario as any);
      jest.spyOn(mockHorarioRepo, 'remove').mockResolvedValue(undefined);

      // Act
      await service.eliminarHorario(id);

      // Assert
      expect(mockHorarioRepo.findOne).toHaveBeenCalledWith({ where: { id } });
      expect(mockHorarioRepo.remove).toHaveBeenCalledWith(horario);
    });

    it('should throw NotFoundException when schedule not found', async () => {
      // Arrange
      const id = 1;
      
      // Mock del repositorio
      jest.spyOn(mockHorarioRepo, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(service.eliminarHorario(id)).rejects.toThrow('Horario no encontrado');
      expect(mockHorarioRepo.findOne).toHaveBeenCalledWith({ where: { id } });
    });

    it('should build blocks for admin using general horarios', async () => {
      jest.spyOn(mockUserRepo, 'findOne').mockResolvedValue({ id: 4, rol: 'admin' });
      jest.spyOn(mockHorarioRepo, 'find').mockResolvedValue([
        { dia: DiaSemana.LUNES, horaInicio: '08:00', horaFin: '10:00', aula: 'A1', materia: { id:1, nombre:'X', descripcion: 'DX' }, comision: null },
        { dia: DiaSemana.LUNES, horaInicio: '12:00', horaFin: '14:00', aula: 'A2', materia: { id:2, nombre:'Y', descripcion: 'DY' }, comision: { id: 9, nombre: 'C', descripcion: 'DC' } },
      ]);
      // Rango que incluye un lunes (2025-01-06 es lunes)
      const result = await service.obtenerHorarioPersonal(4, new Date('2025-01-05'), new Date('2025-01-07'));
      const lunes = result.find(d => d.diaSemana === DiaSemana.LUNES)!;
      expect(lunes.bloques.length).toBe(2);
    });
  });

  describe('obtenerHorarioPersonal (estudiante y profesor)', () => {
    it('builds schedule for estudiante using inscripciones', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: 10, rol: 'estudiante' });
      mockInscripcionRepo.find.mockResolvedValue([
        {
          materia: {
            id: 1,
            nombre: 'Algoritmos',
            descripcion: 'Desc',
            horarios: [
              { dia: DiaSemana.LUNES, horaInicio: '08:00', horaFin: '10:00', aula: 'A1', comision: null },
            ],
            comisiones: [
              {
                id: 5,
                nombre: 'A',
                descripcion: 'C A',
                horarios: [
                  { dia: DiaSemana.LUNES, horaInicio: '12:00', horaFin: '14:00', aula: 'A2' },
                ],
              },
            ],
          },
        },
      ]);
      const out = await service.obtenerHorarioPersonal(10, new Date('2025-01-05'), new Date('2025-01-07'));
      const lunes = out.find(d => d.diaSemana === DiaSemana.LUNES)!;
      expect(lunes.bloques.map(b => b.horaInicio)).toEqual(['08:00','12:00']);
      expect(lunes.bloques[1].comision?.id).toBe(5);
      // Should be sorted
      expect(lunes.bloques[0].horaInicio < lunes.bloques[1].horaInicio).toBe(true);
    });

    it('builds schedule for profesor using materias', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: 11, rol: 'profesor' });
      mockMateriaRepo.find.mockResolvedValue([
        {
          id: 2,
          nombre: 'BD',
          descripcion: 'Desc',
          horarios: [
            { dia: DiaSemana.MARTES, horaInicio: '09:00', horaFin: '10:00', aula: 'B1', comision: null },
          ],
          comisiones: [
            {
              id: 7,
              nombre: 'B',
              descripcion: 'C B',
              horarios: [
                { dia: DiaSemana.MARTES, horaInicio: '11:00', horaFin: '12:00', aula: 'B2' },
              ],
            },
          ],
        },
      ]);
      const out = await service.obtenerHorarioPersonal(11, new Date('2025-01-06'), new Date('2025-01-08'));
      const martes = out.find(d => d.diaSemana === DiaSemana.MARTES)!;
      expect(martes.bloques.length).toBe(2);
      expect(martes.bloques[0].esProfesor).toBe(true);
      expect(martes.bloques[1].comision?.id).toBe(7);
    });
  });

  describe('errores y helpers adicionales', () => {
    it('obtenerHorarioPersonal should throw when user not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      await expect(service.obtenerHorarioPersonal(999)).rejects.toThrow('Usuario no encontrado');
    });
  });

  describe('helpers', () => {
    it('getDiasEntreFechas should include both endpoints', () => {
      const start = new Date('2025-01-01');
      const end = new Date('2025-01-03');
      const fechas = (service as any).getDiasEntreFechas(start, end);
      expect(fechas.length).toBe(3);
    });

    it('getDiaSemana should map all days', () => {
      const days = [0,1,2,3,4,5,6];
      const mapped = days.map(d => {
        const date = new Date('2025-01-05'); // Sunday
        date.setDate(date.getDate() + d);
        return (service as any).getDiaSemana(date);
      });
      expect(mapped).toContain(DiaSemana.DOMINGO);
      expect(mapped).toContain(DiaSemana.SABADO);
    });
  });

  describe('obtenerHorarioPersonal', () => {
    it('should throw NotFoundException when user not found', async () => {
      jest.spyOn(mockUserRepo, 'findOne').mockResolvedValue(null);
      await expect(service.obtenerHorarioPersonal(999)).rejects.toThrow('Usuario no encontrado');
    });

    it('should call agregarHorariosEstudiante for estudiante role', async () => {
      jest.spyOn(mockUserRepo, 'findOne').mockResolvedValue({ id: 1, rol: 'estudiante' });
      const spy = jest.spyOn<any, any>(service as any, 'agregarHorariosEstudiante').mockResolvedValue(undefined);
      const result = await service.obtenerHorarioPersonal(1, new Date('2025-01-01'), new Date('2025-01-02'));
      expect(spy).toHaveBeenCalled();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should call agregarHorariosProfesor for profesor role', async () => {
      jest.spyOn(mockUserRepo, 'findOne').mockResolvedValue({ id: 2, rol: 'profesor' });
      const spy = jest.spyOn<any, any>(service as any, 'agregarHorariosProfesor').mockResolvedValue(undefined);
      const result = await service.obtenerHorarioPersonal(2, new Date('2025-01-01'), new Date('2025-01-02'));
      expect(spy).toHaveBeenCalled();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should call agregarHorariosGeneral for other roles', async () => {
      jest.spyOn(mockUserRepo, 'findOne').mockResolvedValue({ id: 3, rol: 'admin' });
      const spy = jest.spyOn<any, any>(service as any, 'agregarHorariosGeneral').mockResolvedValue(undefined);
      const result = await service.obtenerHorarioPersonal(3, new Date('2025-01-01'), new Date('2025-01-02'));
      expect(spy).toHaveBeenCalled();
      expect(result.length).toBeGreaterThan(0);
    });
  });
});