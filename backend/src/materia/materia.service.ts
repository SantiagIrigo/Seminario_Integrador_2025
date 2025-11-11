import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, getRepository } from 'typeorm';
import { Materia } from './entities/materia.entity';
import { CreateMateriaDto } from './dto/create-materia.dto';
import { UpdateMateriaDto } from './dto/update-materia.dto';
import { PlanEstudio } from '../plan-estudio/entities/plan-estudio.entity';
import { User } from '../user/entities/user.entity';
import { Departamento } from '../departamento/entities/departamento.entity';
import { MateriaPlanEstudio } from './entities/materia-plan-estudio.entity';
import { MateriaResponseDto } from './dto/materia-response.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
// import { Inscripcion } // from '../../inscripcion/entities/inscripcion.entity';

@Injectable()
export class MateriaService {
  constructor(
    @InjectRepository(Materia)
    private readonly materiaRepository: Repository<Materia>,
    @InjectRepository(PlanEstudio)
    private readonly planEstudioRepository: Repository<PlanEstudio>,
    @InjectRepository(Departamento)
    private readonly departamentoRepo: Repository<Departamento>,
    @InjectRepository(MateriaPlanEstudio)
    private readonly materiaPlanRepo: Repository<MateriaPlanEstudio>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>, // ← Agrega esta línea
  ) {}

  async create(createMateriaDto: CreateMateriaDto): Promise<MateriaResponseDto> {
    const { planesEstudioConNivel, ...materiaData } = createMateriaDto;
    const materia = this.materiaRepository.create(materiaData);
    const savedMateria = await this.materiaRepository.save(materia);

    if (planesEstudioConNivel && Array.isArray(planesEstudioConNivel)) {
      for (const item of planesEstudioConNivel) {
        const plan = await this.planEstudioRepository.findOne({ where: { id: item.planEstudioId } });
        if (plan) {
          const relacion = this.materiaPlanRepo.create({
            materiaId: savedMateria.id,
            planEstudioId: plan.id,
            nivel: item.nivel,
          });
          await this.materiaPlanRepo.save(relacion);
        }
      }
    }

    const result = await this.materiaRepository
      .createQueryBuilder('materia')
      .leftJoinAndSelect('materia.relacionesConPlanes', 'relacion')
      .leftJoinAndSelect('relacion.planEstudio', 'planEstudio')
      .leftJoinAndSelect('planEstudio.carrera', 'carrera')
      .leftJoinAndSelect('materia.departamento', 'departamento')
      .where('materia.id = :id', { id: savedMateria.id })
      .select([
        'materia.id',
        'materia.nombre',
        'materia.descripcion',
        'departamento.id',
        'departamento.nombre',
        'relacion.nivel',
        'planEstudio.id',
        'planEstudio.nombre',
        'carrera.id',
        'carrera.nombre',
      ])
      .getOne();
    
    if (!result) {
      throw new NotFoundException(`Materia con ID ${savedMateria.id} no encontrada después de la creación`);
    }
    
    return this.mapToResponseDto(result);
  }

  async findAll(page: number = 1, limit: number = 10): Promise<PaginatedResponseDto<MateriaResponseDto>> {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const total = await this.materiaRepository.count();
    const offset = (page - 1) * safeLimit;
    const totalPages = Math.ceil(total / safeLimit);

    const materias = await this.materiaRepository
      .createQueryBuilder('materia')
      .leftJoinAndSelect('materia.relacionesConPlanes', 'relacion')
      .leftJoinAndSelect('relacion.planEstudio', 'planEstudio')
      .leftJoinAndSelect('planEstudio.carrera', 'carrera')
      .leftJoinAndSelect('materia.departamento', 'departamento')
      .select([
        'materia.id',
        'materia.nombre',
        'materia.descripcion',
        'departamento.id',
        'departamento.nombre',
        'relacion.nivel',
        'planEstudio.id',
        'planEstudio.nombre',
        'carrera.id',
        'carrera.nombre',
      ])
      .skip(offset)
      .take(safeLimit)
      .getMany();

    return {
      data: materias.map(m => this.mapToResponseDto(m)),
      total,
      page,
      limit: safeLimit,
      totalPages,
    };
  }

