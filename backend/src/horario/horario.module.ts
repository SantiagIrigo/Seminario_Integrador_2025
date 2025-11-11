// src/horario/horario.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Horario } from './entities/horario.entity';
import { Materia } from '../materia/entities/materia.entity';
import { User } from '../user/entities/user.entity';
import { Inscripcion } from '../inscripcion/entities/inscripcion.entity';
import { Comision } from '../comision/entities/comision.entity';
import { HorarioService } from './horario.service';
import { HorarioController } from './horario.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Horario, Materia, User, Inscripcion, Comision]),
  ],
  providers: [HorarioService],
  controllers: [HorarioController],
  exports: [HorarioService],
})
export class HorarioModule {}
