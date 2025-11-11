// src/examen/examen.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ExamenFinal } from './entities/examen.entity';
import { Materia } from '../materia/entities/materia.entity';
import { User } from '../user/entities/user.entity';
import { Inscripcion } from '../inscripcion/entities/inscripcion.entity';

// ✅ Definimos un tipo explícito para las correlativas faltantes
interface CorrelativaFaltante {
  id: number;
  nombre: string;
}

@Injectable()
export class ExamenService {
  constructor(
    @InjectRepository(ExamenFinal)
    private examenRepo,
    @InjectRepository(Materia)
    private materiaRepo,
    @InjectRepository(User)
    private userRepo,
    @InjectRepository(Inscripcion)
    private inscripcionRepo,
  ) {}

  // Verificar si el estudiante cumple con las correlativas para rendir el final
  private async verificarCorrelativasFinal(
    estudianteId: number,
    materiaId: number,
  ): Promise<{ 
    cumple: boolean; 
    faltantes: CorrelativaFaltante[] // ✅ Cambiado a no opcional
  }> {
    const estudiante = await this.userRepo.findOne({ where: { id: estudianteId } });
    const materia = await this.materiaRepo.findOne({
      where: { id: materiaId },
      relations: ['correlativasFinal'],
    });

    if (!estudiante || !materia) {
      throw new BadRequestException('Estudiante o materia no encontrados');
    }

    if (!materia.correlativasFinal || materia.correlativasFinal.length === 0) {
      // ✅ Siempre retornamos un array de faltantes (vacío si no hay)
      return { cumple: true, faltantes: [] };
    }

    // ✅ Definimos explícitamente el tipo del array
    const faltantes: CorrelativaFaltante[] = [];
    
    for (const correlativa of materia.correlativasFinal) {
      const inscripcion = await this.inscripcionRepo.findOne({
        where: {
          estudiante: { id: estudianteId },
          materia: { id: correlativa.id },
        },
      });

      // Para rendir final, la correlativa debe estar aprobada
      const estadoValido = inscripcion && inscripcion.stc === 'aprobada';
      
      if (!estadoValido) {
        // ✅ TypeScript ahora sabe que faltantes es CorrelativaFaltante[]
        faltantes.push({ id: correlativa.id, nombre: correlativa.nombre });
      }
    }

    return {
      cumple: faltantes.length === 0,
      faltantes, // ✅ Siempre es un array
    };
  }

  // Inscribirse a un examen final
  async inscribirse(userId: number, materiaId: number): Promise<ExamenFinal> {
    const estudiante = await this.userRepo.findOne({ where: { id: userId } });
    const materia = await this.materiaRepo.findOne({ where: { id: materiaId } });

    if (!estudiante || !materia) {
      throw new BadRequestException('Estudiante o materia no encontrados');
    }

    // Evitar inscripciones duplicadas
    const yaInscripto = await this.examenRepo.findOne({
      where: { estudiante: { id: estudiante.id }, materia: { id: materia.id } },
    });
    if (yaInscripto) {
      throw new BadRequestException('Ya estás inscripto al examen final de esta materia');
    }

    // Validar correlativas
    const { cumple, faltantes } = await this.verificarCorrelativasFinal(userId, materiaId);
    if (!cumple) {
      // ✅ Ahora TypeScript sabe que faltantes siempre está definido
      const materiasFaltantes = faltantes.map(m => m.nombre).join(', ');
      throw new BadRequestException(
        `No puedes rendir el final de esta materia. Faltan correlativas: ${materiasFaltantes}`
      );
    }

    const examen = this.examenRepo.create({ estudiante, materia, estado: 'inscripto' });
    return this.examenRepo.save(examen);
  }

  // Verificar si un usuario es el jefe de cátedra del examen
  async esJefeDeCatedra(userId: number, examenId: number): Promise<boolean> {
    const examen = await this.examenRepo.findOne({
      where: { id: examenId },
      relations: ['materia', 'materia.jefeCatedra'],
    });

    if (!examen) return false;

    return examen.materia.jefeCatedra?.id === userId;
  }

  // Cargar nota del examen (solo jefe de cátedra)
  async cargarNota(examenId: number, nota: number, estado: string): Promise<ExamenFinal> {
    const examen = await this.examenRepo.findOne({
      where: { id: examenId },
      relations: ['materia', 'materia.jefeCatedra', 'estudiante'],
    });

    if (!examen) {
      throw new BadRequestException('Examen no encontrado');
    }

    // Validar rango de nota
    if (nota < 0 || nota > 10) {
      throw new BadRequestException('La nota debe estar entre 0 y 10');
    }

    examen.nota = nota;
    examen.estado = estado;
    return this.examenRepo.save(examen);
  }

  // Ver exámenes del estudiante
  async verExamenes(userId: number): Promise<ExamenFinal[]> {
    return this.examenRepo.find({
      where: { estudiante: { id: userId } },
      relations: ['materia'],
      order: { id: 'DESC' },
    });
  }
}