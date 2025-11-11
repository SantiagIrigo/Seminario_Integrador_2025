'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, User, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { isAxiosError } from 'axios';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';

interface HorarioPlano {
  id: string;
  dia: string;
  horaInicio: string;
  horaFin: string;
  aula: string;
  materia: {
    id: number;
    nombre: string;
  };
  comision?: {
    id: number;
    nombre: string;
    docente?: {
      nombre: string;
      apellido: string;
    };
  };
}

interface HorarioServidorBloque {
  materia?: {
    id: number;
    nombre: string;
    descripcion?: string;
  };
  comision?: {
    id: number;
    nombre: string;
    descripcion?: string;
  };
  horaInicio: string;
  horaFin: string;
  aula: string;
  esProfesor: boolean;
  materiaId?: number;
  comisionId?: number;
}

interface HorarioServidorDia {
  fecha: string;
  diaSemana: string;
  bloques: HorarioServidorBloque[];
}

const DIAS_SEMANA = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
const HORAS = Array.from({ length: 15 }, (_, i) => `${i + 8}:00`); // 8:00 a 22:00

const COLORES_MATERIAS = [
  'bg-blue-100 text-blue-800 border-blue-300',
  'bg-green-100 text-green-800 border-green-300',
  'bg-purple-100 text-purple-800 border-purple-300',
  'bg-yellow-100 text-yellow-800 border-yellow-300',
  'bg-pink-100 text-pink-800 border-pink-300',
  'bg-indigo-100 text-indigo-800 border-indigo-300',
  'bg-red-100 text-red-800 border-red-300',
  'bg-orange-100 text-orange-800 border-orange-300',
];

const normalizarHorarios = (dias: HorarioServidorDia[]): HorarioPlano[] => {
  const resultado: HorarioPlano[] = [];

  dias.forEach((dia) => {
    dia.bloques.forEach((bloque, index) => {
      const materia: HorarioPlano['materia'] = bloque.materia ? bloque.materia : {
        id: bloque.materiaId ?? -1,
        nombre: 'Materia sin nombre',
      };

      const comision = bloque.comision
        ? {
            id: bloque.comision.id,
            nombre: bloque.comision.nombre,
          }
        : undefined;

      resultado.push({
        id: `${dia.fecha}-${index}`,
        dia: dia.diaSemana,
        horaInicio: bloque.horaInicio,
        horaFin: bloque.horaFin,
        aula: bloque.aula,
        materia,
        comision,
      });
    });
  });

  return resultado;
};

