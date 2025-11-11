// src/evaluacion/evaluacion.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Evaluacion } from './entities/evaluacion.entity';
import { EvaluacionController } from './evaluacion.controller';
import { EvaluacionService } from './evaluacion.service';
import { Inscripcion } from '../inscripcion/entities/inscripcion.entity';
import { Materia } from '../materia/entities/materia.entity';
import { User } from '../user/entities/user.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule, // ✅ Necesario para JwtAuthGuard
    TypeOrmModule.forFeature([Evaluacion, Inscripcion, Materia, User]),
  ],
  controllers: [EvaluacionController],
  providers: [EvaluacionService],
  exports: [EvaluacionService],
})
export class EvaluacionModule {}