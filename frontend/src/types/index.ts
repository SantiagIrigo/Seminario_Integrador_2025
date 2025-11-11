export type UserRole = 'admin' | 'estudiante' | 'profesor' | 'secretaria_academica';

export interface User {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  legajo: string;
  rol: UserRole;
  planEstudio?: {
    id: number;
    nombre: string;
  };
}

export interface AuthResponse {
  access_token: string;
  user: User;
}