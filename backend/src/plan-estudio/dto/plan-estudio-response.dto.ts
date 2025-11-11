export class PlanEstudioResponseDto {
    id: number;
    nombre: string;
    descripcion?: string;
    año?: number;
    carrera: {
      id: number;
      nombre: string;
    };
    createdAt: Date;
    updatedAt: Date;
  }