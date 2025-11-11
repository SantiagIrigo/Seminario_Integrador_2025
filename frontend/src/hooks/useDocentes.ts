import { useEffect, useState } from 'react';

export interface Docente {
  id: number;
  nombre: string;
  apellido: string;
}

export function useDocentes() {
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchDocentes = async () => {
      try {
        setLoading(true);
        setError(null);
        const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
        const url = `${base}/user?rol=profesor`;
        const res = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            Authorization:
              typeof window !== 'undefined' && localStorage.getItem('auth_token')
                ? `Bearer ${localStorage.getItem('auth_token')}`
                : '',
          },
        });
        const data = await res.json();
        const list = Array.isArray(data?.data) ? data.data : data;
        const mapped: Docente[] = (list || [])
          .filter((u: any) => !!u)
          .map((u: any) => ({ id: u.id, nombre: u.nombre, apellido: u.apellido }));
        setDocentes(mapped);
      } catch (e) {
        setError(e as Error);
        setDocentes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDocentes();
  }, []);

  return { docentes, loading, error };
}