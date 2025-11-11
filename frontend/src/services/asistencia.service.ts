import api from '@/lib/api';

export interface AsistenciaEstudiante {
  inscripcionId: number;
  estudiante: {
    id: number;
    nombre: string;
    apellido: string;
    dni: string;
    email: string;
  };
  presente: boolean;
  justificacion?: string;
  estado?: 'PRESENTE' | 'AUSENTE' | 'JUSTIFICADO';
  fecha?: string;
  materia?: {
    id: number;
    nombre: string;
  };
}

export interface ClaseAsistencia {
  id: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  aula: string;
  materia: {
    id: number;
    nombre: string;
  };
  comision: {
    id: number;
    nombre: string;
    docente: {
      id: number;
      nombre: string;
      apellido: string;
    };
  };
  asistenciaTomada: boolean;
  totalEstudiantes: number;
  presentes: number;
}

export interface ResumenAsistencias {
  total: number;
  presentes: number;
  justificadas: number;
  ausentes: number;
  porMateria?: {
    [materiaId: number]: {
      total: number;
      presentes: number;
      justificadas: number;
      ausentes: number;
      nombreMateria: string;
    };
  };
}

// 🔹 Obtener clases pendientes de asistencia (para secretaría académica)
export const obtenerClasesPendientesAsistencia = async (): Promise<ClaseAsistencia[]> => {
  const { data } = await api.get('/clase/admin/pendientes-asistencia');
  return data;
};

// 🔹 Obtener asistencia de una clase específica (para secretaría académica)
export const obtenerAsistenciaClase = async (claseId: number): Promise<{
  clase: ClaseAsistencia;
  asistencias: AsistenciaEstudiante[];
}> => {
  const { data } = await api.get(`/clase/admin/${claseId}/asistencia`);
  return data;
};

// 🔹 Guardar asistencia de una clase (para secretaría académica)
export const guardarAsistenciaClase = async (
  claseId: number, 
  asistencias: Array<{ 
    inscripcionId: number; 
    presente: boolean;
    justificacion?: string;
  }>
) => {
  const { data } = await api.post(`/clase/admin/${claseId}/asistencia`, { asistencias });
  return data;
};

// 🔹 Obtener asistencias del estudiante autenticado
export const obtenerMisAsistencias = async (): Promise<AsistenciaEstudiante[]> => {
  const { data } = await api.get('/asistencia/mis-asistencias');
  return data;
};

// 🔹 Obtener resumen de asistencias del estudiante
export const obtenerResumenAsistencias = async (materiaId?: number): Promise<ResumenAsistencias> => {
  const url = materiaId 
    ? `/asistencia/materia/${materiaId}`
    : '/asistencia/resumen';
  
  const { data } = await api.get(url);
  return data;
};

// 🔹 Justificar asistencia (para estudiantes)
export const justificarAsistencia = async (
  claseId: number,
  motivo: string
): Promise<void> => {
  await api.post(`/asistencia/clase/${claseId}/justificar`, { motivo });
};

// 🔹 Obtener estadísticas de asistencia (para docentes/administradores)
export const obtenerEstadisticasAsistencia = async (materiaId?: number) => {
  const url = materiaId 
    ? `/asistencia/estadisticas?materiaId=${materiaId}`
    : '/asistencia/estadisticas';
  
  const { data } = await api.get(url);
  return data;
};
