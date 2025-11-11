import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource, QueryRunner } from 'typeorm';
import { Logger } from '@nestjs/common';

// Logger
const logger = new Logger('MateriasSeed');

// Utility functions
const validateId = (id: any, name: string): number => {
  const numId = Number(id);
  if (isNaN(numId) || numId <= 0) {
    throw new Error(`ID de ${name} inválido: ${id}`);
  }
  return numId;
};

interface SeedResult {
  success: boolean;
  message: string;
  error?: any;
}

async function seedMateriasEspecificas(): Promise<SeedResult> {
  let app;
  let queryRunner;

  try {
    app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    logger.log('🚀 Iniciando creación de materias específicas...');

    // 1. Obtener referencias a entidades existentes
    logger.log('📋 Obteniendo referencias a entidades existentes...');

    // Obtener el estudiante de prueba
    const estudiante = await queryRunner.query(
      'SELECT id, email, legajo FROM "user" WHERE email = $1',
      ['estudiante@universidad.edu']
    );

    if (!estudiante || estudiante.length === 0) {
      throw new Error('No se encontró el estudiante de prueba. Ejecuta primero el seed general.');
    }

    const estudianteId = estudiante[0].id;
    logger.log(`✅ Estudiante encontrado: ${estudiante[0].email} (ID: ${estudianteId})`);

    // Obtener el plan de estudios del estudiante
    const planEstudio = await queryRunner.query(
      'SELECT pe.id, pe.nombre, c.nombre as carrera_nombre FROM "plan_estudio" pe INNER JOIN "carrera" c ON pe."carreraId" = c.id WHERE pe.id = (SELECT "planEstudioId" FROM "user" WHERE id = $1)',
      [estudianteId]
    );

    if (!planEstudio || planEstudio.length === 0) {
      throw new Error('No se encontró el plan de estudios del estudiante.');
    }

    const planEstudioId = planEstudio[0].id;
    logger.log(`✅ Plan de estudios encontrado: ${planEstudio[0].nombre} (${planEstudio[0].carrera_nombre})`);

    // Obtener departamentos
    const departamentoBasicas = await queryRunner.query(
      'SELECT id FROM "departamento" WHERE nombre = $1',
      ['Básicas']
    );

    const departamentoSistemas = await queryRunner.query(
      'SELECT id FROM "departamento" WHERE nombre = $1',
      ['Sistemas']
    );

    if (!departamentoBasicas || departamentoBasicas.length === 0) {
      throw new Error('No se encontró el departamento de Básicas');
    }

    if (!departamentoSistemas || departamentoSistemas.length === 0) {
      throw new Error('No se encontró el departamento de Sistemas');
    }

    const deptoBasicasId = departamentoBasicas[0].id;
    const deptoSistemasId = departamentoSistemas[0].id;

    logger.log(`✅ Departamentos encontrados: Básicas (ID: ${deptoBasicasId}), Sistemas (ID: ${deptoSistemasId})`);

    // 2. Crear materias específicas
    logger.log('📚 Creando materias específicas...');

    // Crear Física I en departamento de Básicas
    const materiaFisicaI = await crearMateriaConPlan(
      queryRunner,
      {
        nombre: 'Física I',
        descripcion: 'Introducción a los conceptos fundamentales de la física',
        departamentoId: deptoBasicasId,
        planEstudioId: planEstudioId,
        nivel: 1
      }
    );

    // Crear Algoritmos y Estructuras de Datos en departamento de Sistemas
    const materiaAlgoritmos = await crearMateriaConPlan(
      queryRunner,
      {
        nombre: 'Algoritmos y Estructuras de Datos',
        descripcion: 'Estudio de algoritmos y estructuras de datos fundamentales',
        departamentoId: deptoSistemasId,
        planEstudioId: planEstudioId,
        nivel: 2
      }
    );

    // 3. Crear profesor para estas materias
    logger.log('👨‍🏫 Creando profesor...');

    const profesor = await crearProfesor(queryRunner, {
      nombre: 'Roberto',
      apellido: 'Fernández',
      email: 'roberto.fernandez@universidad.edu',
      legajo: 'PROF002',
      dni: '25000002'
    });

    // 4. Crear comisiones para cada materia
    logger.log('📋 Creando comisiones...');

    const comisionFisica = await crearComision(queryRunner, {
      materiaId: materiaFisicaI.id,
      codigo: 'A',
      profesorId: profesor.id
    });

    const comisionAlgoritmos = await crearComision(queryRunner, {
      materiaId: materiaAlgoritmos.id,
      codigo: 'B',
      profesorId: profesor.id
    });

    // 5. Crear horarios para las comisiones
    logger.log('⏰ Creando horarios...');

    // Horarios para Física I (lunes y miércoles)
    await crearHorario(queryRunner, {
      comisionId: comisionFisica.id,
      dia: 'lunes',
      horaInicio: '10:00',
      horaFin: '12:00',
      aula: 'Aula 203',
      tipo: 'Teoría'
    });

    await crearHorario(queryRunner, {
      comisionId: comisionFisica.id,
      dia: 'miercoles',
      horaInicio: '10:00',
      horaFin: '12:00',
      aula: 'Aula 203',
      tipo: 'Teoría'
    });

    // Horarios para Algoritmos (martes y jueves)
    await crearHorario(queryRunner, {
      comisionId: comisionAlgoritmos.id,
      dia: 'martes',
      horaInicio: '14:00',
      horaFin: '16:00',
      aula: 'Lab 1',
      tipo: 'Práctica'
    });

    await crearHorario(queryRunner, {
      comisionId: comisionAlgoritmos.id,
      dia: 'jueves',
      horaInicio: '14:00',
      horaFin: '16:00',
      aula: 'Lab 1',
      tipo: 'Práctica'
    });

    // 6. Inscribir al estudiante en estas materias
    logger.log('📝 Inscribiendo estudiante en materias...');

    await inscribirEstudianteEnMateria(queryRunner, estudianteId, materiaFisicaI.id);
    await inscribirEstudianteEnMateria(queryRunner, estudianteId, materiaAlgoritmos.id);

    // Confirmar transacción
    await queryRunner.commitTransaction();

    logger.log('✅ ¡Materias específicas creadas exitosamente!');
    logger.log('\n📋 Resumen de creación:');
    logger.log(`   • Física I (Departamento: Básicas, Nivel: 1)`);
    logger.log(`   • Algoritmos y Estructuras de Datos (Departamento: Sistemas, Nivel: 2)`);
    logger.log(`   • Profesor: Roberto Fernández`);
    logger.log(`   • Estudiante inscripto: ${estudiante[0].email}`);
    logger.log(`\n📅 Horarios creados:`);
    logger.log(`   • Física I: Lunes y Miércoles 10:00-12:00 (Aula 203)`);
    logger.log(`   • Algoritmos: Martes y Jueves 14:00-16:00 (Lab 1)`);

    return {
      success: true,
      message: 'Materias específicas creadas exitosamente',
    };

  } catch (error) {
    if (queryRunner?.isTransactionActive) {
      await queryRunner.rollbackTransaction();
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('❌ Error durante la creación de materias específicas:', errorMessage);

    return {
      success: false,
      message: 'Error durante la creación de materias específicas',
      error: errorMessage,
    };

  } finally {
    // Liberar recursos
    try {
      if (queryRunner && !queryRunner.isReleased) {
        await queryRunner.release();
      }
      if (app) {
        await app.close();
      }
    } catch (closeError) {
      logger.error('Error al liberar recursos:', closeError instanceof Error ? closeError.message : String(closeError));
    }
  }
}

// Función auxiliar para crear materia con su relación al plan de estudio
async function crearMateriaConPlan(
  queryRunner: QueryRunner,
  data: {
    nombre: string;
    descripcion: string;
    departamentoId: number;
    planEstudioId: number;
    nivel: number;
  }
) {
  try {
    // Verificar si la materia ya existe en este plan
    const existing = await queryRunner.query(
      `SELECT m.id FROM "materia" m
       INNER JOIN "materia_planes_estudio" mpe ON m.id = mpe."materiaId"
       WHERE m.nombre = $1 AND mpe."planEstudioId" = $2`,
      [data.nombre, data.planEstudioId]
    );

    if (existing && existing.length > 0) {
      logger.log(`📚 Materia ya existe en el plan: ${data.nombre}`);
      return existing[0];
    }

    // Crear la materia
    const result = await queryRunner.query(
      `INSERT INTO "materia" (nombre, descripcion, "departamentoId")
       VALUES ($1, $2, $3)
       RETURNING id`,
      [data.nombre, data.descripcion, data.departamentoId]
    );

    const materiaId = (Array.isArray(result) ? result[0] : result).id;

    // Crear relación con el plan de estudios
    await queryRunner.query(
      `INSERT INTO "materia_planes_estudio" ("materiaId", "planEstudioId", nivel)
       VALUES ($1, $2, $3)`,
      [materiaId, data.planEstudioId, data.nivel]
    );

    logger.log(`✅ Materia creada: ${data.nombre} (Nivel ${data.nivel})`);
    return { id: materiaId };
  } catch (error) {
    logger.error(`❌ Error al crear materia ${data.nombre}: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

// Función auxiliar para crear profesor
async function crearProfesor(
  queryRunner: QueryRunner,
  data: {
    nombre: string;
    apellido: string;
    email: string;
    legajo: string;
    dni: string;
  }
) {
  try {
    // Verificar si el profesor ya existe
    const existing = await queryRunner.query(
      'SELECT id FROM "user" WHERE email = $1 OR legajo = $2',
      [data.email, data.legajo]
    );

    if (existing && existing.length > 0) {
      logger.log(`👨‍🏫 Profesor ya existe: ${data.email}`);
      return existing[0];
    }

    // Crear profesor
    const result = await queryRunner.query(
      `INSERT INTO "user" (nombre, apellido, email, legajo, dni, rol)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [data.nombre, data.apellido, data.email, data.legajo, data.dni, 'profesor']
    );

    const profesorId = (Array.isArray(result) ? result[0] : result).id;
    logger.log(`👨‍🏫 Profesor creado: ${data.nombre} ${data.apellido}`);
    return { id: profesorId };
  } catch (error) {
    logger.error(`❌ Error al crear profesor: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

// Función auxiliar para crear comisión
async function crearComision(
  queryRunner: QueryRunner,
  data: {
    materiaId: number;
    codigo: string;
    profesorId: number;
  }
) {
  try {
    // Verificar si la comisión ya existe
    const existing = await queryRunner.query(
      `SELECT id FROM "comision" WHERE nombre = $1 AND "materiaId" = $2`,
      [data.codigo, data.materiaId]
    );

    if (existing && existing.length > 0) {
      logger.log(`📋 Comisión ya existe: ${data.codigo}`);
      return existing[0];
    }

    // Crear comisión
    const result = await queryRunner.query(
      `INSERT INTO "comision" (nombre, "materiaId", "profesorId")
       VALUES ($1, $2, $3)
       RETURNING id`,
      [data.codigo, data.materiaId, data.profesorId]
    );

    const comisionId = (Array.isArray(result) ? result[0] : result).id;
    logger.log(`📋 Comisión creada: ${data.codigo} para materia ID ${data.materiaId}`);
    return { id: comisionId };
  } catch (error) {
    logger.error(`❌ Error al crear comisión: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

// Función auxiliar para crear horario
async function crearHorario(
  queryRunner: QueryRunner,
  data: {
    comisionId: number;
    dia: string;
    horaInicio: string;
    horaFin: string;
    aula: string;
    tipo: string;
  }
) {
  try {
    // Verificar si el horario ya existe
    const existing = await queryRunner.query(
      `SELECT id FROM "horario"
       WHERE "comisionId" = $1 AND dia = $2 AND "horaInicio" = $3 AND "horaFin" = $4`,
      [data.comisionId, data.dia.toLowerCase(), data.horaInicio, data.horaFin]
    );

    if (existing && existing.length > 0) {
      logger.log(`⏰ Horario ya existe para comisión ${data.comisionId} el día ${data.dia}`);
      return existing[0];
    }

    // Crear horario
    const result = await queryRunner.query(
      `INSERT INTO "horario" (dia, "horaInicio", "horaFin", aula, "comisionId")
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [data.dia.toLowerCase(), data.horaInicio, data.horaFin, data.aula, data.comisionId]
    );

    const horarioId = (Array.isArray(result) ? result[0] : result).id;
    logger.log(`⏰ Horario creado: ${data.dia} ${data.horaInicio}-${data.horaFin} (${data.aula})`);
    return { id: horarioId };
  } catch (error) {
    logger.error(`❌ Error al crear horario: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

// Función auxiliar para inscribir estudiante en materia
async function inscribirEstudianteEnMateria(
  queryRunner: QueryRunner,
  estudianteId: number,
  materiaId: number
) {
  try {
    // Verificar si ya está inscripto
    const existing = await queryRunner.query(
      `SELECT id FROM "inscripcion"
       WHERE "estudianteId" = $1 AND "materiaId" = $2`,
      [estudianteId, materiaId]
    );

    if (existing && existing.length > 0) {
      logger.log(`📝 Estudiante ya inscripto en materia ID ${materiaId}`);
      return existing[0];
    }

    // Crear inscripción
    const result = await queryRunner.query(
      `INSERT INTO "inscripcion" ("estudianteId", "materiaId", "fechaInscripcion")
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       RETURNING id`,
      [estudianteId, materiaId]
    );

    const inscripcionId = (Array.isArray(result) ? result[0] : result).id;
    logger.log(`📝 Inscripción creada: Estudiante ${estudianteId} en materia ${materiaId}`);
    return { id: inscripcionId };
  } catch (error) {
    logger.error(`❌ Error al inscribir estudiante en materia: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

// Ejecutar el seed
async function main() {
  logger.log('🚀 Iniciando proceso de creación de materias específicas...');

  try {
    const result = await seedMateriasEspecificas();
    if (result.success) {
      logger.log(`✅ ${result.message}`);
    } else {
      logger.error(`❌ ${result.message}`);
      if (result.error) {
        logger.error('Detalles del error:', result.error);
      }
      process.exit(1);
    }
  } catch (error) {
    logger.error('❌ Error inesperado durante la creación de materias:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('\n❌ Error fatal inesperado:', error);
    process.exit(1);
  });
}
