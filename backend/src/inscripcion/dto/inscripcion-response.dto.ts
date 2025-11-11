export class InscripcionResponseDto {
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
  faltas?: number;
  notaFinal?: number;
  stc?: string;
  fechaInscripcion: Date;
  fechaFinalizacion?: Date;
}
