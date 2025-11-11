import { Clock, Calendar, Users, Check, AlertCircle } from 'lucide-react';
import { format, parseISO, isToday, isPast, isFuture } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export interface ClaseCardProps {
  id: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  aula: string;
  tipo: 'teorica' | 'practica';
  materia: {
    id: number;
    nombre: string;
    correlativasCursada?: { correlativa: { id: number; nombre: string } }[];
    correlativasFinal?: { correlativa: { id: number; nombre: string } }[];
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
  onTomarAsistencia?: (claseId: number) => void;
  onVerDetalles?: (claseId: number) => void;
  className?: string;
}

export function ClaseCard({
  id,
  fecha,
  horaInicio,
  horaFin,
  aula,
  tipo,
  materia,
  comision,
  asistenciaTomada,
  totalEstudiantes,
  presentes,
  onTomarAsistencia,
  onVerDetalles,
  className = ''
}: ClaseCardProps) {
  const getEstadoClase = () => {
    const fechaClase = parseISO(fecha);
    
    if (asistenciaTomada) {
      return { estado: 'Completada', className: 'bg-green-100 text-green-800' };
    }
    
    if (isPast(fechaClase)) {
      return { estado: 'Pendiente', className: 'bg-yellow-100 text-yellow-800' };
    }
    
    if (isToday(fechaClase)) {
      return { estado: 'Hoy', className: 'bg-blue-100 text-blue-800' };
    }
    
    if (isFuture(fechaClase)) {
      return { estado: 'Próxima', className: 'bg-purple-100 text-purple-800' };
    }
    
    return { estado: '', className: 'bg-gray-100 text-gray-800' };
  };

  const { estado, className: estadoClassName } = getEstadoClase();
  const fechaClase = parseISO(fecha);
  const esHoy = isToday(fechaClase);
  const esPasada = isPast(fechaClase) && !esHoy;
  const esFutura = isFuture(fechaClase);

  return (
    <Card className={`overflow-hidden transition-all hover:shadow-md ${className}`}>
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h3 className="text-lg font-semibold">{materia.nombre}</h3>
              <div className="flex gap-2">
                <Badge variant={tipo === 'teorica' ? 'secondary' : 'default'}>
                  {tipo === 'teorica' ? 'Teórica' : 'Práctica'}
                </Badge>
                <Badge variant="outline" className={estadoClassName}>
                  {estado}
                </Badge>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-1">{comision.nombre}</p>
            
            <div className="mt-3 space-y-1 text-sm">
              <div className="flex items-center text-gray-700">
                <Calendar className="h-4 w-4 mr-2 text-gray-600" />
                {format(fechaClase, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
              </div>
              <div className="flex items-center text-gray-700">
                <Clock className="h-4 w-4 mr-2 text-gray-600" />
                {horaInicio} - {horaFin}
              </div>
              <div className="flex items-center text-gray-700">
                <Users className="h-4 w-4 mr-2 text-gray-600" />
                {presentes} / {totalEstudiantes} estudiantes
                {asistenciaTomada && (
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                    {Math.round((presentes / totalEstudiantes) * 100)}% asistencia
                  </span>
                )}
              </div>
              <div className="flex items-center text-gray-700">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-4 w-4 mr-2 text-gray-600" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" 
                  />
                </svg>
                Aula {aula}
              </div>
              <div className="flex items-center text-gray-700">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-4 w-4 mr-2 text-gray-600" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                  />
                </svg>
                {comision.docente.nombre} {comision.docente.apellido}
              </div>
              {materia.correlativasCursada && materia.correlativasCursada.length > 0 && (
                <div className="flex items-center text-gray-700">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-4 w-4 mr-2 text-gray-600" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M9 12l2 2 4-4m5.618-2.763a6.753 6.753 0 011.414 2.09A6.75 6.75 0 0119 8v3a6.75 6.75 0 01-3.564 4.064A6.752 6.752 0 010.778 13L3.243 9.43a6.752 6.752 0 01-1.86 3.44A6.75 6.75 0 005 12v-2a6.75 6.75 0 016 6.75z" 
                    />
                  </svg>
                  Correlativas cursadas: {materia.correlativasCursada.map(correlativa => correlativa.correlativa.nombre).join(', ')}
                </div>
              )}
              {materia.correlativasFinal && materia.correlativasFinal.length > 0 && (
                <div className="flex items-center text-gray-700">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-4 w-4 mr-2 text-gray-600" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M9 12l2 2 4-4m5.618-2.763a6.753 6.753 0 011.414 2.09A6.75 6.75 0 0119 8v3a6.75 6.75 0 01-3.564 4.064A6.752 6.752 0 010.778 13L3.243 9.43a6.752 6.752 0 01-1.86 3.44A6.75 6.75 0 005 12v-2a6.75 6.75 0 016 6.75z" 
                    />
                  </svg>
                  Correlativas finales: {materia.correlativasFinal.map(correlativa => correlativa.correlativa.nombre).join(', ')}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-end space-y-2">
            {asistenciaTomada ? (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onVerDetalles && onVerDetalles(id)}
              >
                <Check className="h-4 w-4 mr-2 text-green-600" />
                Ver Asistencia
              </Button>
            ) : (
              <Button 
                variant="default" 
                size="sm"
                onClick={() => onTomarAsistencia && onTomarAsistencia(id)}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-4 w-4 mr-2" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" 
                  />
                </svg>
                Tomar Asistencia
              </Button>
            )}
            
            {esHoy && !asistenciaTomada && (
              <div className="flex items-center text-yellow-600 text-xs bg-yellow-50 px-2 py-1 rounded-md">
                <AlertCircle className="h-3 w-3 mr-1" />
                Asistencia pendiente para hoy
              </div>
            )}
            
            {esPasada && !asistenciaTomada && (
              <div className="flex items-center text-red-600 text-xs bg-red-50 px-2 py-1 rounded-md">
                <AlertCircle className="h-3 w-3 mr-1" />
                Asistencia atrasada
              </div>
            )}
            
            {esFutura && (
              <div className="text-xs text-gray-600 text-right">
                {format(fechaClase, "d 'de' MMM", { locale: es })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default ClaseCard;
