"use client";

import { useEffect, useState } from 'react';
import { Calendar, Clock, User, BookOpen, ClipboardCheck } from 'lucide-react';
import { format, parseISO, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExamenFinalService, type ExamenFinal } from '@/services/examenFinal.service';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { isAxiosError } from 'axios';

export function ExamenFinalList() {
  const [examenes, setExamenes] = useState<ExamenFinal[]>([]);
  const [loading, setLoading] = useState(true);
  const [inscribiendo, setInscribiendo] = useState<number | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    cargarExamenes();
  }, []);

  const cargarExamenes = async () => {
    try {
      const data = await ExamenFinalService.getExamenesDisponibles();
      // Filtrar exámenes futuros
      const examenesFuturos = data.filter(examen => 
        isAfter(new Date(`${examen.fecha}T${examen.horaInicioTeorico}`), new Date())
      );
      setExamenes(examenesFuturos);
    } catch (error) {
      console.error('Error al cargar exámenes finales:', error);
      const message = isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message
        : error instanceof Error
          ? error.message
          : null;
      toast({
        title: 'Error',
        description: message || 'No se pudieron cargar los exámenes finales',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInscripcion = async (examen: ExamenFinal) => {
    if (!user) return;
    
    setInscribiendo(examen.id);
    try {
      // Realizar inscripción
      await ExamenFinalService.inscribirAExamen(examen.id);
      
      toast({
        title: '¡Inscripción exitosa!',
        description: `Te has inscripto al examen final de ${examen.materia.nombre}`,
      });
      
      // Actualizar lista de exámenes
      const nuevosExamenes = examenes.map(e => 
        e.id === examen.id ? { ...e, inscriptos: e.inscriptos + 1, disponibles: e.disponibles - 1 } : e
      );
      setExamenes(nuevosExamenes);
    } catch (error: unknown) {
      console.error('Error al inscribirse al examen:', error);
      const message = isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message
        : error instanceof Error
          ? error.message
          : null;
      toast({
        title: 'Error',
        description: message || 'Error al inscribirse al examen',
        variant: 'destructive',
      });
    } finally {
      setInscribiendo(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (examenes.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">No hay exámenes disponibles</h3>
        <p className="mt-1 text-sm text-gray-600">No se encontraron exámenes finales para inscribirse en este momento.</p>
      </div>
    );
  }

  // Función para formatear la fecha en español
  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'EEEE d \'de\' MMMM \'de\' yyyy', { locale: es });
  };

  // Función para formatear la hora
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {examenes.map((examen) => (
          <Card key={examen.id} className="flex flex-col h-full">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{examen.materia.nombre}</CardTitle>
                <Badge variant={examen.disponibles > 0 ? 'default' : 'destructive'} className="ml-2">
                  {examen.inscriptos}/{examen.cupo} {examen.disponibles > 0 ? 'cupos' : 'sin cupo'}
                </Badge>
              </div>
              <div className="flex items-center text-sm text-gray-600 mt-1">
                <User className="mr-1 h-4 w-4" />
                {`${examen.docente.nombre} ${examen.docente.apellido}`}
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-4">
                <div className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4 text-gray-600 flex-shrink-0" />
                  <span className="font-medium">
                    {format(new Date(examen.fecha), 'PPP', { locale: es })}
                  </span>
                </div>
                
                {/* Horario Teórico */}
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center text-sm font-medium mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-600" />
                      <span>{format(new Date(examen.fecha), 'PPP', { locale: es })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-600" />
                      <span>{examen.horaInicioTeorico} - {examen.horaFinTeorico}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-gray-600" />
                      <span>{examen.aulaTeorico}</span>
                    </div>
                  </div>
                </div>

                {/* Horario Práctico (si existe) */}
                {examen.horaInicioPractico && examen.aulaPractico && (
                  <>
                    <div className="flex items-center text-sm font-medium mb-2 mt-4">
                      <ClipboardCheck className="mr-2 h-4 w-4 text-green-500" />
                      <span className="text-green-600">Examen Práctico</span>
                    </div>
                    <div className="space-y-2 pl-6">
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-gray-600" />
                        <span>
                          {examen.horaInicioPractico} - {examen.horaFinPractico}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <User className="mr-2 h-4 w-4 text-gray-600" />
                        <span>Aula {examen.aulaPractico}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button
                onClick={() => handleInscripcion(examen)}
                disabled={examen.disponibles <= 0 || inscribiendo === examen.id}
                className="w-full"
              >
                {inscribiendo === examen.id ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Procesando...
                  </>
                ) : examen.disponibles <= 0 ? (
                  'Cupo agotado'
                ) : (
                  `Inscribirse (${examen.disponibles} ${examen.disponibles === 1 ? 'cupo' : 'cupos'} disponible)`
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
