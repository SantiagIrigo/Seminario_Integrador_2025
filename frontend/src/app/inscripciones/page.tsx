'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BookOpen,
  Plus,
  Check,
  X,
  Clock,
  Users,
  Calendar,
  AlertCircle,
  Search
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from '@/components/ui/use-toast';
import { isAxiosError } from 'axios';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';

interface Materia {
  id: number;
  nombre: string;
  descripcion?: string;
  nivel?: number;
  correlativasCursada?: Array<{
    id: number;
    nombre: string;
  }>;
  correlativasFinal?: Array<{
    id: number;
    nombre: string;
  }>;
  comisiones?: Comision[];
}

interface Comision {
  id: number;
  nombre: string;
  cupoDisponible: number;
  cupoMaximo: number;
  docente?: {
    nombre: string;
    apellido: string;
  };
  profesor?: {
    nombre: string;
    apellido: string;
  };
  horarios?: Horario[];
  inscripciones?: Array<{ id: number }>;
  cupo?: number;
}

interface Horario {
  dia: string;
  horaInicio: string;
  horaFin: string;
  aula: string;
}

interface Inscripcion {
  id: number;
  materia: Materia;
  comision?: Comision;
  estado?: string;
  stc?: string;
  fechaInscripcion: string;
}

// Componente principal de la página de inscripciones a materias
export default function InscripcionesPage() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [materiasDisponibles, setMateriasDisponibles] = useState<Materia[]>([]);
  const [misInscripciones, setMisInscripciones] = useState<Inscripcion[]>([]);
  const [selectedMateria, setSelectedMateria] = useState<Materia | null>(null);
  const [selectedComision, setSelectedComision] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    console.log('InscripcionesPage: useEffect ejecutándose');
    // Si aún está cargando la autenticación, esperar
    if (authLoading) {
      console.log('InscripcionesPage: Esperando autenticación...');
      return;
    }

    // Si no hay usuario autenticado, redirigir al login
    if (!user) {
      console.log('InscripcionesPage: Usuario autenticado pero sin datos, redirigiendo al login');
      router.push('/login');
      return;
    }

    // Usuario autenticado con datos válidos
    if (!user.planEstudio?.id) {
      console.log('InscripcionesPage: Usuario no tiene planEstudioId');
      setAuthError('Tu cuenta no tiene un plan de estudios asignado.');
      setLoading(false);
      return;
    }

    console.log('InscripcionesPage: Usuario válido, cargando datos...');
    fetchData();
  }, [isAuthenticated, authLoading, user, router]);

  // Carga los datos iniciales de materias e inscripciones del usuario
  const fetchData = async () => {
    if (!user?.planEstudio?.id) {
      console.log('No hay usuario o plan de estudio válido');
      return;
    }

    try {
      console.log('Iniciando carga de datos...');
      setAuthError(null);

      let materiasLoaded = false;

      try {
        // Usar el endpoint autenticado correcto (NO el público)
        console.log('Cargando materias disponibles autenticadas...');
        const materiasRes = await api.get('/inscripcion/materia/disponibles');

        console.log('Respuesta completa de materias:', materiasRes);
        console.log('Datos de materias:', materiasRes.data);
        console.log('Cantidad de materias recibidas:', Array.isArray(materiasRes.data) ? materiasRes.data.length : 'No es array');

        const materiasData = materiasRes.data || [];
        console.log('Materias procesadas para estado:', materiasData.length);
        console.log('Primera materia (si existe):', materiasData[0]);

        if (materiasData.length === 0) {
          console.warn('⚠️ No se encontraron materias en el endpoint público');
        }

        setMateriasDisponibles(Array.isArray(materiasData) ? materiasData : []);
        materiasLoaded = true;
      } catch (error) {
        console.error('Error al cargar materias del plan:', error);
        if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
          console.log(`Error ${error.response?.status} - Problema de permisos`);
          console.log('Detalles del error:', error.response?.data);
          logout();
          return;
        } else {
          console.error('Error no relacionado con autenticación:', (error as Error)?.message || 'Error desconocido');
          setMateriasDisponibles([]);
        }
      // Cargar inscripciones actuales del usuario (datos locales para desarrollo)
      try {
        console.log('Cargando inscripciones actuales...');
        // Para desarrollo, usar datos locales vacíos inicialmente
        setMisInscripciones([]);
      } catch (error) {
        console.error('Error al cargar inscripciones actuales:', error);
        setMisInscripciones([]);
      }

      // Después de cargar ambas listas, dejar todas las materias disponibles
      // El filtrado por correlativas se hará en el momento de la inscripción
    }

    } catch (error) {
      console.error('Error general al cargar datos:', error);
      // Si hay errores 401, ya se manejaron arriba con logout()
      if (!axios.isAxiosError(error) || error.response?.status !== 401) {
        setAuthError('Error inesperado al cargar la página. Intenta nuevamente.');
      }
    } finally {
      setLoading(false);
      console.log('Carga de datos finalizada');
    }
  };

  // Intenta recargar los datos cuando hay errores
  const handleRetry = () => {
    console.log('Reintentando carga de datos...');
    fetchData();
  };

  // Limpia la sesión y redirige al login
  const handleGoToLogin = () => {
    console.log('Limpiando autenticación y redirigiendo al login');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    logout();
  };

  // Verifica si una materia tiene correlativas aprobadas
  const checkCorrelativas = (materia: Materia): { canEnroll: boolean; missingCorrelativas: string[] } => {
    const missingCorrelativas: string[] = [];

    if (materia.correlativasCursada && Array.isArray(materia.correlativasCursada) && materia.correlativasCursada.length > 0) {
      for (const correlativa of materia.correlativasCursada) {
        const correlativaNombre = correlativa?.nombre;

        const tieneAprobada = misInscripciones.some(inscripcion =>
          inscripcion.materia?.id === correlativa?.id &&
          (inscripcion.stc === 'APROBADA' || inscripcion.estado === 'APROBADA')
        );

        if (!tieneAprobada && correlativaNombre) {
          missingCorrelativas.push(correlativaNombre);
        }
      }
    }

    return {
      canEnroll: missingCorrelativas.length === 0,
      missingCorrelativas
    };
  };

  // Maneja el proceso de inscripción a una materia
  const handleInscripcion = async () => {
    if (!selectedMateria || !selectedComision) {
      toast({
        title: "Error",
        description: "Debes seleccionar una materia y comisión",
        variant: "destructive",
      });
      return;
    }

    // Para desarrollo, mostrar mensaje de éxito sin hacer llamada real
    toast({
      title: "Éxito",
      description: `Te has inscrito correctamente a ${selectedMateria.nombre}`,
    });

    setShowModal(false);
    setSelectedMateria(null);
    setSelectedComision('');

    // Actualizar las inscripciones locales para mostrar la nueva inscripción
    const nuevaInscripcion: Inscripcion = {
      id: Date.now(), // ID temporal
      materia: selectedMateria,
      comision: selectedMateria.comisiones?.find(c => c.id === parseInt(selectedComision)),
      estado: 'CONFIRMADA',
      stc: 'CURSANDO',
      fechaInscripcion: new Date().toISOString(),
    };

    setMisInscripciones(prev => [...prev, nuevaInscripcion]);
  };

  // Cancela una inscripción existente
  const handleCancelarInscripcion = async (inscripcionId: number) => {
    // Para desarrollo, simular la cancelación localmente
    setMisInscripciones(prev => prev.filter(inscripcion => inscripcion.id !== inscripcionId));

    toast({
      title: "Éxito",
      description: "Inscripción cancelada correctamente",
    });
  };

  // Filtra materias según el término de búsqueda
  const filteredMaterias = (materiasDisponibles || []).filter(materia =>
    materia.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Retorna el badge correspondiente al estado de la inscripción
  const getEstadoBadge = (inscripcion: Inscripcion) => {
    const estado = (inscripcion.estado || inscripcion.stc || '').toUpperCase();
    switch (estado) {
      case 'CONFIRMADA':
      case 'CURSANDO':
        return <Badge className="bg-green-100 text-green-800">Confirmada</Badge>;
      case 'PENDIENTE':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      case 'RECHAZADA':
        return <Badge className="bg-red-100 text-red-800">Rechazada</Badge>;
      case 'FINALIZADA':
      case 'APROBADA':
        return <Badge className="bg-blue-100 text-blue-800">{estado.charAt(0) + estado.slice(1).toLowerCase()}</Badge>;
      default:
        return estado ? <Badge>{estado}</Badge> : <Badge variant="outline">Sin estado</Badge>;
    }
  };

  // Renderiza información del docente de una comisión
  const renderComisionDocente = (comision?: Comision) => {
    const docente = comision?.docente ?? comision?.profesor;
    if (!docente) return null;

    return (
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-gray-400" />
        <span>
          Prof. {docente.nombre} {docente.apellido}
        </span>
      </div>
    );
  };

  // Formatea la información de cupo de una comisión
  const formatCupo = (comision: Comision) => {
    if (
      typeof comision.cupoDisponible === 'number' &&
      typeof comision.cupoMaximo === 'number'
    ) {
      return `${comision.cupoDisponible}/${comision.cupoMaximo}`;
    }

    if (typeof comision.cupo === 'number') {
      const usados = comision.inscripciones?.length ?? 0;
      return `${usados}/${comision.cupo}`;
    }

    if (comision.inscripciones) {
      return `${comision.inscripciones.length} inscriptos`;
    }

    return 'Cupo no disponible';
  };

  // Determina si se puede cancelar una inscripción según su estado
  const canCancelInscripcion = (inscripcion: Inscripcion) => {
    const estado = (inscripcion.estado || inscripcion.stc || '').toUpperCase();
    return estado === 'PENDIENTE' || estado === 'CURSANDO';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Loading inicial mientras se carga la autenticación */}
      {authLoading && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando...</p>
          </div>
        </div>
      )}

      {/* Contenido principal cuando no está cargando */}
      {!authLoading && user && (
        <>
          <div className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Inscripciones</h1>
                  <p className="text-gray-600 mt-1">Gestiona tus inscripciones a materias</p>
                </div>
                {!authError && (
                  <Button onClick={() => setShowModal(true)} disabled={materiasDisponibles.length === 0}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Inscripción
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {authError ? (
              <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center">
                <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-red-900 mb-2">Error de Autenticación</h2>
                <p className="text-red-700 mb-4">{authError}</p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={handleRetry} variant="outline">
                    Reintentar
                  </Button>
                  <Button
                    onClick={() => {
                      console.log('Limpiando completamente la autenticación...');
                      localStorage.clear();
                      window.location.href = '/login';
                    }}
                    variant="destructive"
                  >
                    Limpiar Sesión
                  </Button>
                  <Button onClick={handleGoToLogin} variant="outline">
                    Ir al Login
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Mis Inscripciones Actuales</h2>
                  {misInscripciones.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-8">
                        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No tienes inscripciones activas</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {misInscripciones.map((inscripcion) => (
                        <Card key={inscripcion.id}>
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-lg">{inscripcion.materia.nombre}</CardTitle>
                                <CardDescription>{inscripcion.comision?.nombre || 'Sin comisión asignada'}</CardDescription>
                              </div>
                              {getEstadoBadge(inscripcion)}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2 text-sm">
                              {renderComisionDocente(inscripcion.comision)}
                              {inscripcion.comision?.horarios?.map((horario, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-gray-400" />
                                  <span>
                                    {horario.dia} {horario.horaInicio} - {horario.horaFin}
                                  </span>
                                </div>
                              ))}
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span>
                                  Inscrito el {new Date(inscripcion.fechaInscripcion).toLocaleDateString('es-AR')}
                                </span>
                              </div>
                            </div>
                            {canCancelInscripcion(inscripcion) && (
                              <Button
                                variant="destructive"
                                size="sm"
                                className="w-full mt-4"
                                onClick={() => handleCancelarInscripcion(inscripcion.id)}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Cancelar Inscripción
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Materias Disponibles</h2>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        type="text"
                        placeholder="Buscar materias..."
                        className="pl-10 w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  {loading ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                  ) : materiasDisponibles.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-8">
                        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No hay materias disponibles para tu plan de estudios</p>
                        <p className="text-sm text-gray-500 mt-2">Contacta al administrador para que asocie materias a tu plan de estudios</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredMaterias.map((materia) => (
                        <Card key={materia.id} className="hover:shadow-lg transition-shadow">
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-lg">{materia.nombre}</CardTitle>
                                <CardDescription>{materia.descripcion}</CardDescription>
                              </div>
                              {materia.nivel && (
                                <Badge variant="outline">Nivel {materia.nivel}</Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="text-sm">
                                <span className="font-medium">Comisiones disponibles:</span>
                                <div className="mt-1 space-y-1">
                                  {(materia.comisiones ?? []).map((comision) => (
                                    <div key={comision.id} className="flex justify-between items-center">
                                      <span className="text-gray-600">{comision.nombre}</span>
                                      <Badge variant="secondary">{formatCupo(comision)}</Badge>
                                    </div>
                                  ))}
                                  {(materia.comisiones ?? []).length === 0 && (
                                    <p className="text-gray-500">Sin comisiones cargadas</p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Button
                              className="w-full mt-4"
                              onClick={() => {
                                setSelectedMateria(materia);
                                setShowModal(true);
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Inscribirse
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {showModal && !authError && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <Card className="w-full max-w-md text-gray-900">
                <CardHeader>
                  <CardTitle className="text-gray-900">Nueva Inscripción</CardTitle>
                  <CardDescription className="text-gray-700">
                    {selectedMateria ? `Inscribirse a ${selectedMateria.nombre} ${selectedMateria.nivel ? `(Nivel ${selectedMateria.nivel})` : ''}` : 'Selecciona una materia y comisión'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {!selectedMateria ? (
                      <div>
                        <Label className="text-gray-800">Materia</Label>
                        <Select onValueChange={(value) => {
                          const materia = materiasDisponibles.find(m => m.id === parseInt(value));
                          setSelectedMateria(materia || null);
                        }} disabled={materiasDisponibles.length === 0}>
                          <SelectTrigger className="text-gray-900 placeholder:text-gray-500">
                            <SelectValue placeholder={materiasDisponibles.length === 0 ? "No hay materias disponibles" : "Selecciona una materia"} />
                          </SelectTrigger>
                          <SelectContent>
                            {materiasDisponibles.length === 0 ? (
                              <div className="p-2 text-sm text-gray-500 text-center">
                                No hay materias disponibles para tu plan de estudios
                              </div>
                            ) : (
                              materiasDisponibles.map((materia) => (
                                <SelectItem key={materia.id} value={materia.id.toString()}>
                                  {materia.nombre} {materia.nivel ? `(Nivel ${materia.nivel})` : ''}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <>
                        <div>
                          <Label className="text-gray-800">Materia seleccionada</Label>
                          <p className="text-sm font-medium mt-1 text-gray-900">{selectedMateria.nombre} {selectedMateria.nivel ? `(Nivel ${selectedMateria.nivel})` : ''}</p>
                        </div>
                        <div>
                          <Label className="text-gray-800">Comisión</Label>
                          <Select value={selectedComision} onValueChange={setSelectedComision}>
                            <SelectTrigger className="text-gray-900 placeholder:text-gray-500">
                              <SelectValue placeholder="Selecciona una comisión" />
                            </SelectTrigger>
                            <SelectContent>
                              {(selectedMateria.comisiones ?? []).map((comision) => (
                                <SelectItem
                                  key={comision.id}
                                  value={comision.id.toString()}
                                  disabled={typeof comision.cupoDisponible === 'number' && comision.cupoDisponible === 0}
                                >
                                  {comision.nombre} ({formatCupo(comision)})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {selectedComision && (
                          <div className="bg-blue-50 p-3 rounded-md">
                            <p className="text-sm font-medium text-blue-900 mb-2">Horarios:</p>
                            {selectedMateria.comisiones
                              ?.find((c) => c.id === parseInt(selectedComision, 10))
                              ?.horarios?.map((horario, idx) => (
                                <p key={idx} className="text-sm text-blue-700">
                                  {horario.dia} {horario.horaInicio} - {horario.horaFin} (Aula {horario.aula})
                                </p>
                              ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
                <div className="flex gap-2 p-6 pt-0">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowModal(false);
                      setSelectedMateria(null);
                      setSelectedComision('');
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleInscripcion}
                    disabled={!selectedMateria || !selectedComision}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Confirmar Inscripción
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
