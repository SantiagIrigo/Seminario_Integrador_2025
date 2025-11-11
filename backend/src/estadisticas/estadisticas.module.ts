import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstadisticasService } from './estadisticas.service';
import { EstadisticasController } from './estadisticas.controller';
import { User } from '../user/entities/user.entity';
import { Inscripcion } from '../inscripcion/entities/inscripcion.entity';
import { MateriaPlanEstudio } from '../materia/entities/materia-plan-estudio.entity';
import { Asistencia } from '../asistencia/entities/asistencia.entity';
import { ExamenFinal } from '../examen-final/entities/examen-final.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule, // ✅ Necesario para acceso a req.user
    TypeOrmModule.forFeature([
      User,
      Inscripcion,
      MateriaPlanEstudio,
      Asistencia,
      ExamenFinal,
    ]),
  ],
  controllers: [EstadisticasController],
  providers: [EstadisticasService],
  exports: [EstadisticasService],
})
export class EstadisticasModule {}
