// src/carrera/carrera.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Carrera } from './entities/carrera.entity';
import { CreateCarreraDto } from './dto/create-carrera.dto';
import { UpdateCarreraDto } from './dto/update-carrera.dto';

@Injectable()
export class CarreraService {
  constructor(
    @InjectRepository(Carrera)
    private readonly carreraRepository,
  ) {}

  async create(dto: CreateCarreraDto): Promise<Carrera> {
    const carrera = this.carreraRepository.create(dto);
    return this.carreraRepository.save(carrera);
  }

  async findAll(): Promise<Carrera[]> {
    return this.carreraRepository.find({ relations: ['planesEstudio'] });
  }

  async findOne(id: number): Promise<Carrera> {
    const carrera = await this.carreraRepository.findOne({
      where: { id },
      relations: ['planesEstudio'],
    });
    if (!carrera) {
      throw new NotFoundException(`Carrera con id ${id} no encontrada`);
    }
    return carrera;
  }

  async update(id: number, dto: UpdateCarreraDto): Promise<Carrera> {
    const carrera = await this.findOne(id);
    Object.assign(carrera, dto);
    return this.carreraRepository.save(carrera);
  }

  async remove(id: number): Promise<void> {
    const carrera = await this.findOne(id);
    await this.carreraRepository.remove(carrera);
  }
}