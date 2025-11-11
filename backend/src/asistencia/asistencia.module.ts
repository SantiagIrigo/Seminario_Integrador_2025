// src/asistencia/asistencia.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asistencia } from './entities/asistencia.entity';
import { Clase } from '../clase/entities/clase.entity';
import { User } from '../user/entities/user.entity';
import { Inscripcion } from '../inscripcion/entities/inscripcion.entity';
import { AsistenciaService } from './asistencia.service';
import { AsistenciaController } from './asistencia.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule, // ✅ Necesario para JwtAuthGuard
    TypeOrmModule.forFeature([Asistencia, Clase, User, Inscripcion]),
  ],
  providers: [AsistenciaService],
  controllers: [AsistenciaController],
  exports: [AsistenciaService],
})
export class AsistenciaModule {}
