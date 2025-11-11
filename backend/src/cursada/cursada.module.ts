// src/cursada/cursada.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CursadaController } from './cursada.controller';
import { CursadaService } from './cursada.service';
import { Inscripcion } from '../inscripcion/entities/inscripcion.entity';
import { User } from '../user/entities/user.entity';
import { Materia } from '../materia/entities/materia.entity';
import { Comision } from '../comision/entities/comision.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule, // Necesario para autenticación
    TypeOrmModule.forFeature([
      Inscripcion,
      User,
      Materia,
      Comision,
    ]),
  ],
  controllers: [CursadaController],
  providers: [CursadaService],
  exports: [CursadaService],
})
export class CursadaModule {}
