// src/comision/comision.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Comision } from './entities/comision.entity';
import { Materia } from '../materia/entities/materia.entity';
import { User } from '../user/entities/user.entity';
import { CreateComisionDto } from './dto/create-comision.dto';
import { UpdateComisionDto } from './dto/update-comision.dto';

@Injectable()
export class ComisionService {
  constructor(
    @InjectRepository(Comision)
    private comisionRepo, // ✅ Sin tipo explícito
    @InjectRepository(Materia)
    private materiaRepo, // ✅ Sin tipo explícito
    @InjectRepository(User)
    private userRepo, // ✅ Sin tipo explícito
  ) {}

  async create(createComisionDto: CreateComisionDto): Promise<Comision> {
    const materia = await this.materiaRepo.findOne({ 
      where: { id: createComisionDto.materiaId } 
    });
    if (!materia) {
      throw new NotFoundException('Materia no encontrada');
    }

    let profesor;
    if (createComisionDto.profesorId) {
      profesor = await this.userRepo.findOne({ 
        where: { id: createComisionDto.profesorId } 
      });
      if (!profesor) {
        throw new NotFoundException('Profesor no encontrado');
      }
    }

    const comision = this.comisionRepo.create({
      ...createComisionDto,
      materia,
      profesor,
    });

    return this.comisionRepo.save(comision);
  }

  async findAll(): Promise<Comision[]> {
    return this.comisionRepo.find({
      relations: ['materia', 'profesor'],
    });
  }

  async findOne(id: number): Promise<Comision> {
    const comision = await this.comisionRepo.findOne({
      where: { id },
      relations: ['materia', 'profesor'],
    });
    
    if (!comision) {
      throw new NotFoundException('Comisión no encontrada');
    }
    
    return comision;
  }

  async update(id: number, updateComisionDto: UpdateComisionDto): Promise<Comision> {
    const comision = await this.comisionRepo.findOne({ 
      where: { id },
      relations: ['materia']
    });
    
    if (!comision) {
      throw new NotFoundException('Comisión no encontrada');
    }

    // Si se especifica profesor, verificar que exista
    let profesor;
    if (updateComisionDto.profesorId !== undefined) {
      if (updateComisionDto.profesorId === null) {
        comision.profesor = null;
      } else {
        profesor = await this.userRepo.findOne({ 
          where: { id: updateComisionDto.profesorId } 
        });
        if (!profesor) {
          throw new NotFoundException('Profesor no encontrado');
        }
        comision.profesor = profesor;
      }
    }

    Object.assign(comision, updateComisionDto);
    
    return this.comisionRepo.save(comision);
  }

  async remove(id: number): Promise<void> {
    const comision = await this.comisionRepo.findOne({ where: { id } });
    if (!comision) {
      throw new NotFoundException('Comisión no encontrada');
    }
    await this.comisionRepo.delete(id);
  }

  // Obtener todas las comisiones de una materia específica
  async findByMateria(materiaId: number): Promise<Comision[]> {
    return this.comisionRepo.find({
      where: { materia: { id: materiaId } },
      relations: ['profesor'],
    });
  }
}