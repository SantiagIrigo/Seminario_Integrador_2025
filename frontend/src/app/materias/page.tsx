'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  BookOpen,
  Users,
  Clock,
  ChevronRight,
  Calendar,
  MapPin
} from 'lucide-react';
import api from '@/lib/api';

interface MateriaComision {
  id: number;
  nombre: string;
  cupoDisponible?: number;
  cupoMaximo?: number;
  cupo?: number;
  inscripciones?: Array<{ id: number }>;
}

interface Materia {
  id: number;
  nombre: string;
  descripcion?: string;
  departamento?: {
    nombre: string;
  };
  profesores?: Array<{
    nombre: string;
    apellido: string;
  }>;
  comisiones?: MateriaComision[];
  horarios?: Array<{
    dia: string;
    horaInicio: string;
    horaFin: string;
    aula: string;
  }>;
}

export default function MateriasPage() {
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedMateria, setSelectedMateria] = useState<Materia | null>(null);

  const fetchMaterias = async () => {
    try {
      setLoading(true);
      const response = await api.get('/materia');
      // The API returns a paginated response with items in response.data.items
      const materiasData = Array.isArray(response.data?.items) 
        ? response.data.items 
        : Array.isArray(response.data) 
          ? response.data 
          : [];
      
      console.log('Materias cargadas:', materiasData);
      setMaterias(materiasData);
    } catch (error) {
      console.error('Error al cargar materias:', error);
      setMaterias([]); // Ensure materias is always an array
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterias();
  }, []);

  const filteredMaterias = Array.isArray(materias) ? materias.filter(materia => {
    if (!materia) return false;
    const searchLower = searchTerm.toLowerCase();
    return (
      (materia.nombre?.toLowerCase() || '').includes(searchLower) ||
      (materia.descripcion?.toLowerCase() || '').includes(searchLower)
    );
  }) : [];

  const getDayName = (day: string) => {
    const days: { [key: string]: string } = {
      'LUNES': 'Lun',
      'MARTES': 'Mar',
      'MIERCOLES': 'Mié',
      'JUEVES': 'Jue',
      'VIERNES': 'Vie',
      'SABADO': 'Sáb',
    };
    return days[day] || day;
  };

  const formatCupo = (comision: MateriaComision) => {
    if (typeof comision.cupoDisponible === 'number' && typeof comision.cupoMaximo === 'number') {
      return `${comision.cupoDisponible}/${comision.cupoMaximo}`;
    }
    if (typeof comision.cupo === 'number') {
      const inscriptos = comision.inscripciones?.length ?? 0;
      return `${inscriptos}/${comision.cupo}`;
    }
    return 'Sin cupo definido';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Materias</h1>
              <p className="text-gray-600 mt-1">Explora todas las materias disponibles</p>
            </div>
            <div className="flex items-center gap-4">
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
              <Button variant="outline" className="text-gray-900 border-gray-300 hover:bg-gray-100">
                <Filter className="h-4 w-4 mr-2 text-gray-600" />
                Filtros
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredMaterias.length > 0 ? (
          <div className="grid gap-6">
            {filteredMaterias.map((materia) => (
              <Card key={materia.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{materia.nombre}</CardTitle>
                      {materia.descripcion && (
                        <CardDescription className="mt-1">{materia.descripcion}</CardDescription>
                      )}
                      {materia.departamento?.nombre && (
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            {materia.departamento.nombre}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" className="text-gray-500">
                      Ver detalles <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                {(materia.comisiones && materia.comisiones.length > 0) && (
                  <CardContent>
                    <div className="space-y-4">
                      {materia.comisiones.map((comision) => (
                        <div key={comision.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{comision.nombre}</h4>
                            <Badge variant="secondary">
                              {formatCupo(comision)} cupos
                            </Badge>
                          </div>
                          
                          {materia.horarios && materia.horarios.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {materia.horarios.map((horario, idx) => (
                                <div key={idx} className="flex items-center text-sm text-gray-600">
                                  <Calendar className="h-4 w-4 mr-1.5 text-gray-400" />
                                  <span>{getDayName(horario.dia)}</span>
                                  <Clock className="h-4 w-4 ml-3 mr-1.5 text-gray-400" />
                                  <span>{horario.horaInicio} - {horario.horaFin}</span>
                                  {horario.aula && (
                                    <>
                                      <MapPin className="h-4 w-4 ml-3 mr-1.5 text-gray-400" />
                                      <span>{horario.aula}</span>
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No se encontraron materias</h3>
            <p className="mt-1 text-gray-500">
              {searchTerm ? 'No hay materias que coincidan con tu búsqueda.' : 'No hay materias disponibles en este momento.'}
            </p>
            {searchTerm && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setSearchTerm('')}
              >
                Limpiar búsqueda
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
