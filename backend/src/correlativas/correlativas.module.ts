// src/correlativas/correlativas.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CorrelativasService } from './correlativas.service';
import { CorrelativasController } from './correlativas.controller';
import { Materia } from '../materia/entities/materia.entity';
import { Inscripcion } from '../inscripcion/entities/inscripcion.entity';
import { CorrelativasCursada } from './entities/correlativas-cursada.entity';
import { CorrelativasFinal } from './entities/correlativas-final.entity';
import { CorrelativasCursadaPlan } from './entities/correlativas-cursada-plan.entity';
import { CorrelativasFinalPlan } from './entities/correlativas-final-plan.entity';
import { MateriaPlanEstudio } from '../materia/entities/materia-plan-estudio.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Materia,
      Inscripcion,
      CorrelativasCursada,
      CorrelativasFinal,
      CorrelativasCursadaPlan,
      CorrelativasFinalPlan,
      MateriaPlanEstudio
    ]),
  ],
  providers: [CorrelativasService],
  controllers: [CorrelativasController],
  exports: [CorrelativasService],
})
export class CorrelativasModule {}