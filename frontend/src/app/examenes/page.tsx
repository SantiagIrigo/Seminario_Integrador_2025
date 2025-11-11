import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExamenFinalList } from '@/components/examenes/ExamenFinalList';
import { MisInscripcionesExamenes } from '@/components/examenes/MisInscripcionesExamenes';

export default function ExamenesPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Exámenes Finales</h1>
        <p className="text-gray-600">
          Gestiona tus inscripciones a exámenes finales
        </p>
      </div>

      <Tabs defaultValue="disponibles" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="disponibles">Exámenes Disponibles</TabsTrigger>
          <TabsTrigger value="mis-inscripciones">Mis Inscripciones</TabsTrigger>
        </TabsList>
        
        <TabsContent value="disponibles" className="mt-6">
          <ExamenFinalList />
        </TabsContent>
        
        <TabsContent value="mis-inscripciones" className="mt-6">
          <MisInscripcionesExamenes />
        </TabsContent>
      </Tabs>
    </div>
  );
}
