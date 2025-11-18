'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import AdminService, { CreateUserPayload, PlanEstudioOption } from '@/services/admin.service';
import { User, UserRole } from '@/types';
import { AxiosError } from 'axios';

const roles: { label: string; value: UserRole }[] = [
  { label: 'Administrador', value: 'admin' },
  { label: 'Profesor', value: 'profesor' },
  { label: 'Estudiante', value: 'estudiante' },
  { label: 'Secretaría Académica', value: 'secretaria_academica' },
];

const emptyForm = {
  nombre: '',
  apellido: '',
  email: '',
  password: '',
  dni: '',
  legajo: '',
  rol: 'estudiante' as UserRole,
  planEstudioId: '',
};

export function AdminUsuariosForm() {
  const { toast } = useToast();
  const [formData, setFormData] = useState(emptyForm);
  const [planes, setPlanes] = useState<PlanEstudioOption[]>([]);
  const [usuariosRecientes, setUsuariosRecientes] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [planesEstudio, usuarios] = await Promise.all([
          AdminService.getPlanesEstudio(),
          AdminService.getUsers(1, 5),
        ]);
        setPlanes(planesEstudio);
        setUsuariosRecientes(usuarios.items);
      } catch (error) {
        console.error('Error al cargar catálogos', error);
        toast({
          title: 'Error',
          description: 'No pudimos cargar los datos iniciales.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const requiresPlan = useMemo(() => formData.rol === 'estudiante', [formData.rol]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.nombre.trim() || !formData.apellido.trim() || !formData.email.trim()) {
      toast({
        title: 'Datos incompletos',
        description: 'Completá los datos obligatorios.',
        variant: 'destructive',
      });
      return;
    }

    if (requiresPlan && !formData.planEstudioId) {
      toast({
        title: 'Plan requerido',
        description: 'Asigná un plan de estudio para estudiantes.',
        variant: 'destructive',
      });
      return;
    }

    const payload: CreateUserPayload = {
      nombre: formData.nombre.trim(),
      apellido: formData.apellido.trim(),
      email: formData.email.trim(),
      password: formData.password || 'password123',
      dni: formData.dni.trim(),
      legajo: formData.legajo.trim(),
      rol: formData.rol,
      planEstudioId: requiresPlan && formData.planEstudioId ? Number(formData.planEstudioId) : undefined,
    };

    try {
      setSubmitting(true);
      const user = await AdminService.createUser(payload);
      toast({
        title: 'Usuario creado',
        description: `${user.nombre} ${user.apellido} ahora puede acceder al sistema.`,
      });
      setUsuariosRecientes(prev => [user, ...prev].slice(0, 5));
      setFormData({ ...emptyForm, rol: formData.rol });
    } catch (error: unknown) {
      const message =
        error instanceof AxiosError
          ? error.response?.data?.message ?? error.message
          : 'Intentá nuevamente.';
      console.error('Error al crear usuario', error);
      toast({
        title: 'No se pudo crear el usuario',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alta de usuarios</CardTitle>
        <CardDescription>Creá cuentas para estudiantes, profesores o personal administrativo.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={event => handleChange('nombre', event.target.value)}
                  placeholder="Ej. Juana"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellido">Apellido</Label>
                <Input
                  id="apellido"
                  value={formData.apellido}
                  onChange={event => handleChange('apellido', event.target.value)}
                  placeholder="Ej. Pérez"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email institucional</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={event => handleChange('email', event.target.value)}
                  placeholder="usuario@universidad.edu"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña temporal</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={event => handleChange('password', event.target.value)}
                  placeholder="Se generará una por defecto si se deja vacío"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="dni">DNI</Label>
                <Input
                  id="dni"
                  value={formData.dni}
                  onChange={event => handleChange('dni', event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="legajo">Legajo</Label>
                <Input
                  id="legajo"
                  value={formData.legajo}
                  onChange={event => handleChange('legajo', event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select value={formData.rol} onValueChange={value => handleChange('rol', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccioná un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Plan de estudio</Label>
              <Select
                value={formData.planEstudioId}
                onValueChange={value => handleChange('planEstudioId', value)}
                disabled={!requiresPlan}
              >
                <SelectTrigger>
                  <SelectValue placeholder={requiresPlan ? 'Seleccioná un plan' : 'Solo para estudiantes'} />
                </SelectTrigger>
                <SelectContent>
                  {planes.map(plan => (
                    <SelectItem key={plan.id} value={plan.id.toString()}>
                      {plan.nombre} {plan.carrera ? `- ${plan.carrera.nombre}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {requiresPlan && (
                <p className="text-xs text-gray-500">Este campo es obligatorio para estudiantes.</p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setFormData(emptyForm)} disabled={submitting}>
                Limpiar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Crear usuario'
                )}
              </Button>
            </div>
          </form>
        )}

        <div>
          <p className="text-sm font-medium text-gray-900 mb-2">Altas recientes</p>
          {usuariosRecientes.length === 0 ? (
            <p className="text-sm text-gray-500">Todavía no hay usuarios cargados.</p>
          ) : (
            <ScrollArea className="max-h-[260px]">
              <div className="divide-y">
                {usuariosRecientes.map(usuario => (
                  <div key={usuario.id} className="py-3 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">
                        {usuario.nombre} {usuario.apellido}
                      </p>
                      <Badge variant="outline">{usuario.rol}</Badge>
                    </div>
                    <p className="text-sm text-gray-500">{usuario.email}</p>
                    {usuario.planEstudio?.nombre && (
                      <p className="text-xs text-gray-500">
                        Plan: {usuario.planEstudio.nombre}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
