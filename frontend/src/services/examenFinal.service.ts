import axios, { AxiosRequestConfig } from 'axios';
import { getApiUrl } from '@/lib/utils';

const API_URL_EXAMENES = getApiUrl('examenes-finales');
const API_URL_INSCRIPCION = getApiUrl('inscripcion-examen');

const authHeaders = (): AxiosRequestConfig => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token') ?? ''}`,
  },
});

export interface HorarioExamen {
  horaInicio: string;
  horaFin: string;
  aula: string;
}

export interface ExamenFinalResponse {
  id: number;
  fecha: string;
  horaInicioTeorico: string;
  horaFinTeorico: string;
  aulaTeorico: string;
  horaInicioPractico?: string;
  horaFinPractico?: string;
  aulaPractico?: string;
  materia: {
    id: number;
    nombre: string;
  };
  docente: {
    id: number;
    nombre: string;
    apellido: string;
  };
  cupo: number;
  inscriptos: number;
  disponibles: number;
  createdAt: string;
  updatedAt: string;
}

export type ExamenFinal = ExamenFinalResponse & {
  teorico: HorarioExamen;
  practico?: HorarioExamen;
};

export interface InscripcionExamenFinalResponse {
  id: number;
  estudianteId?: number;
  examenFinal: ExamenFinalResponse;
  fechaInscripcion: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'ausente' | 'libre';
  nota?: number;
  observaciones?: string;
  fechaActualizacion?: string;
}

export type InscripcionExamenFinal = InscripcionExamenFinalResponse & {
  examenFinal: ExamenFinal;
};

export interface CreateExamenFinalPayload {
  materiaId: number;
  docenteId: number;
  fecha: string;
  horaInicioTeorico: string;
  horaFinTeorico: string;
  aulaTeorico: string;
  horaInicioPractico?: string;
  horaFinPractico?: string;
  aulaPractico?: string;
  cupo?: number;
}

export type UpdateExamenFinalPayload = Partial<CreateExamenFinalPayload>;

const mapExamen = (examen: ExamenFinalResponse): ExamenFinal => ({
  ...examen,
  teorico: {
    horaInicio: examen.horaInicioTeorico,
    horaFin: examen.horaFinTeorico,
    aula: examen.aulaTeorico,
  },
  practico:
    examen.horaInicioPractico && examen.horaFinPractico && examen.aulaPractico
      ? {
          horaInicio: examen.horaInicioPractico,
          horaFin: examen.horaFinPractico,
          aula: examen.aulaPractico,
        }
      : undefined,
});

const mapInscripcion = (
  inscripcion: InscripcionExamenFinalResponse,
): InscripcionExamenFinal => ({
  ...inscripcion,
  examenFinal: mapExamen(inscripcion.examenFinal),
});

export const ExamenFinalService = {
  // Obtener todos los exámenes finales disponibles
  async getExamenesDisponibles(): Promise<ExamenFinal[]> {
    const response = await axios.get<ExamenFinalResponse[]>(`${API_URL_EXAMENES}`, authHeaders());
    return response.data.map(mapExamen);
  },

  // Obtener un examen por su ID
  async getExamenById(id: number): Promise<ExamenFinal> {
    const response = await axios.get<ExamenFinalResponse>(`${API_URL_EXAMENES}/${id}`, authHeaders());
    return mapExamen(response.data);
  },

  async crearExamenFinal(payload: CreateExamenFinalPayload): Promise<ExamenFinal> {
    const response = await axios.post<ExamenFinalResponse>(`${API_URL_EXAMENES}`, payload, authHeaders());
    return mapExamen(response.data);
  },

  async actualizarExamenFinal(
    id: number,
    payload: UpdateExamenFinalPayload,
  ): Promise<ExamenFinal> {
    const response = await axios.patch<ExamenFinalResponse>(
      `${API_URL_EXAMENES}/${id}`,
      payload,
      authHeaders(),
    );
    return mapExamen(response.data);
  },

  async eliminarExamenFinal(id: number): Promise<void> {
    await axios.delete(`${API_URL_EXAMENES}/${id}`, authHeaders());
  },

  // Inscribirse a un examen final
  async inscribirAExamen(
    examenFinalId: number,
  ): Promise<InscripcionExamenFinal> {
    const response = await axios.post<InscripcionExamenFinalResponse>(
      `${API_URL_INSCRIPCION}`,
      { examenId: examenFinalId },
      authHeaders()
    );
    return mapInscripcion(response.data);
  },

  // Obtener las inscripciones de un estudiante
  async getInscripcionesEstudiante(estudianteId: number): Promise<InscripcionExamenFinal[]> {
    const response = await axios.get<InscripcionExamenFinalResponse[]>(
      `${API_URL_INSCRIPCION}/estudiante/${estudianteId}`,
      authHeaders()
    );
    
    // Transformar la respuesta al formato esperado por el frontend
    return response.data.map(mapInscripcion);
  },

  // Cancelar inscripción a un examen final (por el estudiante)
  async cancelarInscripcion(inscripcionId: number): Promise<void> {
    await axios.delete(`${API_URL_INSCRIPCION}/mine/${inscripcionId}`, authHeaders());
  }
};
