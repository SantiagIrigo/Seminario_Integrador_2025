// src/examen/examen.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamenFinal } from './entities/examen.entity';
import { Materia } from '../materia/entities/materia.entity';
import { User } from '../user/entities/user.entity';
import { Inscripcion } from '../inscripcion/entities/inscripcion.entity';
import { ExamenService } from './examen.service';
import { ExamenController } from './examen.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExamenFinal, Materia, User, Inscripcion]),
  ],
  providers: [ExamenService],
  controllers: [ExamenController],
  exports: [ExamenService],
})
export class ExamenModule {}