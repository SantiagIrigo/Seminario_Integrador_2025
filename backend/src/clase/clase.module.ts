// src/clase/clase.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Clase } from './entities/clase.entity';
import { Horario } from '../horario/entities/horario.entity';
import { Materia } from '../materia/entities/materia.entity';
import { User } from '../user/entities/user.entity';
import { Inscripcion } from '../inscripcion/entities/inscripcion.entity';
import { Comision } from '../comision/entities/comision.entity';
import { Asistencia } from '../asistencia/entities/asistencia.entity';
import { ClaseService } from './clase.service';
import { ClaseController } from './clase.controller';
import { AsistenciaService } from '../asistencia/asistencia.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule, // ✅ Necesario para JwtAuthGuard
    TypeOrmModule.forFeature([Clase, Horario, Materia, User, Inscripcion, Comision, Asistencia]),
  ],
  providers: [ClaseService, AsistenciaService],
  controllers: [ClaseController],
  exports: [ClaseService],
})
export class ClaseModule {}
