'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  GraduationCap,
  ClipboardList,
  Building,
  ShieldCheck,
  ArrowRight,
  UserPlus,
  BookPlus,
  University,
  Layers,
} from 'lucide-react';
import { AdminMateriasForm } from '@/components/admin/AdminMateriasForm';
import { AdminUsuariosForm } from '@/components/admin/AdminUsuariosForm';
import { AdminCarrerasForm } from '@/components/admin/AdminCarrerasForm';
import { AdminPlanesEstudioForm } from '@/components/admin/AdminPlanesEstudioForm';

const adminStats = [
  {
    title: 'Usuarios activos',
    value: '128',
    description: 'Personas con acceso al sistema',
    icon: Users,
    accent: 'text-blue-600',
  },
  {
    title: 'Carreras',
    value: '6',
    description: 'Planes de estudio habilitados',
    icon: GraduationCap,
    accent: 'text-purple-600',
  },
  {
    title: 'Comisiones',
    value: '24',
    description: 'En seguimiento este cuatrimestre',
    icon: ClipboardList,
    accent: 'text-emerald-600',
  },
  {
    title: 'Departamentos',
    value: '5',
    description: 'Áreas académicas registradas',
    icon: Building,
    accent: 'text-amber-600',
  },
];

const adminActions = [
  {
    title: 'Gestión de asistencias',
    description: 'Revisá y cerrá la asistencia cargada por docentes.',
    href: '/admin/asistencia',
    icon: ClipboardList,
  },
  {
    title: 'Planes y materias',
    description: 'Consultá o actualizá la oferta académica vigente.',
    href: '/materias',
    icon: GraduationCap,
  },
  {
    title: 'Horarios y comisiones',
    description: 'Visualizá la carga horaria y cupos de cada comisión.',
    href: '/horarios',
    icon: ShieldCheck,
  },
  {
    title: 'Crear materia',
    description: 'Accedé al formulario de alta rápida.',
    href: '#gestionar-materias',
    icon: BookPlus,
  },
  {
    title: 'Crear usuario',
    description: 'Generá nuevas cuentas y asigná roles.',
    href: '#gestionar-usuarios',
    icon: UserPlus,
  },
  {
    title: 'Crear carrera',
    description: 'Definí nuevas carreras antes de asociarlas a planes.',
    href: '#gestionar-carreras',
    icon: University,
  },
  {
    title: 'Crear plan de estudio',
    description: 'Asociá planes al calendario académico.',
    href: '#gestionar-planes',
    icon: Layers,
  },
];

export default function AdminHomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2 py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Bienvenido, {user?.nombre ?? 'Administrador'}
            </h1>
            <p className="text-gray-600">
              Tenés acceso a las herramientas administrativas del sistema de autogestión.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {adminStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-900">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-5 w-5 ${stat.accent}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold text-gray-900">{stat.value}</div>
                  <CardDescription className="text-sm text-gray-600">
                    {stat.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminActions.map(action => {
            const Icon = action.icon;
            return (
              <Card key={action.title} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-900/10">
                      <Icon className="h-6 w-6 text-gray-900" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-gray-900">{action.title}</CardTitle>
                      <CardDescription className="text-sm text-gray-600">
                        {action.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <Button asChild variant="outline" className="w-full justify-between">
                    <Link href={action.href}>
                      Ir a la sección
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="space-y-8">
          <div id="gestionar-carreras">
            <AdminCarrerasForm />
          </div>
          <div id="gestionar-planes">
            <AdminPlanesEstudioForm />
          </div>
          <div id="gestionar-materias">
            <AdminMateriasForm />
          </div>
          <div id="gestionar-usuarios">
            <AdminUsuariosForm />
          </div>
        </div>
      </div>
    </div>
  );
}
