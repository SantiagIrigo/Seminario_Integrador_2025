import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InscripcionService } from './inscripcion.service';
import { InscripcionController } from './inscripcion.controller';
import { Inscripcion } from './entities/inscripcion.entity';
import { User } from '../user/entities/user.entity';
import { Materia } from '../materia/entities/materia.entity';
import { Comision } from '../comision/entities/comision.entity';
import { Departamento } from '../departamento/entities/departamento.entity';
import { CorrelativasModule } from '../correlativas/correlativas.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Inscripcion,
      User,
      Materia,
      Comision,
      Departamento,
    ]),
    CorrelativasModule,
  ],
  providers: [InscripcionService],
  controllers: [InscripcionController],
  exports: [InscripcionService],
})
export class InscripcionModule {}
