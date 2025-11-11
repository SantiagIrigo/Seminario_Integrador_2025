// src/scripts/seed-complete-data.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource, QueryRunner } from 'typeorm';
import { Logger } from '@nestjs/common';

const logger = new Logger('CompleteDataSeed');

interface SeedResult {
  success: boolean;
  message: string;
  error?: any;
}

async function seedCompleteData(): Promise<SeedResult> {
  let app;
  let queryRunner;

  try {
    app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    logger.log('🚀 Iniciando creación de datos completos de prueba...');

    // 1. Obtener referencias a entidades existentes
    logger.log('📋 Obteniendo referencias a entidades existentes...');

    const estudiante = await queryRunner.query(
      'SELECT id, email FROM "user" WHERE email = $1',
      ['estudiante@universidad.edu']
    );

    const profesor = await queryRunner.query(
      'SELECT id, email FROM "user" WHERE email = $1',
      ['profesor@universidad.edu']
    );

    const materias = await queryRunner.query(
      'SELECT id, nombre FROM "materia"'
    );

    const comisiones = await queryRunner.query(
      'SELECT id, nombre, "materiaId" FROM "comision"'
    );

    if (!estudiante || estudiante.length === 0) {
      throw new Error('No se encontró el estudiante. Ejecuta primero el seed básico.');
    }

    if (!profesor || profesor.length === 0) {
      throw new Error('No se encontró el profesor. Ejecuta primero el seed básico.');
    }

    if (materias.length === 0) {
      throw new Error('No se encontraron materias. Ejecuta primero el seed básico.');
    }

    if (comisiones.length === 0) {
      throw new Error('No se encontraron comisiones. Ejecuta primero el seed básico.');
    }

    const estudianteId = estudiante[0].id;
    const profesorId = profesor[0].id;

    logger.log(`✅ Estudiante: ${estudiante[0].email} (ID: ${estudianteId})`);
    logger.log(`✅ Profesor: ${profesor[0].email} (ID: ${profesorId})`);
    logger.log(`✅ Materias encontradas: ${materias.length}`);
    logger.log(`✅ Comisiones encontradas: ${comisiones.length}`);

    // 2. Crear clases para las comisiones existentes
    logger.log('📅 Creando clases...');

    for (const comision of comisiones) {
      // Crear una clase para cada comisión (ej: próxima semana)
      const fechaClase = new Date();
      fechaClase.setDate(fechaClase.getDate() + 7); // Próxima semana

      await queryRunner.query(
        `INSERT INTO "clase" ("comisionId", fecha, estado, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [comision.id, fechaClase.toISOString(), 'pendiente']
      );

      logger.log(`📅 Clase creada para comisión ${comision.nombre} el ${fechaClase.toISOString().split('T')[0]}`);
    }

    // 3. Crear evaluaciones para las inscripciones existentes
    logger.log('📝 Creando evaluaciones...');

    const inscripciones = await queryRunner.query(
      'SELECT id, "estudianteId", "materiaId" FROM "inscripcion"'
    );

    for (const inscripcion of inscripciones) {
      // Crear una evaluación parcial para cada inscripción
      await queryRunner.query(
        `INSERT INTO "evaluacion" ("inscripcionId", tipo, nota, titulo, "cargadoPorId", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [inscripcion.id, 'parcial', 7.5, 'Parcial 1', profesorId]
      );

      logger.log(`📝 Evaluación creada para inscripción ${inscripcion.id}`);
    }

    // 4. Crear asistencias para las clases existentes
    logger.log('✅ Creando asistencias...');

    const clases = await queryRunner.query(
      'SELECT id, "comisionId" FROM "clase"'
    );

    for (const clase of clases) {
      for (const inscripcion of inscripciones) {
        // Crear asistencia presente para cada estudiante en cada clase
        await queryRunner.query(
          `INSERT INTO "asistencia" ("claseId", "inscripcionId", estado, "createdAt", "updatedAt")
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [clase.id, inscripcion.id, 'presente']
        );
      }

      logger.log(`✅ Asistencias creadas para clase ${clase.id}`);
    }

    // Confirmar transacción
    await queryRunner.commitTransaction();

    logger.log('✅ ¡Datos completos de prueba creados exitosamente!');
    logger.log('\n📋 Resumen de creación:');
    logger.log(`   • Clases: ${clases.length}`);
    logger.log(`   • Evaluaciones: ${inscripciones.length}`);
    logger.log(`   • Asistencias: ${clases.length * inscripciones.length}`);

    return {
      success: true,
      message: 'Datos completos de prueba creados exitosamente',
    };

  } catch (error) {
    if (queryRunner?.isTransactionActive) {
      await queryRunner.rollbackTransaction();
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('❌ Error durante la creación de datos completos:', errorMessage);

    return {
      success: false,
      message: 'Error durante la creación de datos completos',
      error: errorMessage,
    };

  } finally {
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

// Ejecutar el seed
async function main() {
  logger.log('🚀 Iniciando proceso de creación de datos completos de prueba...');

  try {
    const result = await seedCompleteData();
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
    logger.error('❌ Error inesperado durante la creación de datos:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('\n❌ Error fatal inesperado:', error);
    process.exit(1);
  });
}
