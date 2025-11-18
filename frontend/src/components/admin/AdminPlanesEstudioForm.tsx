'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import AdminService, {
  Carrera,
  CreatePlanEstudioPayload,
  PlanEstudioOption,
} from '@/services/admin.service';
import { AxiosError } from 'axios';

const emptyForm = {
  nombre: '',
  descripcion: '',
  año: '',
  carreraId: '',
};

export function AdminPlanesEstudioForm() {
  const { toast } = useToast();
  const [formData, setFormData] = useState(emptyForm);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [planes, setPlanes] = useState<PlanEstudioOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [carrerasData, planesData] = await Promise.all([
          AdminService.getCarreras(),
          AdminService.getPlanesEstudio(),
        ]);
        setCarreras(carrerasData);
        setPlanes(planesData);
      } catch (error) {
        console.error('Error al cargar catálogos de planes', error);
        toast({
          title: 'No se pudieron cargar planes/carreras',
          description: 'Verificá la API y vuelve a intentarlo.',
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.nombre.trim() || !formData.carreraId || !formData.año) {
      toast({
        title: 'Datos incompletos',
        description: 'Completá nombre, carrera y año del plan.',
        variant: 'destructive',
      });
      return;
    }

    const payload: CreatePlanEstudioPayload = {
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion?.trim() || undefined,
      año: Number(formData.año),
      carreraId: Number(formData.carreraId),
    };

    try {
      setSubmitting(true);
      const plan = await AdminService.createPlanEstudio(payload);
      toast({
        title: 'Plan de estudio creado',
        description: `${plan.nombre} (${plan.año ?? '-'})`,
      });
      setPlanes(prev => [plan, ...prev]);
      setFormData(emptyForm);
    } catch (error: unknown) {
      const message =
        error instanceof AxiosError
          ? error.response?.data?.message ?? error.message
          : 'Intentá nuevamente.';
      toast({
        title: 'No se pudo crear el plan de estudio',
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
        <CardTitle>Alta de planes de estudio</CardTitle>
        <CardDescription>Definí planes asociados a una carrera y su año correspondiente.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="plan-nombre">Nombre</Label>
            <Input
              id="plan-nombre"
              value={formData.nombre}
              onChange={event => handleChange('nombre', event.target.value)}
              placeholder="Ej. Plan 2024"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan-descripcion">Descripción</Label>
            <textarea
              id="plan-descripcion"
              className="min-h-[90px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={formData.descripcion}
              onChange={event => handleChange('descripcion', event.target.value)}
              placeholder="Información complementaria del plan"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Carrera</Label>
              <Select value={formData.carreraId} onValueChange={value => handleChange('carreraId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccioná una carrera" />
                </SelectTrigger>
                <SelectContent>
                  {carreras.map(carrera => (
                    <SelectItem key={carrera.id} value={carrera.id.toString()}>
                      {carrera.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan-anio">Año</Label>
              <Input
                id="plan-anio"
                type="number"
                min={1900}
                placeholder="2025"
                value={formData.año}
                onChange={event => handleChange('año', event.target.value)}
              />
            </div>
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
                'Crear plan'
              )}
            </Button>
          </div>
        </form>

        <div>
          <p className="text-sm font-medium text-gray-900 mb-2">Planes registrados</p>
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            </div>
          ) : planes.length === 0 ? (
            <p className="text-sm text-gray-500">Todavía no hay planes de estudio cargados.</p>
          ) : (
            <ScrollArea className="max-h-[240px]">
              <div className="divide-y">
                {planes.map(plan => (
                  <div key={plan.id} className="py-3">
                    <p className="font-medium text-gray-900">
                      {plan.nombre} {plan.año ? `(${plan.año})` : ''}
                    </p>
                    <p className="text-sm text-gray-500">
                      {plan.carrera ? plan.carrera.nombre : 'Sin carrera asociada'}
                    </p>
                    {plan.descripcion && (
                      <p className="text-xs text-gray-500 mt-1">{plan.descripcion}</p>
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
