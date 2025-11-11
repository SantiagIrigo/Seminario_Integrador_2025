// src/plan-estudio/plan-estudio.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanEstudio } from './entities/plan-estudio.entity';
import { Carrera } from '../carrera/entities/carrera.entity';
import { PlanEstudioController } from './plan-estudio.controller';
import { PlanEstudioService } from './plan-estudio.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlanEstudio, Carrera]),
  ],
  controllers: [PlanEstudioController],
  providers: [PlanEstudioService],
  exports: [PlanEstudioService],
})
export class PlanEstudioModule {}