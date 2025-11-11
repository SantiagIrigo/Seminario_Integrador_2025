import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Carrera } from './entities/carrera.entity';
import { CarreraService } from './carrera.service';
import { CarreraController } from './carrera.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Carrera])],
  controllers: [CarreraController],
  providers: [CarreraService],
  exports: [CarreraService],
})
export class CarreraModule {}
