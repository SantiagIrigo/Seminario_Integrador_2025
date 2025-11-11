'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { LucideIcon } from 'lucide-react';
import type { UserRole } from '@/types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Menu,
  Home,
  BookOpen,
  GraduationCap,
  Calendar,
  FileText,
  Users,
  Settings,
  LogOut,
  ClipboardList,
  Award,
  Building,
  UserCheck,
  BarChart,
  Clock,
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  // Estudiante
  {
    title: 'Mis Materias',
    href: '/mis-materias',
    icon: BookOpen,
    roles: ['estudiante'],
  },
  {
    title: 'Inscripción Materias',
    href: '/inscripciones',
    icon: ClipboardList,
    roles: ['estudiante'],
  },
  {
    title: 'Inscripción Exámenes',
    href: '/examenes-finales',
    icon: FileText,
    roles: ['estudiante'],
  },
  {
    title: 'Mi Horario',
    href: '/mi-horario',
    icon: Calendar,
    roles: ['estudiante'],
  },
  {
    title: 'Mis Calificaciones',
    href: '/calificaciones',
    icon: Award,
    roles: ['estudiante'],
  },
  // Profesor
  {
    title: 'Mis Clases',
    href: '/profesor/clases',
    icon: GraduationCap,
    roles: ['profesor'],
  },
  {
    title: 'Mi Horario',
    href: '/profesor/horario',
    icon: Calendar,
    roles: ['profesor'],
  },
  {
    title: 'Tomar Asistencia',
    href: '/profesor/asistencia',
    icon: UserCheck,
    roles: ['profesor'],
  },
  {
    title: 'Cargar Notas',
    href: '/profesor/notas',
    icon: Award,
    roles: ['profesor'],
  },
  // Secretaría Académica
  {
    title: 'Gestión Usuarios',
    href: '/admin/usuarios',
    icon: Users,
    roles: ['admin', 'secretaria_academica'],
  },
  {
    title: 'Gestión Carreras',
    href: '/admin/carreras',
    icon: Building,
    roles: ['admin', 'secretaria_academica'],
  },
  {
    title: 'Gestión Materias',
    href: '/admin/materias',
    icon: BookOpen,
    roles: ['admin', 'secretaria_academica'],
  },
  {
    title: 'Reportes',
    href: '/admin/reportes',
    icon: BarChart,
    roles: ['admin', 'secretaria_academica'],
  },
];

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true;
    if (!user?.rol) return false;
    return item.roles.includes(user.rol);
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden fixed top-4 left-4 z-40"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="p-6 border-b">
          <SheetTitle>Sistema de Autogestión</SheetTitle>
        </SheetHeader>
        
        <div className="flex flex-col h-full">
          <nav className="flex-1 px-4 py-6 space-y-2">
            {filteredNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.title}
                </Link>
              );
            })}
          </nav>

          <div className="border-t p-4">
            <div className="mb-4 px-3">
              <p className="text-sm font-medium">{user?.nombre} {user?.apellido}</p>
              <p className="text-xs text-gray-600">{user?.email}</p>
              <p className="text-xs text-gray-600 capitalize mt-1">
                {user?.rol?.replace('_', ' ')}
              </p>
            </div>
            <div className="space-y-2">
              <Link href="/perfil" onClick={() => setOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <Settings className="mr-2 h-4 w-4" />
                  Configuración
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => {
                  logout();
                  setOpen(false);
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
