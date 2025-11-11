"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, Clock, BookOpen, ClipboardCheck, Users, User, Check, AlertCircle, X, Book } from 'lucide-react';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExamenFinalService, type InscripcionExamenFinal } from '@/services/examenFinal.service';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function MisInscripcionesExamenes() {
  const [inscripciones, setInscripciones] = useState<InscripcionExamenFinal[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelando, setCancelando] = useState<number | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const cargarInscripciones = useCallback(async () => {
    if (!user) return;
    try {
      const data = await ExamenFinalService.getInscripcionesEstudiante(user.id);
      setInscripciones(data);
    } catch (error) {
      console.error('Error al cargar inscripciones:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar tus inscripciones a exámenes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      cargarInscripciones();
    }
  }, [user, cargarInscripciones]);

  const handleCancelarInscripcion = async (inscripcionId: number) => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta inscripción?')) return;
    
    setCancelando(inscripcionId);
    try {
      await ExamenFinalService.cancelarInscripcion(inscripcionId);
      toast({
        title: 'Inscripción cancelada',
        description: 'Tu inscripción al examen ha sido cancelada exitosamente',
      });
      // Actualizar la lista de inscripciones
      setInscripciones(inscripciones.filter(i => i.id !== inscripcionId));
    } catch (error) {
      console.error('Error al cancelar inscripción:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cancelar la inscripción',
        variant: 'destructive',
      });
    } finally {
      setCancelando(null);
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'aprobada':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Aprobado</Badge>;
      case 'rechazada':
        return <Badge variant="destructive">Rechazado</Badge>;
      case 'ausente':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Ausente</Badge>;
      case 'libre':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Libre</Badge>;
      default:
        return <Badge variant="outline">Pendiente</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (inscripciones.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">No tienes inscripciones a exámenes</h3>
        <p className="mt-1 text-sm text-gray-600">
          No estás inscripto a ningún examen final en este momento.
        </p>
      </div>
    );
  }

  // Ordenar por fecha de examen (más cercano primero)
  const inscripcionesOrdenadas = useMemo(() => {
    return [...inscripciones].sort((a, b) => {
      const fechaA = new Date(`${a.examenFinal.fecha}T${a.examenFinal.horaInicioTeorico}`);
      const fechaB = new Date(`${b.examenFinal.fecha}T${b.examenFinal.horaInicioTeorico}`);
      return fechaA.getTime() - fechaB.getTime();
    });
  }, [inscripciones]);

  // Función para formatear la fecha en español
  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), "EEEE d 'de' MMMM 'de' yyyy", { locale: es });
  };

  // Función para formatear la hora
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Mis Inscripciones a Exámenes</h2>
      
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {inscripcionesOrdenadas.map((inscripcion) => {
          const examen = inscripcion.examenFinal;
          const fechaHoraExamen = new Date(`${examen.fecha}T${examen.horaInicioTeorico}`);
          
          // Verificar si se puede cancelar la inscripción (solo si está pendiente y la fecha es futura)
          const puedeCancelar = 
            inscripcion.estado === 'pendiente' && 
            isAfter(fechaHoraExamen, new Date());

          return (
            <Card key={inscripcion.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{examen.materia.nombre}</CardTitle>
                    <div className="flex items-center mt-1 space-x-2">
                      {getEstadoBadge(inscripcion.estado)}
                      <span className="text-sm text-gray-600">
                        Inscrito el {format(new Date(inscripcion.fechaInscripcion), 'dd/MM/yyyy')}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-600 flex-shrink-0" />
                  <span className="font-medium">{format(parseISO(examen.fecha), "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}</span>
                </div>
                
                {/* Horario Teórico */}
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center text-sm font-medium mb-2">
                    <Book className="mr-2 h-4 w-4 text-blue-500" />
                    <span className="text-blue-600">Examen Teórico</span>
                  </div>
                  <div className="space-y-2 pl-6">
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-gray-600" />
                      <span>
                        {examen.teorico.horaInicio} - {examen.teorico.horaFin}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Users className="mr-2 h-4 w-4 text-gray-600" />
                      <span>Aula {examen.teorico.aula}</span>
                    </div>
                  </div>
                </div>

                {/* Horario Práctico (si existe) */}
                {examen.practico && (
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <div className="flex items-center text-sm font-medium mb-2">
                      <ClipboardCheck className="mr-2 h-4 w-4 text-green-500" />
                      <span className="text-green-600">Examen Práctico</span>
                    </div>
                    <div className="space-y-2 pl-6">
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-gray-600" />
                        <span>
                        {examen.practico.horaInicio} - {examen.practico.horaFin}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Users className="mr-2 h-4 w-4 text-gray-600" />
                        <span>Aula {examen.practico.aula}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Información del docente */}
                <div className="flex items-center text-sm">
                  <User className="h-4 w-4 mr-2 text-gray-600" />
                  <span className="font-medium">Docente:</span>
                  <span className="ml-1">{examen.docente.nombre} {examen.docente.apellido}</span>
                </div>
                
                {/* Notas y observaciones */}
                {inscripcion.estado === 'aprobada' && inscripcion.nota && (
                  <div className="p-3 bg-green-50 text-green-700 rounded-md text-sm flex items-center">
                    <Check className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>Nota: {inscripcion.nota}</span>
                  </div>
                )}
                
                {inscripcion.estado === 'rechazada' && inscripcion.observaciones && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm flex items-start">
                    <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Observaciones: {inscripcion.observaciones}</span>
                  </div>
                )}
                
                {inscripcion.estado === 'ausente' && (
                  <div className="p-3 bg-yellow-50 text-yellow-700 rounded-md text-sm flex items-start">
                    <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>No te presentaste al examen. Tu inscripción ha sido marcada como ausente.</span>
                  </div>
                )}
                
                {inscripcion.estado === 'libre' && (
                  <div className="p-3 bg-amber-50 text-amber-700 rounded-md text-sm flex items-start">
                    <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Estás inscripto como alumno libre para este examen.</span>
                  </div>
                )}
                
                {isBefore(fechaHoraExamen, new Date()) && inscripcion.estado === 'pendiente' && (
                  <div className="p-3 bg-blue-50 text-blue-700 rounded-md text-sm flex items-start">
                    <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Este examen ya ha finalizado. Esperando calificación.</span>
                  </div>
                )}
              </CardContent>
              
              {puedeCancelar && (
                <CardFooter className="pt-0">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleCancelarInscripcion(inscripcion.id)}
                    disabled={cancelando === inscripcion.id}
                  >
                    {cancelando === inscripcion.id ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Cancelando...
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4 mr-2" />
                        Cancelar inscripción
                      </>
                    )}
                  </Button>
                </CardFooter>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
