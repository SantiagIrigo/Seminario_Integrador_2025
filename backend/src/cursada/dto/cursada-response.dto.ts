export class CursadaResponseDto {
  id: number;
  estudiante: {
    id: number;
    nombre: string;
    apellido: string;
    legajo: string;
  };
  materia: {
    id: number;
    nombre: string;
  };
  comision?: {
    id: number;
    nombre: string;
  };
  // Campos propios de cursada
  faltas?: number;
  notaFinal?: number;
  stc?: string;
  fechaInscripcion: Date;
  fechaFinalizacion?: Date;
}