export default function MiHorarioPage() {
  const [horarios, setHorarios] = useState<HorarioPlano[]>([]);
  const [loading, setLoading] = useState(true);
  const [vistaMovil, setVistaMovil] = useState(false);
  const [diaSeleccionado, setDiaSeleccionado] = useState(0);
  const [materiasColores, setMateriasColores] = useState<Map<number, string>>(new Map());

  useEffect(() => {
    fetchHorarios();
    checkVistaMovil();
    window.addEventListener('resize', checkVistaMovil);
    return () => window.removeEventListener('resize', checkVistaMovil);
  }, []);

  const checkVistaMovil = () => {
    setVistaMovil(window.innerWidth < 768);
    if (window.innerWidth < 768) {
      const hoy = new Date().getDay();
      setDiaSeleccionado(hoy === 0 ? 0 : hoy - 1);
    }
  };

  const fetchHorarios = async () => {
    try {
      console.log('🔍 Cargando horarios del usuario...');
      const response = await api.get<HorarioServidorDia[]>('/horario/mi-horario');
      console.log('✅ Horarios obtenidos exitosamente:', response.data.length, 'días');
      const planos = normalizarHorarios(response.data);
      console.log('📊 Horarios procesados:', planos.length, 'bloques');
      setHorarios(planos);
      asignarColores(planos);
    } catch (error: unknown) {
      console.error('❌ Error al cargar horarios:', error);
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 401 || status === 403) {
          console.log(`🚫 Error ${status} - Problema de permisos`);
          console.log('Detalles del error:', error.response?.data);
          // Para este endpoint específico, NO hacer logout automático
          // Solo mostrar horarios vacíos y continuar normalmente
          setHorarios([]);
        } else if (status === 404) {
          console.log('📭 No se encontraron horarios para este usuario');
          setHorarios([]);
        } else {
          console.error('❌ Error inesperado al cargar horarios:', error.response?.data);
          setHorarios([]);
        }
      } else {
        // Para otros errores, mostrar horarios vacíos
        console.warn('⚠️ Error no relacionado con permisos, mostrando horarios vacíos');
        setHorarios([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const asignarColores = (horarios: HorarioPlano[]) => {
    const materias = new Map<number, string>();
    const materiasUnicas = [...new Set(horarios.map(h => h.materia.id))];

    materiasUnicas.forEach((materiaId, index) => {
      materias.set(materiaId, COLORES_MATERIAS[index % COLORES_MATERIAS.length]);
    });

    setMateriasColores(materias);
  };

  const getHorarioPorDiaYHora = (dia: string, hora: string) => {
    return horarios.find(h => {
      const [horaInicioStr] = h.horaInicio.split(':');
      const [horaFinStr] = h.horaFin.split(':');
      if (!horaInicioStr || !horaFinStr) {
        return false;
      }
      const horaInicio = parseInt(horaInicioStr, 10);
      const horaFin = parseInt(horaFinStr, 10);
      const horaActual = parseInt(hora.split(':')[0]);
      return h.dia === dia && horaActual >= horaInicio && horaActual < horaFin;
    });
  };

  const getHorariosDia = (dia: string) => {
    return horarios
      .filter(h => h.dia === dia)
      .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  };

  const exportarHorario = () => {
    // Aquí podrías implementar la exportación a PDF o imagen
    window.print();
  };

  const cambiarDia = (direccion: number) => {
    setDiaSeleccionado(prev => {
      const nuevo = prev + direccion;
      if (nuevo < 0) return DIAS_SEMANA.length - 1;
      if (nuevo >= DIAS_SEMANA.length) return 0;
      return nuevo;
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Mi Horario</h1>
              <p className="text-gray-600 mt-1">Visualiza tu horario de clases semanal</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportarHorario}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </div>

        {/* Vista Móvil */}
        {vistaMovil ? (
          <div className="space-y-4">
            {/* Selector de día */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => cambiarDia(-1)}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <h2 className="text-lg font-semibold capitalize">
                  {DIAS_SEMANA[diaSeleccionado].toLowerCase()}
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => cambiarDia(1)}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Clases del día */}
            <div className="space-y-3">
              {getHorariosDia(DIAS_SEMANA[diaSeleccionado]).length > 0 ? (
                getHorariosDia(DIAS_SEMANA[diaSeleccionado]).map((horario) => (
                  <Card
                    key={horario.id}
                    className={cn(
                      "border-2",
                      materiasColores.get(horario.materia.id)
                    )}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{horario.materia.nombre}</CardTitle>
                      {horario.comision && (
                        <CardDescription>{horario.comision.nombre}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4" />
                        <span>{horario.horaInicio} - {horario.horaFin}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4" />
                        <span>Aula {horario.aula}</span>
                      </div>
                      {horario.comision?.docente && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4" />
                          <span>
                            Prof. {horario.comision.docente.nombre} {horario.comision.docente.apellido}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No tienes clases este día</p>
                    {horarios.length === 0 && (
                      <p className="text-sm text-gray-500 mt-2">
                        No tienes horarios registrados. Inscríbete a materias para ver tus horarios.
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ) : (/* Vista Desktop - Grilla */
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-20">
                      Hora
                    </th>
                    {DIAS_SEMANA.map((dia) => (
                      <th
                        key={dia}
                        className="px-4 py-3 text-center text-sm font-medium text-gray-700 capitalize"
                      >
                        {dia.toLowerCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {HORAS.map((hora) => (
                    <tr key={hora} className="border-b">
                      <td className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50">
                        {hora}
                      </td>
                      {DIAS_SEMANA.map((dia) => {
                        const horario = getHorarioPorDiaYHora(dia, hora);
                        if (horario) {
                          const horaInicio = parseInt(horario.horaInicio.split(':')[0]);
                          const horaActual = parseInt(hora.split(':')[0]);

                          // Solo mostrar en la primera hora de la clase
                          if (horaInicio === horaActual) {
                            const duracion = parseInt(horario.horaFin.split(':')[0]) - horaInicio;
                            return (
                              <td
                                key={`${dia}-${hora}`}
                                rowSpan={duracion}
                                className="p-2"
                              >
                                <div
                                  className={cn(
                                    "p-3 rounded-lg border-2 h-full",
                                    materiasColores.get(horario.materia.id)
                                  )}
                                >
                                  <div className="font-semibold text-sm mb-1">
                                    {horario.materia.nombre}
                                  </div>
                                  <div className="text-xs space-y-1">
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      <span>Aula {horario.aula}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      <span>{horario.horaInicio} - {horario.horaFin}</span>
                                    </div>
                                    {horario.comision?.docente && (
                                      <div className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        <span className="truncate">
                                          {horario.comision.docente.apellido}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            );
                          } else if (horaActual > horaInicio && horaActual < parseInt(horario.horaFin.split(':')[0])) {
                            // Esta celda está ocupada por un rowspan
                            return null;
                          }
                        }
                        return <td key={`${dia}-${hora}`} className="p-2"></td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Leyenda de materias */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Mis Materias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {Array.from(new Set(horarios.map(h => h.materia.id))).map((materiaId) => {
                const materia = horarios.find(h => h.materia.id === materiaId)?.materia;
                if (!materia) return null;
                return (
                  <Badge
                    key={materiaId}
                    className={cn(
                      "px-3 py-1",
                      materiasColores.get(materiaId)
                    )}
                  >
                    {materia.nombre}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
