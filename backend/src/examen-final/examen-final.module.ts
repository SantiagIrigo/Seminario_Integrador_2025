import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamenFinal } from './entities/examen-final.entity';
import { ExamenFinalService } from './examen-final.service';
import { ExamenFinalController } from './examen-final.controller';
import { MateriaModule } from '../materia/materia.module';
import { UserModule } from '../user/user.module';
import { Materia } from '../materia/entities/materia.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExamenFinal, Materia]),
    MateriaModule,
    UserModule,
  ],
  controllers: [ExamenFinalController],
  providers: [ExamenFinalService],
  exports: [ExamenFinalService],
})
export class ExamenFinalModule {}
