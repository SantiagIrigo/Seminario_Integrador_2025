// src/departamento/departamento.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Departamento } from './entities/departamento.entity';
import { CreateDepartamentoDto } from './dto/create-departamento.dto';
import { UpdateDepartamentoDto } from './dto/update-departamento.dto';

@Injectable()
export class DepartamentoService {
  constructor(
    @InjectRepository(Departamento)
    private departamentoRepo,
  ) {}

  async create(dto: CreateDepartamentoDto): Promise<Departamento> {
    const departamento = this.departamentoRepo.create(dto);
    return this.departamentoRepo.save(departamento);
  }

  async findAll(): Promise<Departamento[]> {
    return this.departamentoRepo.find({ relations: ['materias', 'carrera'] });
  }

  async findOne(id: number): Promise<Departamento> {
    const departamento = await this.departamentoRepo.findOne({
      where: { id },
      relations: ['materias', 'carrera'],
    });
    if (!departamento) {
      throw new NotFoundException('Departamento no encontrado');
    }
    return departamento;
  }

  async update(id: number, dto: UpdateDepartamentoDto): Promise<Departamento> {
    const departamento = await this.findOne(id);
    Object.assign(departamento, dto);
    return this.departamentoRepo.save(departamento);
  }

  async remove(id: number): Promise<void> {
    const departamento = await this.findOne(id);
    await this.departamentoRepo.remove(departamento);
  }
}