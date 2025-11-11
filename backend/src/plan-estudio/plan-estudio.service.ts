import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PlanEstudio } from './entities/plan-estudio.entity';
import { CreatePlanEstudioDto } from './dto/create-plan-estudio.dto';
import { UpdatePlanEstudioDto } from './dto/update-plan-estudio.dto';
import { Carrera } from '../carrera/entities/carrera.entity';
import { PlanEstudioResponseDto } from './dto/plan-estudio-response.dto';

@Injectable()
export class PlanEstudioService {
  constructor(
    @InjectRepository(PlanEstudio)
    private planRepo: any,
    @InjectRepository(Carrera)
    private carreraRepo: any,
  ) {}

  async create(dto: CreatePlanEstudioDto): Promise<PlanEstudioResponseDto> {
    const carrera = await this.carreraRepo.findOne({ where: { id: dto.carreraId } });
    if (!carrera) throw new NotFoundException('Carrera no encontrada');

    const plan = this.planRepo.create({ ...dto, carrera });
    const savedPlan = await this.planRepo.save(plan);
    return this.mapToResponseDto(savedPlan);
  }

  async findAll(): Promise<PlanEstudioResponseDto[]> {
    const planes = await this.planRepo.find({ relations: ['carrera'] });
    return planes.map(p => this.mapToResponseDto(p));
  }

  async findOne(id: number): Promise<PlanEstudioResponseDto> {
    const plan = await this.planRepo.findOne({
      where: { id },
      relations: ['carrera'],
    });
    if (!plan) throw new NotFoundException('Plan de estudio no encontrado');
    return this.mapToResponseDto(plan);
  }

  async update(id: number, dto: UpdatePlanEstudioDto): Promise<PlanEstudioResponseDto> {
    const plan = await this.findOne(id);

    if (dto.carreraId !== undefined) {
      const carrera = await this.carreraRepo.findOne({ where: { id: dto.carreraId } });
      if (!carrera) throw new NotFoundException('Carrera no encontrada');
      plan.carrera = carrera;
    }

    Object.assign(plan, dto);
    const updatedPlan = await this.planRepo.save(plan);
    return this.mapToResponseDto(updatedPlan);
  }

  async remove(id: number): Promise<void> {
    await this.planRepo.delete(id);
  }

  private mapToResponseDto(plan: PlanEstudio): PlanEstudioResponseDto {
    return {
      id: plan.id,
      nombre: plan.nombre,
      descripcion: plan.descripcion,
      año: plan.año,
      carrera: {
        id: plan.carrera.id,
        nombre: plan.carrera.nombre,
      },
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };
  }
}