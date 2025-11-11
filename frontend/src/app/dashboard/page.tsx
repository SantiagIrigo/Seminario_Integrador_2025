'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  GraduationCap,
  Calendar, 
  Award,
  FileText,
  Clock,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { isAxiosError } from 'axios';

interface DashboardStats {
  totalMaterias: number;
  materiasInscriptas: number;
  asistenciaPromedio: number;
  proximosExamenes: number;
}

interface ActividadReciente {
  fecha: string;
  hora: string;
  accion: string;
  estado?: string;
  presente?: boolean;
}

interface ProximoEvento {
  titulo: string;
  fecha: string;
  hora: string;
  descripcion: string;
}

export default function EstudianteDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats>({
    totalMaterias: 0,
    materiasInscriptas: 0,
    asistenciaPromedio: 0,
    proximosExamenes: 0,
  });

  const [actividadReciente, setActividadReciente] = useState<ActividadReciente[]>([]);
  const [proximosEventos, setProximosEventos] = useState<ProximoEvento[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated && user) {
      fetchDashboardData();
    }
  }, [isAuthenticated, loading, router, user]);

  const fetchDashboardData = async () => {
    try {
      setLoadingStats(true);
      setError(null);

      try {
        // Cargar estadísticas
        const statsResponse = await api.get('/estadisticas/estudiante');
        setStats(statsResponse.data);
      } catch (statsError) {
        if (isAxiosError(statsError) && statsError.response?.status === 401) {
          console.log('Usuario no autenticado, mostrando datos por defecto');
          setStats({
            totalMaterias: 0,
            materiasInscriptas: 0,
            asistenciaPromedio: 0,
            proximosExamenes: 0,
          });
        } else {
          console.error('Error al cargar estadísticas:', statsError);
          setStats({
            totalMaterias: 0,
            materiasInscriptas: 0,
            asistenciaPromedio: 0,
            proximosExamenes: 0,
          });
        }
      }

      try {
        // Cargar actividad reciente
        const actividadResponse = await api.get('/estadisticas/estudiante/actividad-reciente');
        setActividadReciente(actividadResponse.data);
      } catch (actividadError) {
        console.log('No hay actividad reciente disponible');
        setActividadReciente([]);
      }

      try {
        // Cargar próximos eventos
        const eventosResponse = await api.get('/estadisticas/estudiante/proximos-eventos');
        setProximosEventos(eventosResponse.data);
      } catch (eventosError) {
        console.log('No hay eventos próximos disponibles');
        setProximosEventos([]);
      }

    } catch (error: unknown) {
      console.error('Error general al cargar datos del dashboard:', error);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoadingStats(false);
    }
  };

  if (loading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const quickActions = [
    {
      title: 'Inscripción a Materias',
      description: 'Inscríbete a nuevas materias',
      icon: BookOpen,
      href: '/inscripciones',
      color: 'bg-blue-500',
    },
    {
      title: 'Mis Materias',
      description: 'Ver materias actuales',
      icon: GraduationCap,
      href: '/materias',
      color: 'bg-green-500',
    },
    {
      title: 'Horarios',
      description: 'Consulta tus horarios',
      icon: Calendar,
      href: '/mi-horario',
      color: 'bg-purple-500',
    },
    {
      title: 'Calificaciones',
      description: 'Ver notas y evaluaciones',
      icon: Award,
      href: '/calificaciones',
      color: 'bg-yellow-500',
    },
  ];

  const statsCards = [
    {
      title: 'Materias Totales',
      value: stats.totalMaterias || '-',
      icon: BookOpen,
      description: 'En tu plan de estudios',
      color: 'text-blue-600',
    },
    {
      title: 'Materias Inscriptas',
      value: stats.materiasInscriptas || '-',
      icon: GraduationCap,
      description: 'Este cuatrimestre',
      color: 'text-green-600',
    },
    {
      title: 'Asistencia',
      value: stats.asistenciaPromedio > 0 ? `${stats.asistenciaPromedio}%` : '-',
      icon: TrendingUp,
      description: 'Promedio general',
      color: 'text-purple-600',
    },
    {
      title: 'Próximos Exámenes',
      value: stats.proximosExamenes || '-',
      icon: FileText,
      description: 'En los próximos 30 días',
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Bienvenido, {user?.nombre}
              </h1>
              <p className="text-gray-600 mt-1">
                Panel de Estudiante
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Legajo: {user?.legajo}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="text-gray-700 border-gray-300 bg-white hover:bg-gray-100"
              >
                <Clock className="h-4 w-4 mr-2 text-gray-600" />
                {new Date().toLocaleDateString('es-AR')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800">{error}</p>
          </div>
        )}

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-gray-800">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-gray-900">
                  {loadingStats ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
                  ) : (
                    stat.value
                  )}
                </div>
                <p className="text-xs text-gray-600">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Acciones Rápidas */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <div
                key={index}
                onClick={(e) => {
                  e.preventDefault();
                  console.log('🚀 Navegando a:', action.href);
                  console.log('🔐 Estado de autenticación:', {
                    isAuthenticated,
                    user: user?.nombre,
                    hasToken: !!localStorage.getItem('auth_token')
                  });
                  router.push(action.href);
                }}
                className="cursor-pointer"
              >
                <Card className="hover:shadow-lg transition-shadow h-full">
                  <CardHeader>
                    <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-3`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg text-gray-900">{action.title}</CardTitle>
                    <CardDescription className="text-sm text-gray-600">{action.description}</CardDescription>
                  </CardHeader>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* Actividad Reciente y Próximos Eventos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900">Actividad Reciente</CardTitle>
              <CardDescription className="text-gray-600">Últimas acciones en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-gray-800">
                {actividadReciente.length > 0 ? (
                  actividadReciente.map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.accion}</p>
                        <p className="text-xs text-gray-600">{item.fecha} {item.hora}</p>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${
                        item.estado === 'completa' ? 'bg-green-500' :
                        item.estado === 'activa' ? 'bg-blue-500' :
                        item.presente ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No hay actividad reciente
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900">Próximos Eventos</CardTitle>
              <CardDescription className="text-gray-600">Tu agenda para los próximos días</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-gray-800">
                {proximosEventos.length > 0 ? (
                  proximosEventos.map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.titulo}</p>
                        <p className="text-xs text-gray-600">{item.fecha} - {item.hora}</p>
                        <p className="text-xs text-gray-500">{item.descripcion}</p>
                      </div>
                      <Calendar className="h-4 w-4 text-gray-400" />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No hay eventos próximos
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
