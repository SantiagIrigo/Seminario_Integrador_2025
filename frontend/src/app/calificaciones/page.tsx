'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Award, BookOpenCheck, Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import CalificacionesService, {
  EvaluacionItem,
  MateriaInscripta,
} from '@/services/calificaciones.service';

const tipoLabels: Record<string, string> = {
  parcial: 'Parcial',
  trabajo_practico: 'Trabajo Práctico',
  laboratorio: 'Laboratorio',
  participacion: 'Participación',
  recuperatorio: 'Recuperatorio',
};

const estadoLabels: Record<string, string> = {
  aprobada: 'Aprobada',
  desaprobada: 'Desaprobada',
  ausente: 'Ausente',
  pendiente: 'Pendiente',
};

const statusClasses: Record<string, string> = {
  cursando: 'bg-blue-100 text-blue-700',
  regular: 'bg-green-100 text-green-700',
  aprobada: 'bg-green-100 text-green-700',
  libre: 'bg-orange-100 text-orange-700',
  desaprobada: 'bg-red-100 text-red-700',
};

const evaluacionColor: Record<string, string> = {
  aprobada: 'bg-green-100 text-green-700 border border-green-200',
  desaprobada: 'bg-red-100 text-red-700 border border-red-200',
  ausente: 'bg-amber-100 text-amber-700 border border-amber-200',
  pendiente: 'bg-slate-100 text-slate-700 border border-slate-200',
};

