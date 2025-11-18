'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import AdminService, { Carrera, CreateCarreraPayload } from '@/services/admin.service';
import { AxiosError } from 'axios';

const emptyForm: CreateCarreraPayload = {
  nombre: '',
  descripcion: '',
};

export function AdminCarrerasForm() {
  const { toast } = useToast();
  const [formData, setFormData] = useState(emptyForm);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadCarreras = async () => {
      try {
        setLoading(true);
        const data = await AdminService.getCarreras();
        setCarreras(data);
      } catch (error) {
        console.error('Error al cargar carreras', error);
        toast({
          title: 'No se pudieron obtener las carreras',
          description: 'Intentá nuevamente más tarde.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadCarreras();
  }, [toast]);

  const handleChange = (field: keyof CreateCarreraPayload, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.nombre.trim()) {
      toast({
        title: 'Nombre requerido',
        description: 'Ingresá un nombre para la carrera.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      const carrera = await AdminService.createCarrera({
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion?.trim() || undefined,
      });
      toast({
        title: 'Carrera creada',
        description: `${carrera.nombre} se registró correctamente.`,
      });
      setCarreras(prev => [carrera, ...prev]);
      setFormData(emptyForm);
    } catch (error: unknown) {
      const message =
        error instanceof AxiosError
          ? error.response?.data?.message ?? error.message
          : 'Intentá nuevamente.';
      toast({
        title: 'No se pudo crear la carrera',
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
        <CardTitle>Alta de carreras</CardTitle>
        <CardDescription>Registrá nuevas carreras para asociarlas con planes de estudio.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="carrera-nombre">Nombre</Label>
            <Input
              id="carrera-nombre"
              value={formData.nombre}
              onChange={event => handleChange('nombre', event.target.value)}
              placeholder="Ej. Ingeniería en Sistemas"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="carrera-descripcion">Descripción</Label>
            <textarea
              id="carrera-descripcion"
              className="min-h-[90px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={formData.descripcion}
              onChange={event => handleChange('descripcion', event.target.value)}
              placeholder="Información adicional de la carrera"
            />
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
                'Crear carrera'
              )}
            </Button>
          </div>
        </form>

        <div>
          <p className="text-sm font-medium text-gray-900 mb-2">Carreras registradas</p>
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            </div>
          ) : carreras.length === 0 ? (
            <p className="text-sm text-gray-500">Todavía no hay carreras cargadas.</p>
          ) : (
            <ScrollArea className="max-h-[240px]">
              <div className="divide-y">
                {carreras.map(carrera => (
                  <div key={carrera.id} className="py-3">
                    <p className="font-medium text-gray-900">{carrera.nombre}</p>
                    {carrera.descripcion && (
                      <p className="text-sm text-gray-500">{carrera.descripcion}</p>
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
