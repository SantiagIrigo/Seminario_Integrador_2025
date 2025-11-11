// src/inscripcion-examen/inscripcion-examen.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InscripcionExamenService } from './inscripcion-examen.service';
import { InscripcionExamenController } from './inscripcion-examen.controller';
import { InscripcionExamen } from './entities/inscripcion-examen.entity';
import { Inscripcion } from '../inscripcion/entities/inscripcion.entity';
import { ExamenFinal } from '../examen/entities/examen.entity';
import { CorrelativasModule } from '../correlativas/correlativas.module'; // ✅ Importar el módulo de correlativas

@Module({
  imports: [
    TypeOrmModule.forFeature([InscripcionExamen, Inscripcion, ExamenFinal]),
    CorrelativasModule, // ✅ Importar el módulo de correlativas
  ],
  providers: [InscripcionExamenService],
  controllers: [InscripcionExamenController],
  exports: [InscripcionExamenService],
})
export class InscripcionExamenModule {}