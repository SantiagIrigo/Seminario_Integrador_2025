'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { useAuth, getHomePathByRole } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { LucideIcon } from 'lucide-react';
import type { UserRole } from '@/types';
import {
  Home,
  BookOpen,
  ClipboardList,
  Calendar,
  FileText,
  UserCheck,
  LogOut,
  UserPlus,
  BookPlus,
  Building,
  Layers,
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string | ((role?: UserRole) => string);
  icon: LucideIcon;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  { title: 'Inicio', href: (role?: UserRole) => getHomePathByRole(role), icon: Home },
  { title: 'Materias', href: '/materias', icon: BookOpen },
  { title: 'Inscripciones', href: '/inscripciones', icon: ClipboardList, roles: ['estudiante'] },
  { title: 'Mi Horario', href: '/mi-horario', icon: Calendar, roles: ['estudiante', 'profesor'] },
  { title: 'Mis Asistencias', href: '/estudiante/asistencias', icon: UserCheck, roles: ['estudiante'] },
  { title: 'Exámenes', href: '/examenes', icon: FileText, roles: ['estudiante'] },
  { title: 'Gestión de Asistencias', href: '/admin/asistencia', icon: ClipboardList, roles: ['secretaria_academica', 'admin'] },
  { title: 'Alta de Carreras', href: '/admin#gestionar-carreras', icon: Building, roles: ['admin'] },
  { title: 'Alta de Planes', href: '/admin#gestionar-planes', icon: Layers, roles: ['admin'] },
  { title: 'Alta de Materias', href: '/admin#gestionar-materias', icon: BookPlus, roles: ['admin'] },
  { title: 'Alta de Usuarios', href: '/admin#gestionar-usuarios', icon: UserPlus, roles: ['admin'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const filteredItems = useMemo(() => {
    const role = user?.rol;
    return navItems
      .map((item) => {
        const href = typeof item.href === 'function' ? item.href(role) : item.href;
        return { ...item, href };
      })
      .filter((item) => {
        if (!item.roles || item.roles.length === 0) return true;
        if (!user?.rol) return false;
        return item.roles.includes(user.rol);
      });
  }, [user?.rol]);

  const initials = useMemo(() => {
    const first = user?.nombre?.[0] ?? '';
    const last = user?.apellido?.[0] ?? '';
    const combined = `${first}${last}`.trim();
    return combined ? combined.toUpperCase() : 'UN';
  }, [user?.nombre, user?.apellido]);

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center justify-center border-b border-gray-200">
        <span className="text-lg font-semibold text-gray-900">Autogestión</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {filteredItems.map(item => {
            const Icon = item.icon;
            const hrefPath = typeof item.href === 'string' ? item.href : '';
            const basePath = hrefPath.includes('#') ? hrefPath.split('#')[0] : hrefPath;
            const isAnchor = Boolean(basePath);
            const isActive = isAnchor ? pathname === basePath : pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-gray-200 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">
            {initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {user?.nombre} {user?.apellido}
            </p>
            {user?.legajo && (
              <p className="text-xs text-gray-500">Legajo {user.legajo}</p>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-4 w-full justify-center gap-2"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>
    </aside>
  );
}
