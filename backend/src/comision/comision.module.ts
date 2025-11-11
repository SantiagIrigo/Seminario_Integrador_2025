// src/comision/comision.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comision } from './entities/comision.entity';
import { Materia } from '../materia/entities/materia.entity';
import { User } from '../user/entities/user.entity';
import { ComisionService } from './comision.service';
import { ComisionController } from './comision.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comision, Materia, User]),
  ],
  providers: [ComisionService],
  controllers: [ComisionController],
  exports: [ComisionService],
})
export class ComisionModule {}