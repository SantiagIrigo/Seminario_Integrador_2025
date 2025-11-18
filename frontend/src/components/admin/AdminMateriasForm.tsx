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
import { Loader2, PlusCircle, RefreshCcw, Trash2 } from 'lucide-react';
import { AxiosError } from 'axios';
import AdminService, {
  CreateMateriaPayload,
  Departamento,
  MateriaAdmin,
  PlanEstudioOption,
} from '@/services/admin.service';

interface PlanEntry {
  planEstudioId: string;
  nivel: string;
}

const emptyPlan: PlanEntry = { planEstudioId: '', nivel: '' };

export function AdminMateriasForm() {
  const { toast } = useToast();
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [planes, setPlanes] = useState<PlanEstudioOption[]>([]);
  const [materiasRecientes, setMateriasRecientes] = useState<MateriaAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    departamentoId: '',
  });
  const [planEntries, setPlanEntries] = useState<PlanEntry[]>([emptyPlan]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [deps, plans, materias] = await Promise.all([
          AdminService.getDepartamentos(),
          AdminService.getPlanesEstudio(),
          AdminService.getMaterias(1, 5),
        ]);
        setDepartamentos(deps);
        setPlanes(plans);
        setMateriasRecientes(materias.items);
      } catch (error) {
        console.error('Error al cargar catálogos', error);
        toast({
          title: 'Error',
          description: 'No pudimos cargar los catálogos requeridos.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePlanChange = (index: number, field: keyof PlanEntry, value: string) => {
    setPlanEntries(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addPlanEntry = () => setPlanEntries(prev => [...prev, emptyPlan]);
  const removePlanEntry = (index: number) => setPlanEntries(prev => prev.filter((_, idx) => idx !== index));

  const resetForm = () => {
    setFormData({ nombre: '', descripcion: '', departamentoId: '' });
    setPlanEntries([emptyPlan]);
  };

  const planesSeleccionados = useMemo(
    () =>
      planEntries
        .filter(entry => entry.planEstudioId && entry.nivel)
        .map(entry => ({
          planEstudioId: Number(entry.planEstudioId),
          nivel: Number(entry.nivel),
        })),
    [planEntries],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.nombre.trim() || !formData.departamentoId) {
      toast({
        title: 'Datos incompletos',
        description: 'Ingresá al menos el nombre y el departamento.',
        variant: 'destructive',
      });
      return;
    }

    const payload: CreateMateriaPayload = {
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion.trim() || undefined,
      departamentoId: Number(formData.departamentoId),
      planesEstudioConNivel: planesSeleccionados.length ? planesSeleccionados : undefined,
    };

    try {
      setSubmitting(true);
      const materia = await AdminService.createMateria(payload);
      toast({
        title: 'Materia creada',
        description: `${materia.nombre} se agregó correctamente.`,
      });
      resetForm();
      setMateriasRecientes(prev => [materia, ...prev].slice(0, 5));
    } catch (error: unknown) {
      const message =
        error instanceof AxiosError
          ? error.response?.data?.message ?? error.message
          : 'Intentá nuevamente.';
      console.error('Error al crear materia', error);
      toast({
        title: 'No se pudo crear la materia',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const recargarMaterias = async () => {
    try {
      setReloading(true);
      const materias = await AdminService.getMaterias(1, 5);
      setMateriasRecientes(materias.items);
    } catch (error) {
      console.error('Error al recargar materias', error);
      toast({
        title: 'Error',
        description: 'No pudimos actualizar la lista de materias.',
        variant: 'destructive',
      });
    } finally {
      setReloading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Alta de materias</CardTitle>
          <CardDescription>Registrá nuevas materias y vinculalas a planes de estudio.</CardDescription>
        </div>
        <Button variant="ghost" className="gap-2" size="sm" onClick={recargarMaterias} disabled={reloading}>
          <RefreshCcw className={`h-4 w-4 ${reloading ? 'animate-spin' : ''}`} />
          Actualizar lista
        </Button>
      </CardHeader>
      <CardContent className="space-y-8">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  placeholder="Ej. Matemática I"
                  value={formData.nombre}
                  onChange={event => handleInputChange('nombre', event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="departamento">Departamento</Label>
                <Select
                  value={formData.departamentoId}
                  onValueChange={value => handleInputChange('departamentoId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccioná un departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {departamentos.map(departamento => (
                      <SelectItem key={departamento.id} value={departamento.id.toString()}>
                        {departamento.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <textarea
                id="descripcion"
                className="min-h-[90px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Información breve sobre la materia"
                value={formData.descripcion}
                onChange={event => handleInputChange('descripcion', event.target.value)}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Planes asociados</Label>
                  <p className="text-sm text-gray-500">Definí en qué plan y nivel aparece la materia.</p>
                </div>
                <Button type="button" variant="outline" size="sm" className="gap-2" onClick={addPlanEntry}>
                  <PlusCircle className="h-4 w-4" />
                  Agregar plan
                </Button>
              </div>

              {planEntries.map((entry, index) => (
                <div key={`plan-${index}`} className="grid gap-3 md:grid-cols-[2fr,1fr,auto] items-end">
                  <div className="space-y-2">
                    <Label>Plan de estudio</Label>
                    <Select
                      value={entry.planEstudioId}
                      onValueChange={value => handlePlanChange(index, 'planEstudioId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccioná un plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {planes.map(plan => (
                          <SelectItem key={plan.id} value={plan.id.toString()}>
                            {plan.nombre} {plan.carrera ? `- ${plan.carrera.nombre}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Nivel</Label>
                    <Input
                      type="number"
                      min={1}
                      placeholder="N° de nivel"
                      value={entry.nivel}
                      onChange={event => handlePlanChange(index, 'nivel', event.target.value)}
                    />
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => removePlanEntry(index)}
                    disabled={planEntries.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={resetForm} disabled={submitting}>
                Limpiar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Crear materia'
                )}
              </Button>
            </div>
          </form>
        )}

        <div>
          <p className="text-sm font-medium text-gray-900 mb-2">Últimas materias registradas</p>
          {materiasRecientes.length === 0 ? (
            <p className="text-sm text-gray-500">Todavía no hay materias cargadas.</p>
          ) : (
            <ScrollArea className="max-h-[260px]">
              <div className="divide-y">
                {materiasRecientes.map(materia => (
                  <div key={materia.id} className="py-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{materia.nombre}</p>
                      {materia.descripcion && (
                        <p className="text-sm text-gray-500 line-clamp-2">{materia.descripcion}</p>
                      )}
                    </div>
                    {materia.departamento?.nombre && (
                      <Badge variant="secondary" className="w-fit">
                        {materia.departamento.nombre}
                      </Badge>
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
