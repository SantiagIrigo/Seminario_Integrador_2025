import api from '@/lib/api';

export type SituacionCursada = 'cursando' | 'regular' | 'aprobada' | 'libre' | 'desaprobada' | string;

export interface MateriaInscripta {
  id: number;
  estudiante: {
    id: number;
    nombre: string;
    apellido: string;
    legajo?: string;
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
  notaFinal?: number | null;
  stc?: SituacionCursada | null;
  fechaInscripcion?: string;
  fechaFinalizacion?: string | null;
}

export interface EvaluacionItem {
  id: string;
  tipo: string;
  titulo?: string;
  nota?: number | null;
  estado: string;
  fecha?: string | Date;
  observaciones?: string;
}

const CalificacionesService = {
  async obtenerMateriasEnCurso(): Promise<MateriaInscripta[]> {
    const { data } = await api.get<MateriaInscripta[]>('/cursada/cursando');
    return Array.isArray(data) ? data : [];
  },

  async obtenerHistorial(): Promise<MateriaInscripta[]> {
    const { data } = await api.get<MateriaInscripta[]>('/cursada/historial');
    return Array.isArray(data) ? data : [];
  },

  async obtenerEvaluacionesPorMateria(materiaId: number): Promise<EvaluacionItem[]> {
    if (!materiaId) {
      return [];
    }

    const { data } = await api.get<EvaluacionItem[]>(`/evaluacion/mi-materia/${materiaId}`);
    return Array.isArray(data) ? data : [];
  },
};

export default CalificacionesService;