const formatDate = (value?: string | Date) => {
  if (!value) return '-';
  try {
    const date = typeof value === 'string' ? new Date(value) : value;
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
};

const formatNumero = (value?: number | null, fallback = '-') => {
  if (typeof value !== 'number') return fallback;
  return Number.isInteger(value) ? value : value.toFixed(1);
};

export default function CalificacionesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [materiasEnCurso, setMateriasEnCurso] = useState<MateriaInscripta[]>([]);
  const [historial, setHistorial] = useState<MateriaInscripta[]>([]);
  const [evaluacionesPorMateria, setEvaluacionesPorMateria] = useState<Record<number, EvaluacionItem[]>>({});
  const [selectedMateriaId, setSelectedMateriaId] = useState<number | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (!authLoading && user) {
      cargarDatos();
    }
  }, [authLoading, user, router]);

  const cargarDatos = async () => {
    try {
      setPageLoading(true);
      setError(null);

      const [cursandoRes, historialRes] = await Promise.all([
        CalificacionesService.obtenerMateriasEnCurso(),
        CalificacionesService.obtenerHistorial(),
      ]);

      setMateriasEnCurso(cursandoRes);
      setHistorial(historialRes);

      const uniqueMateriaIds = Array.from(
        new Set([...cursandoRes, ...historialRes].map(item => item.materia.id)),
      );

      if (uniqueMateriaIds.length === 0) {
        setEvaluacionesPorMateria({});
        setSelectedMateriaId(null);
      } else {
        const evaluacionesEntries = await Promise.all(
          uniqueMateriaIds.map(async materiaId => {
            try {
              const evaluaciones = await CalificacionesService.obtenerEvaluacionesPorMateria(materiaId);
              return [materiaId, evaluaciones] as const;
            } catch (evalError) {
              console.error(`Error al cargar evaluaciones de la materia ${materiaId}:`, evalError);
              return [materiaId, []] as const;
            }
          }),
        );

        setEvaluacionesPorMateria(Object.fromEntries(evaluacionesEntries));

        setSelectedMateriaId(prev => {
          if (prev && uniqueMateriaIds.includes(prev)) {
            return prev;
          }
          return uniqueMateriaIds[0];
        });
      }
    } catch (fetchError) {
      console.error('Error al cargar calificaciones:', fetchError);
      setError('No pudimos cargar tus calificaciones.');
      toast({
        variant: 'destructive',
        title: 'Ocurrió un problema',
        description: 'Intenta nuevamente en unos segundos.',
      });
    } finally {
      setPageLoading(false);
    }
  };

  const materiasDisponibles = useMemo(() => {
    const map = new Map<number, MateriaInscripta>();
    [...materiasEnCurso, ...historial].forEach(item => {
      map.set(item.materia.id, item);
    });
    return Array.from(map.values());
  }, [materiasEnCurso, historial]);

  const evaluacionesSeleccionadas = selectedMateriaId
    ? evaluacionesPorMateria[selectedMateriaId] ?? []
    : [];

  const totalEvaluaciones = useMemo(() => {
    return Object.values(evaluacionesPorMateria).reduce((acc, evals) => acc + evals.length, 0);
  }, [evaluacionesPorMateria]);

  const promedioActual = useMemo(() => {
    const idsActuales = new Set(materiasEnCurso.map(m => m.materia.id));
    let suma = 0;
    let cantidad = 0;

    idsActuales.forEach(id => {
      const evals = evaluacionesPorMateria[id] || [];
      evals.forEach(evaluacion => {
        if (typeof evaluacion.nota === 'number') {
          suma += evaluacion.nota;
          cantidad += 1;
        }
      });
    });

    if (cantidad === 0) return null;
    return (suma / cantidad).toFixed(1);
  }, [materiasEnCurso, evaluacionesPorMateria]);

  if (authLoading || pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p>Cargando calificaciones...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900">Calificaciones</h1>
          <p className="mt-2 text-gray-600">
            Consulta tus avances y notas registradas en cada materia.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            <div className="flex flex-col gap-1 text-sm">
              <span>{error}</span>
              <Button variant="outline" size="sm" className="w-fit" onClick={cargarDatos}>
                Reintentar
              </Button>
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Materias en curso</CardTitle>
              <BookOpenCheck className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{materiasEnCurso.length || '-'}</div>
              <p className="text-sm text-gray-500">Registradas este cuatrimestre</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Evaluaciones</CardTitle>
              <Award className="h-5 w-5 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalEvaluaciones || '-'}</div>
              <p className="text-sm text-gray-500">Notas registradas en tus materias</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Promedio actual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {promedioActual ? promedioActual : '-'}
              </div>
              <p className="text-sm text-gray-500">Calculado con las evaluaciones cargadas</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card className="order-2 lg:order-1">
            <CardHeader>
              <CardTitle>Materias en curso</CardTitle>
              <CardDescription>Seguimiento de cursadas activas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {materiasEnCurso.length === 0 && (
                <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
                  No tenés materias en curso por ahora.
                </div>
              )}

              {materiasEnCurso.map(item => (
                <div
                  key={item.id}
                  className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs uppercase text-gray-500">Materia</p>
                      <p className="text-lg font-semibold text-gray-900">{item.materia.nombre}</p>
                      {item.comision?.nombre && (
                        <p className="text-sm text-gray-500">Comisión {item.comision.nombre}</p>
                      )}
                    </div>
                    <Badge className={statusClasses[item.stc ?? ''] || 'bg-slate-100 text-slate-700'}>
                      {(item.stc && item.stc.charAt(0).toUpperCase() + item.stc.slice(1)) || 'Cursando'}
                    </Badge>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase text-gray-500">Nota final</p>
                      <p className="text-xl font-semibold text-gray-900">
                        {formatNumero(item.notaFinal)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-gray-500">Inasistencias</p>
                      <p className="text-xl font-semibold text-gray-900">
                        {item.faltas ?? 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-gray-500">Inscripto</p>
                      <p className="text-base font-medium text-gray-900">
                        {formatDate(item.fechaInscripcion)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="order-1 lg:order-2">
            <CardHeader className="space-y-3">
              <div>
                <CardTitle>Detalle de evaluaciones</CardTitle>
                <CardDescription>
                  Seleccioná una materia para revisar sus notas parciales.
                </CardDescription>
              </div>
              <Select
                value={selectedMateriaId ? String(selectedMateriaId) : ''}
                onValueChange={value => setSelectedMateriaId(Number(value))}
                disabled={materiasDisponibles.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una materia" />
                </SelectTrigger>
                <SelectContent>
                  {materiasDisponibles.map(item => (
                    <SelectItem key={item.materia.id} value={String(item.materia.id)}>
                      {item.materia.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>

            <CardContent className="space-y-4">
              {selectedMateriaId === null && (
                <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
                  Aún no hay materias con evaluaciones para mostrar.
                </div>
              )}

              {selectedMateriaId !== null && evaluacionesSeleccionadas.length === 0 && (
                <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
                  No se cargaron evaluaciones para esta materia.
                </div>
              )}

              {evaluacionesSeleccionadas.length > 0 && (
                <div className="space-y-3">
                  {evaluacionesSeleccionadas.map(evaluacion => (
                    <div
                      key={evaluacion.id}
                      className={`rounded-xl px-4 py-3 text-sm ${evaluacionColor[evaluacion.estado] || 'bg-slate-100 text-slate-700 border border-slate-200'}`}
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-base font-semibold text-gray-900">
                            {evaluacion.titulo || tipoLabels[evaluacion.tipo] || 'Evaluación'}
                          </p>
                          <p className="text-xs uppercase text-gray-600">
                            {tipoLabels[evaluacion.tipo] || evaluacion.tipo}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="bg-white/60">
                            {estadoLabels[evaluacion.estado] || evaluacion.estado}
                          </Badge>
                          <span className="text-2xl font-bold text-gray-900">
                            {typeof evaluacion.nota === 'number' ? evaluacion.nota : '-'}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-700">
                        <span>
                          <span className="font-medium text-gray-600">Fecha:</span>{' '}
                          {formatDate(evaluacion.fecha)}
                        </span>
                        {evaluacion.observaciones && (
                          <span>
                            <span className="font-medium text-gray-600">Observaciones:</span>{' '}
                            {evaluacion.observaciones}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Historial académico</CardTitle>
            <CardDescription>Resumen de materias finalizadas o en otra condición</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {historial.length === 0 && (
              <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
                Todavía no registramos historial académico para tu cuenta.
              </div>
            )}

            {historial.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                      <th className="px-4 py-3 font-medium">Materia</th>
                      <th className="px-4 py-3 font-medium">Estado</th>
                      <th className="px-4 py-3 font-medium">Nota final</th>
                      <th className="px-4 py-3 font-medium">Inscripción</th>
                      <th className="px-4 py-3 font-medium">Finalización</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {historial.map(item => (
                      <tr key={`${item.id}-${item.materia.id}`}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{item.materia.nombre}</p>
                          {item.comision?.nombre && (
                            <p className="text-xs text-gray-500">Comisión {item.comision.nombre}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={statusClasses[item.stc ?? ''] || 'bg-slate-100 text-slate-700'}
                          >
                            {(item.stc && item.stc.charAt(0).toUpperCase() + item.stc.slice(1)) ||
                              '-'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          {formatNumero(item.notaFinal)}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{formatDate(item.fechaInscripcion)}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {item.fechaFinalizacion ? formatDate(item.fechaFinalizacion) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
