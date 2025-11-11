// src/estado-academico/estado-academico.module.ts
import { Module } from '@nestjs/common';
import { EstadoAcademicoService } from './estado-academico.service';
import { EstadoAcademicoController } from './estado-academico.controller';
import { InscripcionModule } from '../inscripcion/inscripcion.module';
import { CorrelativasModule } from '../correlativas/correlativas.module';

@Module({
  imports: [
    InscripcionModule, // Importamos el módulo de inscripción para usar sus servicios
    CorrelativasModule,
  ],
  providers: [EstadoAcademicoService],
  controllers: [EstadoAcademicoController],
  exports: [EstadoAcademicoService], // Exportamos para que otros módulos puedan usarlo
})
export class EstadoAcademicoModule {}