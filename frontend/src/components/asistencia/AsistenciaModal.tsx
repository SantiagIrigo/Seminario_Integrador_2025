'use client';

import { useState, useEffect } from 'react';
import { X, Check, XCircle, Loader2, AlertCircle, User, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

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

interface AsistenciaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (asistencias: Array<{ inscripcionId: number; presente: boolean; justificacion?: string }>) => Promise<void>;
  loading: boolean;
  clase: {
    id: number;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    aula: string;
    materia: {
      nombre: string;
    };
    comision: {
      nombre: string;
      docente: {
        nombre: string;
        apellido: string;
      };
    };
  };
  estudiantes: EstudianteAsistencia[];
  titulo?: string;
}

export function AsistenciaModal({
  isOpen,
  onClose,
  onSave,
  loading,
  clase,
  estudiantes: initialEstudiantes,
  titulo = 'Tomar Asistencia'
}: AsistenciaModalProps) {
  const [estudiantes, setEstudiantes] = useState<EstudianteAsistencia[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [justificaciones, setJustificaciones] = useState<Record<number, string>>({});
  const [showJustificacion, setShowJustificacion] = useState<number | null>(null);

  // Inicializar estudiantes cuando cambia la prop
  useEffect(() => {
    if (initialEstudiantes) {
      setEstudiantes(initialEstudiantes);
      
      // Inicializar justificaciones
      const justifs: Record<number, string> = {};
      initialEstudiantes.forEach(est => {
        if (est.justificacion) {
          justifs[est.inscripcionId] = est.justificacion;
        }
      });
      setJustificaciones(justifs);
    }
  }, [initialEstudiantes]);

  const toggleAsistencia = (inscripcionId: number, presente: boolean) => {
    setEstudiantes(prev => 
      prev.map(est => 
        est.inscripcionId === inscripcionId 
          ? { ...est, presente }
          : est
      )
    );
    
    // Si se marca como presente, eliminar cualquier justificación existente
    if (presente) {
      setJustificaciones(prev => {
        const nuevas = { ...prev };
        delete nuevas[inscripcionId];
        return nuevas;
      });
    }
  };

  const handleJustificacionChange = (inscripcionId: number, valor: string) => {
    setJustificaciones(prev => ({
      ...prev,
      [inscripcionId]: valor
    }));
  };

  const toggleJustificacion = (inscripcionId: number) => {
    if (showJustificacion === inscripcionId) {
      setShowJustificacion(null);
    } else {
      setShowJustificacion(inscripcionId);
      
      // Si se abre la justificación y el estudiante está presente, marcarlo como ausente
      const estudiante = estudiantes.find(e => e.inscripcionId === inscripcionId);
      if (estudiante?.presente) {
        toggleAsistencia(inscripcionId, false);
      }
    }
  };

  const handleSave = async () => {
    // Preparar datos para enviar
    const asistencias = estudiantes.map(est => ({
      inscripcionId: est.inscripcionId,
      presente: est.presente,
      justificacion: justificaciones[est.inscripcionId] || undefined
    }));
    
    await onSave(asistencias);
  };

  // Filtrar estudiantes por búsqueda
  const estudiantesFiltrados = estudiantes.filter(est => {
    const busquedaLower = busqueda.toLowerCase();
    return (
      est.estudiante.nombre.toLowerCase().includes(busquedaLower) ||
      est.estudiante.apellido.toLowerCase().includes(busquedaLower) ||
      est.estudiante.dni.includes(busqueda)
    );
  });

  if (!isOpen) return null;

  const totalPresentes = estudiantes.filter(e => e.presente).length;
  const totalAusentes = estudiantes.length - totalPresentes;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold">{titulo}</h2>
            <p className="text-gray-600">
              {clase.materia.nombre} - {clase.comision.nombre}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {format(new Date(clase.fecha), "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {clase.horaInicio} - {clase.horaFin}
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                Aula {clase.aula}
              </div>
              <div className="flex items-center">
                <User className="h-4 w-4 mr-1" />
                {clase.comision.docente.nombre} {clase.comision.docente.apellido}
              </div>
            </div>
            
            <div className="flex gap-4 mt-2">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                <span className="text-sm font-medium">{totalPresentes} presentes</span>
              </div>
              <div className="flex items-center">
                <XCircle className="h-4 w-4 mr-1 text-red-500" />
                <span className="text-sm font-medium">{totalAusentes} ausentes</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="text-gray-600 hover:text-gray-700 p-1 -m-1"
            disabled={loading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Barra de búsqueda y acciones */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar estudiante..."
                className="pl-10"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEstudiantes(prev => 
                    prev.map(est => ({ ...est, presente: true }))
                  );
                  setJustificaciones({});
                }}
                disabled={loading}
              >
                <Check className="h-4 w-4 mr-2" />
                Marcar todos presentes
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEstudiantes(prev => 
                    prev.map(est => ({ ...est, presente: false }))
                  );
                }}
                disabled={loading}
              >
                <X className="h-4 w-4 mr-2" />
                Marcar todos ausentes
              </Button>
            </div>
          </div>
        </div>
        
        {/* Lista de estudiantes */}
        <ScrollArea className="flex-1">
          <div className="divide-y">
            {estudiantesFiltrados.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>No se encontraron estudiantes</p>
              </div>
            ) : (
              estudiantesFiltrados.map((estudiante) => (
                <div key={estudiante.inscripcionId} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-medium mr-3 flex-shrink-0">
                          {estudiante.estudiante.nombre[0]}{estudiante.estudiante.apellido[0]}
                        </div>
                        <div>
                          <h4 className="font-medium">
                            {estudiante.estudiante.apellido}, {estudiante.estudiante.nombre}
                          </h4>
                          <p className="text-sm text-gray-600">
                            DNI: {estudiante.estudiante.dni}
                          </p>
                        </div>
                      </div>
                      
                      {showJustificacion === estudiante.inscripcionId && (
                        <div className="mt-3 pl-13 pr-2">
                          <Input
                            placeholder="Motivo de la ausencia (opcional)"
                            value={justificaciones[estudiante.inscripcionId] || ''}
                            onChange={(e) => handleJustificacionChange(estudiante.inscripcionId, e.target.value)}
                            className="w-full"
                            disabled={loading}
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        type="button"
                        className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center ${
                          estudiante.presente
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => toggleAsistencia(estudiante.inscripcionId, true)}
                        disabled={loading}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Presente
                      </button>
                      
                      <button
                        type="button"
                        className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center ${
                          !estudiante.presente
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => toggleJustificacion(estudiante.inscripcionId)}
                        disabled={loading}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Ausente
                      </button>
                      
                      {!estudiante.presente && justificaciones[estudiante.inscripcionId] && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          Justificado
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        
        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="text-sm text-gray-600">
            {estudiantesFiltrados.length} estudiantes mostrados • {estudiantes.length} en total
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || estudiantes.length === 0}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Asistencia'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componentes de íconos necesarios
function Calendar({ className = '' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`h-4 w-4 ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

function Clock({ className = '' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`h-4 w-4 ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function MapPin({ className = '' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`h-4 w-4 ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function Search({ className = '' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`h-4 w-4 ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

export default AsistenciaModal;
