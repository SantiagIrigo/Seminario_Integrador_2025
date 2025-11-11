'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, CheckCircle, XCircle, AlertCircle, Loader2, Search, X } from 'lucide-react';
import { format, parseISO, isToday, isPast, isFuture } from 'date-fns';
import { es } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { obtenerClasesPendientesAsistencia, obtenerAsistenciaClase, guardarAsistenciaClase } from '@/services/asistencia.service';
import { toast } from '@/components/ui/use-toast';

interface EstudianteAsistencia {
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
}

interface Clase {
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

const GestionAsistenciaPage = () => {
  const [clases, setClases] = useState<Clase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClase, setSelectedClase] = useState<Clase | null>(null);
  const [asistenciaData, setAsistenciaData] = useState<EstudianteAsistencia[]>([]);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('pendientes');

  useEffect(() => {
    fetchClases();
  }, []);

  const fetchClases = async () => {
    try {
      setLoading(true);
      const data = await obtenerClasesPendientesAsistencia();
      setClases(data);
    } catch (error) {
      console.error('Error al cargar clases:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las clases",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const cargarDatosAsistencia = async (clase: Clase) => {
    try {
      setLoading(true);
      setSelectedClase(clase);
      const { asistencias } = await obtenerAsistenciaClase(clase.id);
      
      // Si no hay asistencias, crear registros vacíos
      if (asistencias.length === 0) {
        // Aquí deberías cargar los estudiantes de la comisión
        // Por ahora, usamos un array vacío
        setAsistenciaData([]);
      } else {
        setAsistenciaData(asistencias);
      }
    } catch (error) {
      console.error('Error al cargar datos de asistencia:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de asistencia",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAsistencia = (inscripcionId: number, presente: boolean) => {
    setAsistenciaData(prev => 
      prev.map(item => 
        item.inscripcionId === inscripcionId 
          ? { 
              ...item, 
              presente,
              // Si se marca como presente, limpiar la justificación
              ...(presente ? { justificacion: undefined } : {}) 
            } 
          : item
      )
    );
  };

  const actualizarJustificacion = (inscripcionId: number, justificacion: string) => {
    setAsistenciaData(prev => 
      prev.map(item => 
        item.inscripcionId === inscripcionId 
          ? { ...item, justificacion } 
          : item
      )
    );
  };

  const marcarTodos = (presente: boolean) => {
    setAsistenciaData(prev => 
      prev.map(item => ({
        ...item,
        presente,
        // Si se marcan como presentes, limpiar justificaciones
        ...(presente ? { justificacion: undefined } : {})
      }))
    );
  };

  const guardarAsistencia = async () => {
    if (!selectedClase) return;
    
    try {
      setSaving(true);
      await guardarAsistenciaClase(selectedClase.id, asistenciaData);
      
      toast({
        title: "Éxito",
        description: "Asistencia guardada correctamente",
      });
      
      // Actualizar el estado de la clase
      setClases(prev => 
        prev.map(c => 
          c.id === selectedClase.id 
            ? { 
                ...c, 
                asistenciaTomada: true, 
                presentes: asistenciaData.filter(a => a.presente).length 
              } 
            : c
        )
      );
      
      // Cerrar el modal
      setSelectedClase(null);
    } catch (error) {
      console.error('Error al guardar asistencia:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la asistencia",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getEstadoClase = (fecha: string, asistenciaTomada: boolean) => {
    const fechaClase = parseISO(fecha);
    
    if (asistenciaTomada) {
      return 'Completada';
    }
    
    if (isPast(fechaClase)) {
      return 'Pendiente';
    }
    
    if (isToday(fechaClase)) {
      return 'Hoy';
    }
    
    if (isFuture(fechaClase)) {
      return 'Próxima';
    }
    
    return '';
  };

  const getEstadoBadge = (estado: string) => {
    const estados: Record<string, { className: string; label: string }> = {
      'Completada': { className: 'bg-green-100 text-green-800', label: 'Completada' },
      'Pendiente': { className: 'bg-yellow-100 text-yellow-800', label: 'Pendiente' },
      'Hoy': { className: 'bg-blue-100 text-blue-800', label: 'Hoy' },
      'Próxima': { className: 'bg-purple-100 text-purple-800', label: 'Próxima' }
    };
    
    const estadoInfo = estados[estado] || { className: 'bg-gray-100 text-gray-800', label: estado };
    
    return (
      <Badge className={estadoInfo.className}>
        {estadoInfo.label}
      </Badge>
    );
  };

  // Filtrar clases según el término de búsqueda
  const filteredClases = clases.filter(clase => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      clase.materia.nombre.toLowerCase().includes(searchLower) ||
      clase.comision.nombre.toLowerCase().includes(searchLower) ||
      (clase.comision.docente?.nombre?.toLowerCase() || '').includes(searchLower) ||
      (clase.comision.docente?.apellido?.toLowerCase() || '').includes(searchLower) ||
      clase.aula.toLowerCase().includes(searchLower)
    );
  });

  // Filtrar estudiantes según el término de búsqueda
  const filteredEstudiantes = selectedClase 
    ? asistenciaData.filter(estudiante => 
        !searchTerm ||
        (estudiante.estudiante.nombre?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (estudiante.estudiante.apellido?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        estudiante.estudiante.dni?.includes(searchTerm)
      )
    : [];

  // Función para renderizar la tarjeta de clase
  const renderClaseCard = (clase: Clase) => (
    <Card key={clase.id} className="mb-4 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-medium text-lg">{clase.materia.nombre}</h3>
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-1" />
              {format(parseISO(clase.fecha), 'PPP', { locale: es })}
              <span className="mx-2">•</span>
              <Clock className="h-4 w-4 mr-1" />
              {clase.horaInicio} - {clase.horaFin}
              <span className="mx-2">•</span>
              <Users className="h-4 w-4 mr-1" />
              {clase.comision.nombre}
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">Docente:</span> {clase.comision.docente.nombre} {clase.comision.docente.apellido}
              <span className="mx-2">•</span>
              <span className="font-medium">Aula:</span> {clase.aula}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => cargarDatosAsistencia(clase)}
              className="whitespace-nowrap"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Tomar Asistencia
            </Button>
            <Button variant="outline" className="whitespace-nowrap">
              <Users className="h-4 w-4 mr-2" />
              Ver Estudiantes
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Función para renderizar el modal de asistencia
  const renderAsistenciaModal = () => {
    if (!selectedClase) return null;
    
    const marcarTodos = (presente: boolean) => {
      setAsistenciaData(prev => 
        prev.map(item => ({
          ...item,
          presente,
          justificacion: presente ? '' : item.justificacion
        }))
      );
    };
    
    const toggleAsistencia = (inscripcionId: number, presente: boolean) => {
      setAsistenciaData(prev => 
        prev.map(item => 
          item.inscripcionId === inscripcionId 
            ? { ...item, presente, justificacion: presente ? item.justificacion : '' }
            : item
        )
      );
    };
    
    const actualizarJustificacion = (inscripcionId: number, justificacion: string) => {
      setAsistenciaData(prev =>
        prev.map(item =>
          item.inscripcionId === inscripcionId
            ? { ...item, justificacion }
            : item
        )
      );
    };
    
    const filteredEstudiantes = asistenciaData.filter(estudiante =>
      `${estudiante.estudiante.nombre} ${estudiante.estudiante.apellido} ${estudiante.estudiante.dni}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Tomar Asistencia</CardTitle>
                <CardDescription>
                  {selectedClase?.materia.nombre} - {format(parseISO(selectedClase.fecha), 'PPP', { locale: es })}
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSelectedClase(null)}
                className="text-gray-600 hover:text-gray-900"
              >
                <XCircle className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => marcarTodos(true)}
                  className="text-green-600 border-green-200 hover:bg-green-50"
                >
                  Marcar todos presentes
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => marcarTodos(false)}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Marcar todos ausentes
                </Button>
              </div>
              <div className="text-sm text-gray-600">
                {asistenciaData.filter(a => a.presente).length} de {asistenciaData.length} estudiantes presentes
              </div>
            </div>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar estudiante..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-2">
                {loading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="h-4 w-4 rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : filteredEstudiantes.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No se encontraron estudiantes</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Estudiante
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-40">
                          Asistencia
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredEstudiantes.map((estudiante) => (
                        <tr key={estudiante.inscripcionId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {estudiante.estudiante.apellido}, {estudiante.estudiante.nombre}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {estudiante.estudiante.dni}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex justify-center space-x-2">
                              <Button
                                variant={estudiante.presente ? "default" : "outline"}
                                size="sm"
                                className={`flex-1 ${estudiante.presente ? 'bg-green-500 hover:bg-green-600' : ''}`}
                                onClick={() => toggleAsistencia(estudiante.inscripcionId, true)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Presente
                              </Button>
                              <Button
                                variant={!estudiante.presente ? "destructive" : "outline"}
                                size="sm"
                                className={`flex-1 ${!estudiante.presente ? 'bg-red-500 hover:bg-red-600' : ''}`}
                                onClick={() => toggleAsistencia(estudiante.inscripcionId, false)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Ausente
                              </Button>
                            </div>
                            {!estudiante.presente && (
                              <div className="mt-2">
                                <Input
                                  type="text"
                                  placeholder="Justificación (opcional)"
                                  value={estudiante.justificacion || ''}
                                  onChange={(e) => actualizarJustificacion(estudiante.inscripcionId, e.target.value)}
                                  className="text-sm"
                                />
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </ScrollArea>
          </CardContent>
          <div className="border-t p-4 flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setSelectedClase(null)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button 
              onClick={guardarAsistencia}
              disabled={saving || asistenciaData.length === 0}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : 'Guardar Asistencia'}
            </Button>
          </div>
        </Card>
      </div>
    );
  };

  // Render principal del componente
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Asistencia</h1>
        <p className="text-gray-600">Administra la asistencia de las clases</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <TabsList>
            <TabsTrigger value="pendientes">Pendientes</TabsTrigger>
            <TabsTrigger value="historial">Historial</TabsTrigger>
          </TabsList>
          
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar por materia, comisión o docente..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <TabsContent value="pendientes" className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredClases.length === 0 ? (
            <Card className="p-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No hay clases pendientes</h3>
              <p className="text-gray-600">No se encontraron clases que requieran la toma de asistencia.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredClases.map(renderClaseCard)}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="historial">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Asistencia</CardTitle>
              <CardDescription>
                Revisa el historial de asistencia de clases anteriores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {clases
                  .filter(clase => clase.asistenciaTomada)
                  .map(clase => (
                    <div key={clase.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{clase.materia.nombre}</h4>
                          <p className="text-sm text-gray-600">
                            {format(parseISO(clase.fecha), 'PPP', { locale: es })} • {clase.horaInicio} - {clase.horaFin}
                          </p>
                          <p className="text-sm text-gray-600">
                            {clase.comision.nombre} • {clase.comision.docente.nombre} {clase.comision.docente.apellido}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            {clase.presentes}/{clase.totalEstudiantes} presentes
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => cargarDatosAsistencia(clase)}
                          >
                            Ver detalles
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                {!loading && clases.filter(clase => clase.asistenciaTomada).length === 0 && (
                  <div className="text-center py-8 text-gray-600">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No hay registro de asistencia en el historial</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {renderAsistenciaModal()}
    </div>
  );
};

// Export the component
export default GestionAsistenciaPage;
