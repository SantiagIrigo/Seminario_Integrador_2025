import { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, User, Users, Book, ClipboardCheck, Trash2, Edit, Search } from 'lucide-react';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { ExamenFinalService, type ExamenFinal } from '@/services/examenFinal.service';
import { useMaterias } from '@/hooks/useMaterias';
import { useDocentes } from '@/hooks/useDocentes';
import { isAxiosError } from 'axios';

const getErrorMessage = (error: unknown) => {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return null;
};

export function AdminExamenesFinales() {
  const [examenes, setExamenes] = useState<ExamenFinal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'proximos' | 'pasados'>('proximos');
  const [examenEditando, setExamenEditando] = useState<ExamenFinal | null>(null);
  const [examenAEliminar, setExamenAEliminar] = useState<ExamenFinal | null>(null);
  const { materias, loading: cargandoMaterias } = useMaterias();
  const { docentes, loading: cargandoDocentes } = useDocentes();
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    materiaId: '',
    docenteId: '',
    fecha: '',
    horaInicioTeorico: '',
    horaFinTeorico: '',
    aulaTeorico: '',
    horaInicioPractico: '',
    horaFinPractico: '',
    aulaPractico: '',
    cupo: '30',
  });
  const [errores, setErrores] = useState<Record<string, string>>({});

  // Cargar exámenes
  useEffect(() => {
    cargarExamenes();
  }, [filtroEstado]);

  const cargarExamenes = async () => {
    try {
      setLoading(true);
      const data = await ExamenFinalService.getExamenesDisponibles();
      
      // Filtrar según el estado seleccionado
      const ahora = new Date();
      const examenesFiltrados = data.filter(examen => {
        const fechaExamen = new Date(`${examen.fecha}T${examen.teorico.horaInicio}`);
        if (filtroEstado === 'proximos') return isAfter(fechaExamen, ahora);
        if (filtroEstado === 'pasados') return isBefore(fechaExamen, ahora);
        return true; // 'todos'
      });
      
      // Ordenar por fecha (más cercano primero)
      const examenesOrdenados = [...examenesFiltrados].sort((a, b) => {
        const fechaA = new Date(`${a.fecha}T${a.teorico.horaInicio}`);
        const fechaB = new Date(`${b.fecha}T${b.teorico.horaInicio}`);
        return fechaA.getTime() - fechaB.getTime();
      });
      
      setExamenes(examenesOrdenados);
    } catch (error) {
      console.error('Error al cargar exámenes:', error);
      toast({
        title: 'Error',
        description: getErrorMessage(error) ?? 'No se pudieron cargar los exámenes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Abrir diálogo para crear/editar examen
  const abrirDialogoNuevoExamen = () => {
    setExamenEditando(null);
    setFormData({
      materiaId: '',
      docenteId: '',
      fecha: '',
      horaInicioTeorico: '',
      horaFinTeorico: '',
      aulaTeorico: '',
      horaInicioPractico: '',
      horaFinPractico: '',
      aulaPractico: '',
      cupo: '30',
    });
    setErrores({});
    setIsDialogOpen(true);
  };

  const abrirDialogoEditarExamen = (examen: ExamenFinal) => {
    setExamenEditando(examen);
    setFormData({
      materiaId: examen.materia.id.toString(),
      docenteId: examen.docente.id.toString(),
      fecha: examen.fecha,
      horaInicioTeorico: examen.teorico.horaInicio,
      horaFinTeorico: examen.teorico.horaFin,
      aulaTeorico: examen.teorico.aula,
      horaInicioPractico: examen.practico?.horaInicio || '',
      horaFinPractico: examen.practico?.horaFin || '',
      aulaPractico: examen.practico?.aula || '',
      cupo: examen.cupo.toString(),
    });
    setErrores({});
    setIsDialogOpen(true);
  };

  // Manejar cambios en el formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error del campo al modificar
    if (errores[name]) {
      setErrores(prev => {
        const newErrores = { ...prev };
        delete newErrores[name];
        return newErrores;
      });
    }
  };

  // Validar formulario
  const validarFormulario = () => {
    const nuevosErrores: Record<string, string> = {};
    
    if (!formData.materiaId) nuevosErrores.materiaId = 'Selecciona una materia';
    if (!formData.docenteId) nuevosErrores.docenteId = 'Selecciona un docente';
    if (!formData.fecha) nuevosErrores.fecha = 'Ingresa una fecha';
    if (!formData.horaInicioTeorico) nuevosErrores.horaInicioTeorico = 'Ingresa la hora de inicio';
    if (!formData.horaFinTeorico) nuevosErrores.horaFinTeorico = 'Ingresa la hora de fin';
    if (!formData.aulaTeorico) nuevosErrores.aulaTeorico = 'Ingresa el aula';
    
    // Validar que la hora de fin sea mayor a la de inicio
    if (formData.horaInicioTeorico && formData.horaFinTeorico && 
        formData.horaFinTeorico <= formData.horaInicioTeorico) {
      nuevosErrores.horaFinTeorico = 'La hora de fin debe ser posterior a la de inicio';
    }
    
    // Validar que si se completó algún campo de práctico, se completen todos
    const hayDatosPractico = formData.horaInicioPractico || formData.horaFinPractico || formData.aulaPractico;
    if (hayDatosPractico) {
      if (!formData.horaInicioPractico) nuevosErrores.horaInicioPractico = 'Ingresa la hora de inicio';
      if (!formData.horaFinPractico) nuevosErrores.horaFinPractico = 'Ingresa la hora de fin';
      if (!formData.aulaPractico) nuevosErrores.aulaPractico = 'Ingresa el aula';
      
      // Validar que la hora de fin sea mayor a la de inicio
      if (formData.horaInicioPractico && formData.horaFinPractico && 
          formData.horaFinPractico <= formData.horaInicioPractico) {
        nuevosErrores.horaFinPractico = 'La hora de fin debe ser posterior a la de inicio';
      }
    }
    
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // Enviar formulario (crear/actualizar)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarFormulario()) return;
    
    try {
      const examenData = {
        materiaId: parseInt(formData.materiaId),
        docenteId: parseInt(formData.docenteId),
        fecha: formData.fecha,
        horaInicioTeorico: formData.horaInicioTeorico,
        horaFinTeorico: formData.horaFinTeorico,
        aulaTeorico: formData.aulaTeorico,
        horaInicioPractico: formData.horaInicioPractico || undefined,
        horaFinPractico: formData.horaFinPractico || undefined,
        aulaPractico: formData.aulaPractico || undefined,
        cupo: parseInt(formData.cupo) || 30,
      };
      
      if (examenEditando) {
        // Actualizar examen existente
        await ExamenFinalService.actualizarExamenFinal(examenEditando.id, examenData);
        toast({
          title: '¡Éxito!',
          description: 'El examen se ha actualizado correctamente',
        });
      } else {
        // Crear nuevo examen
        await ExamenFinalService.crearExamenFinal(examenData);
        toast({
          title: '¡Éxito!',
          description: 'El examen se ha creado correctamente',
        });
      }
      
      setIsDialogOpen(false);
      cargarExamenes();
    } catch (error: unknown) {
      console.error('Error al guardar el examen:', error);
      toast({
        title: 'Error',
        description: getErrorMessage(error) ?? 'Ocurrió un error al guardar el examen',
        variant: 'destructive',
      });
    }
  };

  // Eliminar examen
  const confirmarEliminarExamen = (examen: ExamenFinal) => {
    setExamenAEliminar(examen);
  };

  const handleEliminarExamen = async () => {
    if (!examenAEliminar) return;
    
    try {
      setIsDeleting(true);
      await ExamenFinalService.eliminarExamenFinal(examenAEliminar.id);
      
      toast({
        title: 'Examen eliminado',
        description: 'El examen ha sido eliminado correctamente',
      });
      
      setExamenAEliminar(null);
      cargarExamenes();
    } catch (error) {
      console.error('Error al eliminar el examen:', error);
      toast({
        title: 'Error',
        description: getErrorMessage(error) ?? 'No se pudo eliminar el examen',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtrar exámenes por término de búsqueda
  const examenesFiltrados = examenes.filter(examen => {
    const busqueda = searchTerm.toLowerCase();
    return (
      examen.materia.nombre.toLowerCase().includes(busqueda) ||
      examen.docente.nombre.toLowerCase().includes(busqueda) ||
      examen.docente.apellido.toLowerCase().includes(busqueda) ||
      examen.teorico.aula.toLowerCase().includes(busqueda) ||
      examen.fecha.includes(busqueda)
    );
  });

  // Función para formatear la fecha en español
  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), "EEEE d 'de' MMMM 'de' yyyy", { locale: es });
  };

  // Función para formatear la hora
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  };

  if (loading || cargandoMaterias || cargandoDocentes) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Gestión de Exámenes Finales</h1>
        <Button onClick={abrirDialogoNuevoExamen}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Examen
        </Button>
      </div>

      {/* Filtros y búsqueda */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
          <Input
            placeholder="Buscar por materia, docente, aula o fecha..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select value={filtroEstado} onValueChange={(value: 'todos' | 'proximos' | 'pasados') => setFiltroEstado(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="proximos">Próximos</SelectItem>
            <SelectItem value="pasados">Pasados</SelectItem>
            <SelectItem value="todos">Todos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de exámenes */}
      {examenesFiltrados.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <Book className="mx-auto h-12 w-12 text-gray-600" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">
            {searchTerm ? 'No se encontraron exámenes' : 'No hay exámenes programados'}
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            {searchTerm 
              ? 'Intenta con otros términos de búsqueda.' 
              : 'Crea un nuevo examen para comenzar.'}
          </p>
          {!searchTerm && (
            <Button className="mt-4" onClick={abrirDialogoNuevoExamen}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Examen
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          {examenesFiltrados.map((examen) => {
            const fechaHoraExamen = new Date(`${examen.fecha}T${examen.teorico.horaInicio}`);
            const esPasado = isBefore(fechaHoraExamen, new Date());
            
            return (
              <Card key={examen.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{examen.materia.nombre}</CardTitle>
                      <div className="flex items-center mt-1 space-x-2">
                        <Badge variant={esPasado ? 'outline' : 'default'}>
                          {esPasado ? 'Finalizado' : 'Pendiente'}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {examen.inscriptos} / {examen.cupo} cupos
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => abrirDialogoEditarExamen(examen)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:text-destructive/90"
                        onClick={() => confirmarEliminarExamen(examen)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-600 flex-shrink-0" />
                    <span className="font-medium">{formatDate(examen.fecha)}</span>
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
                          {formatTime(examen.teorico.horaInicio)} - {formatTime(examen.teorico.horaFin)}
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
                            {formatTime(examen.practico.horaInicio)} - {formatTime(examen.practico.horaFin)}
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
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Diálogo para crear/editar examen */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {examenEditando ? 'Editar Examen Final' : 'Nuevo Examen Final'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Materia */}
              <div className="space-y-2">
                <Label htmlFor="materiaId">Materia *</Label>
                <Select 
                  value={formData.materiaId} 
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, materiaId: value }));
                    if (errores.materiaId) {
                      setErrores(prev => ({ ...prev, materiaId: '' }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una materia" />
                  </SelectTrigger>
                  <SelectContent>
                    {materias.map((materia) => (
                      <SelectItem key={materia.id} value={materia.id.toString()}>
                        {materia.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errores.materiaId && (
                  <p className="text-sm text-destructive">{errores.materiaId}</p>
                )}
              </div>
              
              {/* Docente */}
              <div className="space-y-2">
                <Label htmlFor="docenteId">Docente *</Label>
                <Select 
                  value={formData.docenteId} 
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, docenteId: value }));
                    if (errores.docenteId) {
                      setErrores(prev => ({ ...prev, docenteId: '' }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un docente" />
                  </SelectTrigger>
                  <SelectContent>
                    {docentes.map((docente) => (
                      <SelectItem 
                        key={docente.id} 
                        value={docente.id.toString()}
                      >
                        {docente.nombre} {docente.apellido}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errores.docenteId && (
                  <p className="text-sm text-destructive">{errores.docenteId}</p>
                )}
              </div>
              
              {/* Fecha */}
              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha *</Label>
                <Input 
                  type="date" 
                  id="fecha"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]} // No permitir fechas pasadas
                />
                {errores.fecha && (
                  <p className="text-sm text-destructive">{errores.fecha}</p>
                )}
              </div>
              
              {/* Cupo */}
              <div className="space-y-2">
                <Label htmlFor="cupo">Cupo *</Label>
                <Input 
                  type="number" 
                  id="cupo"
                  name="cupo"
                  min="1"
                  value={formData.cupo}
                  onChange={handleChange}
                />
              </div>
              
              {/* Sección Teórico */}
              <div className="col-span-full">
                <h4 className="font-medium mb-3 flex items-center">
                  <Book className="h-4 w-4 mr-2 text-blue-500" />
                  Examen Teórico
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-4">
                  <div className="space-y-2">
                    <Label htmlFor="horaInicioTeorico">Hora Inicio *</Label>
                    <Input 
                      type="time" 
                      id="horaInicioTeorico"
                      name="horaInicioTeorico"
                      value={formData.horaInicioTeorico}
                      onChange={handleChange}
                    />
                    {errores.horaInicioTeorico && (
                      <p className="text-sm text-destructive">{errores.horaInicioTeorico}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="horaFinTeorico">Hora Fin *</Label>
                    <Input 
                      type="time" 
                      id="horaFinTeorico"
                      name="horaFinTeorico"
                      value={formData.horaFinTeorico}
                      onChange={handleChange}
                      min={formData.horaInicioTeorico}
                    />
                    {errores.horaFinTeorico && (
                      <p className="text-sm text-destructive">{errores.horaFinTeorico}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="aulaTeorico">Aula *</Label>
                    <Input 
                      id="aulaTeorico"
                      name="aulaTeorico"
                      value={formData.aulaTeorico}
                      onChange={handleChange}
                      placeholder="Ej: A2, Laboratorio 1"
                    />
                    {errores.aulaTeorico && (
                      <p className="text-sm text-destructive">{errores.aulaTeorico}</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Sección Práctico (Opcional) */}
              <div className="col-span-full">
                <h4 className="font-medium mb-3 flex items-center">
                  <ClipboardCheck className="h-4 w-4 mr-2 text-green-500" />
                  Examen Práctico (Opcional)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-4">
                  <div className="space-y-2">
                    <Label htmlFor="horaInicioPractico">Hora Inicio</Label>
                    <Input 
                      type="time" 
                      id="horaInicioPractico"
                      name="horaInicioPractico"
                      value={formData.horaInicioPractico}
                      onChange={handleChange}
                    />
                    {errores.horaInicioPractico && (
                      <p className="text-sm text-destructive">{errores.horaInicioPractico}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="horaFinPractico">Hora Fin</Label>
                    <Input 
                      type="time" 
                      id="horaFinPractico"
                      name="horaFinPractico"
                      value={formData.horaFinPractico}
                      onChange={handleChange}
                      min={formData.horaInicioPractico}
                    />
                    {errores.horaFinPractico && (
                      <p className="text-sm text-destructive">{errores.horaFinPractico}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="aulaPractico">Aula</Label>
                    <Input 
                      id="aulaPractico"
                      name="aulaPractico"
                      value={formData.aulaPractico}
                      onChange={handleChange}
                      placeholder="Ej: Laboratorio 2"
                    />
                    {errores.aulaPractico && (
                      <p className="text-sm text-destructive">{errores.aulaPractico}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter className="mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {examenEditando ? 'Actualizar Examen' : 'Crear Examen'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para eliminar */}
<Dialog open={!!examenAEliminar} onOpenChange={(open: boolean) => !open && setExamenAEliminar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Estás seguro de eliminar este examen?</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Esta acción no se puede deshacer. Se eliminarán todas las inscripciones asociadas a este examen.
            </p>
            {examenAEliminar && (
              <div className="bg-muted/50 p-3 rounded-md">
                <p className="font-medium">{examenAEliminar.materia.nombre}</p>
                <p className="text-sm">
                  {formatDate(examenAEliminar.fecha)} - {formatTime(examenAEliminar.teorico.horaInicio)}
                </p>
                <p className="text-sm text-gray-600">
                  {examenAEliminar.inscriptos} estudiantes inscriptos
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setExamenAEliminar(null)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleEliminarExamen}
              disabled={isDeleting}
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar Examen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
