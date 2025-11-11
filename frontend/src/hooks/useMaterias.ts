import { useState, useEffect } from 'react';

export interface Materia {
  id: number;
  nombre: string;
  codigo: string;
  descripcion?: string;
  creditos: number;
  horasSemanales: number;
  carreraId: number;
  planEstudioId: number;
  año: number;
  cuatrimestre: number;
  correlativas: number[];
}

export function useMaterias() {
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchMaterias = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'}/materia?page=1&limit=100`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: typeof window !== 'undefined' && localStorage.getItem('token')
                ? `Bearer ${localStorage.getItem('token')}`
                : '',
            },
          }
        );

        if (!response.ok) {
          throw new Error('No se pudieron obtener las materias');
        }

        const data = await response.json();
        const materiasResponse = Array.isArray(data?.data) ? data.data : data;

        type MateriaApi = {
          id: number;
          nombre: string;
          descripcion?: string;
          codigo: string;
          creditos: number;
          horasSemanales: number;
          carreraId: number;
          planEstudioId: number;
          año: number;
          cuatrimestre: number;
          correlativas?: number[];
        };

        const mappedMaterias: Materia[] = (materiasResponse as MateriaApi[]).map((materia) => ({
          id: materia.id,
          nombre: materia.nombre,
          descripcion: materia.descripcion,
          codigo: materia.codigo,
          creditos: materia.creditos,
          horasSemanales: materia.horasSemanales,
          carreraId: materia.carreraId,
          planEstudioId: materia.planEstudioId,
          año: materia.año,
          cuatrimestre: materia.cuatrimestre,
          correlativas: materia.correlativas ?? [],
        }));

        setMaterias(mappedMaterias);
      } catch (err) {
        setError(err as Error);
        setMaterias([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMaterias();
  }, []);

  return { materias, loading, error };
}