  async findWithFilters(
    filters: {
      nombre?: string;
      departamentoId?: number;
      carreraId?: number;
      planEstudioId?: number;
      nivel?: number;
    },
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResponseDto<MateriaResponseDto>> {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const { nombre, departamentoId, carreraId, planEstudioId, nivel } = filters;
    const queryBuilder = this.materiaRepository
      .createQueryBuilder('materia')
      .leftJoinAndSelect('materia.relacionesConPlanes', 'relacion')
      .leftJoinAndSelect('relacion.planEstudio', 'planEstudio')
      .leftJoinAndSelect('planEstudio.carrera', 'carrera')
      .leftJoinAndSelect('materia.departamento', 'departamento')
      .select([
        'materia.id',
        'materia.nombre',
        'materia.descripcion',
        'departamento.id',
        'departamento.nombre',
        'relacion.nivel',
        'planEstudio.id',
        'planEstudio.nombre',
        'carrera.id',
        'carrera.nombre',
      ]);

    if (nombre) {
      queryBuilder.andWhere('materia.nombre ILIKE :nombre', { nombre: `%${nombre}%` });
    }
    if (departamentoId) {
      queryBuilder.andWhere('departamento.id = :departamentoId', { departamentoId });
    }
    if (carreraId) {
      queryBuilder.andWhere('carrera.id = :carreraId', { carreraId });
    }
    if (planEstudioId) {
      queryBuilder.andWhere('planEstudio.id = :planEstudioId', { planEstudioId });
    }
    if (nivel !== undefined) {
      queryBuilder.andWhere('relacion.nivel = :nivel', { nivel });
    }

    const total = await queryBuilder.getCount();
    const offset = (page - 1) * safeLimit;
    const totalPages = Math.ceil(total / safeLimit);

    const materias = await queryBuilder
      .skip(offset)
      .take(safeLimit)
      .getMany();

    return {
      data: materias.map(m => this.mapToResponseDto(m)),
      total,
      page,
      limit: safeLimit,
      totalPages,
    };
  }

  async findOne(id: number): Promise<MateriaResponseDto> {
    const materia = await this.materiaRepository
      .createQueryBuilder('materia')
      .leftJoinAndSelect('materia.relacionesConPlanes', 'relacion')
      .leftJoinAndSelect('relacion.planEstudio', 'planEstudio')
      .leftJoinAndSelect('planEstudio.carrera', 'carrera')
      .leftJoinAndSelect('materia.departamento', 'departamento')
      .where('materia.id = :id', { id })
      .select([
        'materia.id',
        'materia.nombre',
        'materia.descripcion',
        'departamento.id',
        'departamento.nombre',
        'relacion.nivel',
        'planEstudio.id',
        'planEstudio.nombre',
        'carrera.id',
        'carrera.nombre',
      ])
      .getOne();
    if (!materia) {
      throw new NotFoundException(`Materia con ID ${id} no encontrada`);
    }
    return this.mapToResponseDto(materia);
  }

  async update(id: number, updateMateriaDto: UpdateMateriaDto): Promise<MateriaResponseDto> {
    const { planesEstudioConNivel, ...materiaData } = updateMateriaDto;
    const existingMateria = await this.materiaRepository.findOne({ where: { id } });
    if (!existingMateria) {
      throw new NotFoundException(`Materia con ID ${id} no encontrada`);
    }

    Object.assign(existingMateria, materiaData);
    await this.materiaRepository.save(existingMateria);

    if (planesEstudioConNivel !== undefined) {
      await this.materiaPlanRepo.delete({ materiaId: id });
      if (Array.isArray(planesEstudioConNivel)) {
        for (const item of planesEstudioConNivel) {
          const plan = await this.planEstudioRepository.findOne({ where: { id: item.planEstudioId } });
          if (plan) {
            const relacion = this.materiaPlanRepo.create({
              materiaId: id,
              planEstudioId: plan.id,
              nivel: item.nivel,
            });
            await this.materiaPlanRepo.save(relacion);
          }
        }
      }
    }

    return this.findOne(id);
  }

  async remove(id: number): Promise<MateriaResponseDto> {
    const materia = await this.materiaRepository.findOne({ where: { id } });
    if (!materia) {
      throw new NotFoundException('Materia no encontrada');
    }
    await this.materiaPlanRepo.delete({ materiaId: id });
    await this.materiaRepository.delete(id);
    return this.mapToResponseDto(materia);
  }

  async getMateriasPorPlan(planEstudioId: number): Promise<MateriaResponseDto[]> {
    const materias = await this.materiaRepository
      .createQueryBuilder('materia')
      .leftJoinAndSelect('materia.relacionesConPlanes', 'relacion')
      .leftJoinAndSelect('relacion.planEstudio', 'planEstudio')
      .leftJoinAndSelect('planEstudio.carrera', 'carrera')
      .leftJoinAndSelect('materia.departamento', 'departamento')
      .leftJoinAndSelect('materia.comisiones', 'comision')
      .leftJoinAndSelect('comision.horarios', 'horario')
      .leftJoinAndSelect('materia.correlativasCursada', 'corrCursada')
      .leftJoinAndSelect('corrCursada.correlativa', 'corrCursadaMateria')
      .leftJoinAndSelect('materia.correlativasFinal', 'corrFinal')
      .leftJoinAndSelect('corrFinal.correlativa', 'corrFinalMateria')
      .where('planEstudio.id = :planEstudioId', { planEstudioId })
      .select([
        'materia.id',
        'materia.nombre',
        'materia.descripcion',
        'departamento.id',
        'departamento.nombre',
        'relacion.nivel',
        'planEstudio.id',
        'planEstudio.nombre',
        'carrera.id',
        'carrera.nombre',
'comision.id',
        'comision.nombre',
        'comision.cupoMaximo',
        'horario.dia',
        'horario.horaInicio',
        'horario.horaFin',
        'horario.aula',
        'corrCursada.id',
        'corrCursadaMateria.id',
        'corrCursadaMateria.nombre',
        'corrFinal.id',
        'corrFinalMateria.id',
        'corrFinalMateria.nombre',
      ])
      .getMany();

    return materias.map(m => this.mapToResponseDto(m));
  }

  async usuarioTieneAccesoAlPlan(userId: number, planEstudioId: number): Promise<boolean> {
    console.log(`🔍 Verificando acceso del usuario ${userId} al plan ${planEstudioId}`);

    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.planEstudio', 'planEstudio')
      .where('user.id = :userId', { userId })
      .select(['user.id'])
      .addSelect(['planEstudio.id'])
      .getOne();

    console.log('Usuario encontrado:', {
      userId: user?.id,
      planEstudioId: user?.planEstudio?.id,
      requestedPlanId: planEstudioId
    });

    const tieneAcceso = user?.planEstudio?.id === planEstudioId;
    console.log('¿Tiene acceso?', tieneAcceso);

    return tieneAcceso;
  }

  async findMateriasDisponibles(estudianteId: number): Promise<MateriaResponseDto[]> {
    const estudiante = await this.userRepository.findOne({ where: { id: estudianteId } });
    if (!estudiante?.planEstudio?.carrera) {
      throw new NotFoundException('Estudiante o carrera no encontrados');
    }
    // Departamento "Básicas"
    await this.departamentoRepo.findOne({ where: { nombre: 'Básicas' } });
    const materias = await this.materiaRepository.createQueryBuilder('materia').getMany();
    return materias.map(m => this.mapToResponseDto(m));
  }

  async findMateriasByPlanEstudio(planEstudioId: number): Promise<MateriaResponseDto[]> {
    const materias = await this.materiaRepository
      .createQueryBuilder('materia')
      .leftJoinAndSelect('materia.relacionesConPlanes', 'relacion')
      .leftJoinAndSelect('relacion.planEstudio', 'planEstudio')
      .leftJoinAndSelect('planEstudio.carrera', 'carrera')
      .leftJoinAndSelect('materia.departamento', 'departamento')
      .where('relacion.planEstudioId = :planEstudioId', { planEstudioId })
      .select([
        'materia.id',
        'materia.nombre',
        'materia.descripcion',
        'departamento.id',
        'departamento.nombre',
        'relacion.nivel',
        'planEstudio.id',
        'planEstudio.nombre',
        'carrera.id',
        'carrera.nombre',
      ])
      .getMany();

    return materias.map(materia => this.mapToResponseDto(materia));
  }

  private mapToResponseDto(materia: Materia): MateriaResponseDto {
    return {
      id: materia.id,
      nombre: materia.nombre,
      descripcion: materia.descripcion,
      departamento: {
        id: materia.departamento.id,
        nombre: materia.departamento.nombre,
      },
      nivel: materia.relacionesConPlanes?.[0]?.nivel,
      correlativasCursada: materia.correlativasCursada?.map(c => ({
        id: c.correlativa.id,
        nombre: c.correlativa.nombre,
      })) || [],
      correlativasFinal: materia.correlativasFinal?.map(c => ({
        id: c.correlativa.id,
        nombre: c.correlativa.nombre,
      })) || [],
      planesEstudio: materia.relacionesConPlanes?.map(r => ({
        planEstudioId: r.planEstudio.id,
        planEstudioNombre: r.planEstudio.nombre,
        nivel: r.nivel,
        carrera: {
          id: r.planEstudio.carrera.id,
          nombre: r.planEstudio.carrera.nombre,
        },
      })) || [],
    };
  }
}
