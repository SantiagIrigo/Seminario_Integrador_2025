// src/user/user.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PlanEstudioModule } from '../plan-estudio/plan-estudio.module'; // ✅ Importa el módulo

@Module({
  imports: [
    PlanEstudioModule, // ✅ Importa el módulo completo
    TypeOrmModule.forFeature([User]), // ✅ Solo la entidad propia
  ],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}