import { UserRole } from '../entities/user.entity';

export class UserResponseDto {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  legajo: string;
  dni: string;
  rol: UserRole;
  createdAt: Date;
  planEstudio?: {
    id: number;
    nombre: string;
    carrera: {
      id: number;
      nombre: string;
    };
  };
}