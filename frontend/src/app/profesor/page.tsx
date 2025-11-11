'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ClipboardCheck, Users, FileText, MapPin, ArrowRight } from 'lucide-react';

const quickActions = [
  {
    title: 'Tomar asistencia',
    description: 'Accedé a las clases programadas para cargar asistencia.',
    href: '/admin/asistencia',
    icon: ClipboardCheck,
  },
  {
    title: 'Mi horario',
    description: 'Consultá tus comisiones y aulas asignadas.',
    href: '/mi-horario',
    icon: Calendar,
  },
  {
    title: 'Calificaciones',
    description: 'Revisá notas publicadas y evaluaciones pendientes.',
    href: '/calificaciones',
    icon: FileText,
  },
];

const sampleClasses = [
  {
    subject: 'Algoritmos y Estructuras de Datos',
    commission: 'Turno Mañana',
    date: 'Lunes 10:00 - Aula 204',
    status: 'Pendiente',
  },
  {
    subject: 'Programación Orientada a Objetos',
    commission: 'Turno Tarde',
    date: 'Martes 18:00 - Aula 105',
    status: 'Hoy',
  },
  {
    subject: 'Sistemas Operativos',
    commission: 'Turno Noche',
    date: 'Jueves 20:00 - Aula 310',
    status: 'Completada',
  },
];

export default function ProfesorHomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2 py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Hola, {user?.nombre ?? 'Profesor'}
            </h1>
            <p className="text-gray-600">
              Gestioná tus clases, asistencia y evaluaciones desde un solo lugar.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card key={action.title} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500/10">
                      <Icon className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-gray-900">{action.title}</CardTitle>
                      <CardDescription className="text-sm text-gray-600">
                        {action.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="mt-auto">
                  <Button asChild variant="outline" className="w-full justify-between">
                    <Link href={action.href}>
                      Abrir
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">Próximas clases</CardTitle>
            <CardDescription className="text-gray-600">
              Un vistazo rápido a tus comisiones programadas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sampleClasses.map((item) => (
              <div
                key={`${item.subject}-${item.commission}`}
                className="flex flex-col gap-1 rounded-lg border border-gray-200 bg-white p-4 md:flex-row md:items-center md:justify-between md:gap-4"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.subject}</p>
                  <p className="text-sm text-gray-600">{item.commission}</p>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  {item.date}
                </div>
                <span className="inline-flex w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                  {item.status}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">Seguimiento de asistencia</CardTitle>
            <CardDescription className="text-gray-600">
              Resumen de las últimas comisiones con asistencia registrada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                { title: 'Comisiones con asistencia completa', value: '4', icon: Users },
                { title: 'Pendientes por cargar', value: '2', icon: ClipboardCheck },
                { title: 'Promedio de asistencia', value: '87%', icon: FileText },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="flex flex-col gap-1 rounded-lg border border-gray-200 bg-gray-50 p-4"
                  >
                    <Icon className="h-5 w-5 text-indigo-600" />
                    <p className="text-sm font-semibold text-gray-900">{item.value}</p>
                    <p className="text-xs text-gray-600">{item.title}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
