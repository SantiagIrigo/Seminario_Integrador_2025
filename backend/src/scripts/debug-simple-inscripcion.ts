// src/scripts/debug-simple-inscripcion.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';

const logger = new Logger('DebugSimpleInscripcion');

async function debugSimpleInscripcion() {
  let app;

  try {
    app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);

    logger.log('🔍 Debug simple del servicio de inscripciones...');

    // Paso 1: Verificar estudiante básico
    const estudiante = await dataSource.query(
      'SELECT id, email, planEstudioId FROM "user" WHERE email = $1',
      ['estudiante@universidad.edu']
    );

    if (!estudiante || estudiante.length === 0) {
      throw new Error('No se encontró el estudiante');
    }

    logger.log(`✅ Estudiante: ${JSON.stringify(estudiante[0])}`);

    // Paso 2: Verificar plan de estudios básico
    if (!estudiante[0].planEstudioId) {
      throw new Error('Estudiante no tiene planEstudioId');
    }

    const planEstudio = await dataSource.query(
      'SELECT id, nombre FROM plan_estudio WHERE id = $1',
      [estudiante[0].planEstudioId]
    );

    if (!planEstudio || planEstudio.length === 0) {
      throw new Error('No se encontró el plan de estudios');
    }

    logger.log(`✅ Plan: ${JSON.stringify(planEstudio[0])}`);

    // Paso 3: Verificar materias del plan usando consulta directa
    const materiasPlan = await dataSource.query(`
      SELECT m.id, m.nombre, mpe.nivel
      FROM materia m
      INNER JOIN materia_planes_estudio mpe ON m.id = mpe.materiaId
      WHERE mpe.planEstudioId = $1
    `, [estudiante[0].planEstudioId]);

    logger.log(`✅ Materias del plan: ${materiasPlan.length}`);

    // Paso 4: Verificar inscripciones actuales
    const inscripciones = await dataSource.query(`
      SELECT i.id, i.materiaId, i.stc, m.nombre as materia_nombre
      FROM inscripcion i
      INNER JOIN materia m ON i.materiaId = m.id
      WHERE i.estudianteId = $1
    `, [estudiante[0].id]);

    logger.log(`✅ Inscripciones actuales: ${inscripciones.length}`);

    logger.log('✅ Debug simple completado exitosamente');

    return {
      success: true,
      estudiante: estudiante[0],
      planEstudio: planEstudio[0],
      materiasPlan: materiasPlan,
      inscripciones: inscripciones,
    };

  } catch (error) {
    logger.error('❌ Error durante el debug simple:', error instanceof Error ? error.message : String(error));

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };

  } finally {
    if (app) {
      await app.close();
    }
  }
}

async function main() {
  try {
    const result = await debugSimpleInscripcion();
    console.log('\n📊 Resultado del debug simple:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('\n❌ Error fatal:', error);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
