import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PlanEstudioService } from '../plan-estudio/plan-estudio.service';
import { UserResponseDto } from './dto/user-response.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private planEstudioService: PlanEstudioService,
  ) {}

  async create(userData: CreateUserDto): Promise<UserResponseDto> {
    let planEstudio;
    if (userData.planEstudioId) {
      planEstudio = await this.planEstudioService.findOne(userData.planEstudioId);
    }
    
    const { planEstudioId, ...rest } = userData;
    const user = this.userRepository.create({
      ...rest,
      ...(planEstudio ? { planEstudio } : {}),
    });
    
    const savedUser = await this.userRepository.save(user);
    return this.mapToResponseDto(savedUser);
  }

  async findByEmail(email: string): Promise<UserResponseDto | undefined> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.planEstudio', 'planEstudio')
      .leftJoinAndSelect('planEstudio.carrera', 'carrera')
      .where('user.email = :email', { email })
      .select([
        'user.id',
        'user.nombre',
        'user.apellido',
        'user.email',
        'user.legajo',
        'user.dni',
        'user.rol',
        'user.createdAt',
        'planEstudio.id',
        'planEstudio.nombre',
        'carrera.id',
        'carrera.nombre',
      ])
      .getOne();
    return user ? this.mapToResponseDto(user) : undefined;
  }

  async findByEmailWithPassword(email: string): Promise<User | undefined> {
    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'nombre', 'apellido', 'legajo', 'dni', 'rol', 'createdAt']
    });
    return user ?? undefined;
  }

  async findByLegajo(legajo: string): Promise<UserResponseDto | undefined> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.planEstudio', 'planEstudio')
      .leftJoinAndSelect('planEstudio.carrera', 'carrera')
      .where('user.legajo = :legajo', { legajo })
      .select([
        'user.id',
        'user.nombre',
        'user.apellido',
        'user.email',
        'user.legajo',
        'user.dni',
        'user.rol',
        'user.createdAt',
        'planEstudio.id',
        'planEstudio.nombre',
        'carrera.id',
        'carrera.nombre',
      ])
      .getOne();
    return user ? this.mapToResponseDto(user) : undefined;
  }

  async findByLegajoWithPassword(legajo: string): Promise<User | undefined> {
    const user = await this.userRepository.findOne({
      where: { legajo },
      select: ['id', 'email', 'password', 'nombre', 'apellido', 'legajo', 'dni', 'rol', 'createdAt']
    });
    return user ?? undefined;
  }

  async findById(id: number): Promise<UserResponseDto | undefined> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.planEstudio', 'planEstudio')
      .leftJoinAndSelect('planEstudio.carrera', 'carrera')
      .where('user.id = :id', { id })
      .select([
        'user.id',
        'user.nombre',
        'user.apellido',
        'user.email',
        'user.legajo',
        'user.dni',
        'user.rol',
        'user.createdAt',
        'planEstudio.id',
        'planEstudio.nombre',
        'carrera.id',
        'carrera.nombre',
      ])
      .getOne();
    return user ? this.mapToResponseDto(user) : undefined;
  }

  async findAll(page: number = 1, limit: number = 10): Promise<PaginatedResponseDto<UserResponseDto>> {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const total = await this.userRepository.count();
    const offset = (page - 1) * safeLimit;
    const totalPages = Math.ceil(total / safeLimit);

    const users = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.planEstudio', 'planEstudio')
      .leftJoinAndSelect('planEstudio.carrera', 'carrera')
      .select([
        'user.id',
        'user.nombre',
        'user.apellido',
        'user.email',
        'user.legajo',
        'user.dni',
        'user.rol',
        'user.createdAt',
        'planEstudio.id',
        'planEstudio.nombre',
        'carrera.id',
        'carrera.nombre',
      ])
      .skip(offset)
      .take(safeLimit)
      .getMany();

    return {
      data: users.map(user => this.mapToResponseDto(user)),
      total,
      page,
      limit: safeLimit,
      totalPages,
    };
  }

  async findWithFilters(
    filters: {
      legajo?: string;
      nombre?: string;
      apellido?: string;
      dni?: string;
      year?: number;
    },
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResponseDto<UserResponseDto>> {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const { legajo, nombre, apellido, dni, year } = filters;
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.planEstudio', 'planEstudio')
      .leftJoinAndSelect('planEstudio.carrera', 'carrera')
      .select([
        'user.id',
        'user.nombre',
        'user.apellido',
        'user.email',
        'user.legajo',
        'user.dni',
        'user.rol',
        'user.createdAt',
        'planEstudio.id',
        'planEstudio.nombre',
        'carrera.id',
        'carrera.nombre',
      ]);

    if (legajo) {
      queryBuilder.andWhere('user.legajo ILIKE :legajo', { legajo: `%${legajo}%` });
    }
    if (nombre) {
      queryBuilder.andWhere('user.nombre ILIKE :nombre', { nombre: `%${nombre}%` });
    }
    if (apellido) {
      queryBuilder.andWhere('user.apellido ILIKE :apellido', { apellido: `%${apellido}%` });
    }
    if (dni) {
      queryBuilder.andWhere('user.dni ILIKE :dni', { dni: `%${dni}%` });
    }
    if (year) {
      queryBuilder.andWhere('EXTRACT(YEAR FROM user.createdAt) = :year', { year });
    }

    const total = await queryBuilder.getCount();
    const offset = (page - 1) * safeLimit;
    const totalPages = Math.ceil(total / safeLimit);

    const users = await queryBuilder
      .skip(offset)
      .take(safeLimit)
      .getMany();

    return {
      data: users.map(user => this.mapToResponseDto(user)),
      total,
      page,
      limit: safeLimit,
      totalPages,
    };
  }

  async update(id: number, updateData: UpdateUserDto): Promise<UserResponseDto | undefined> {
    // Validar plan de estudio si se envía un ID
    let planEstudioIdToSet: number | undefined = undefined;
    if (updateData.planEstudioId) {
      const plan = await this.planEstudioService.findOne(updateData.planEstudioId);
      planEstudioIdToSet = plan?.id;
    }

    const { planEstudioId, ...rest } = updateData;

    // Ejecutar update directo (más simple para tests) y luego devolver el usuario actualizado
    await this.userRepository.update(id, {
      ...rest,
      ...(planEstudioIdToSet ? { planEstudioId: planEstudioIdToSet } : {}),
    } as any);

    return this.findById(id);
  }


  async remove(id: number): Promise<void> {
    await this.userRepository.delete(id);
  }

  private mapToResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      legajo: user.legajo,
      dni: user.dni,
      rol: user.rol,
      createdAt: user.createdAt,
      planEstudio: user.planEstudio ? {
        id: user.planEstudio.id,
        nombre: user.planEstudio.nombre,
        carrera: {
          id: user.planEstudio.carrera.id,
          nombre: user.planEstudio.carrera.nombre,
        },
      } : undefined,
    };
  }
}
