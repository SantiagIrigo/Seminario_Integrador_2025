// src/scripts/debug-inscripcion.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';

const logger = new Logger('DebugInscripcion');

async function debugInscripcion() {
  let app;

  try {
    app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);

    logger.log('🔍 Iniciando debug del módulo de inscripciones...');

    // 1. Verificar datos básicos
    logger.log('📋 Verificando datos básicos...');

    const estudiante = await dataSource.query(
      'SELECT id, email, planEstudioId FROM "user" WHERE email = $1',
      ['estudiante@universidad.edu']
    );

    if (!estudiante || estudiante.length === 0) {
      throw new Error('No se encontró el estudiante');
    }

    logger.log(`✅ Estudiante encontrado: ${JSON.stringify(estudiante[0])}`);

    if (!estudiante[0].planEstudioId) {
      throw new Error('El estudiante no tiene planEstudioId asignado');
    }

    // 2. Verificar plan de estudios
    const planEstudio = await dataSource.query(
      'SELECT id, nombre FROM plan_estudio WHERE id = $1',
      [estudiante[0].planEstudioId]
    );

    if (!planEstudio || planEstudio.length === 0) {
      throw new Error('No se encontró el plan de estudios del estudiante');
    }

    logger.log(`✅ Plan de estudios encontrado: ${JSON.stringify(planEstudio[0])}`);

    // 3. Verificar materias del plan
    const materiasPlan = await dataSource.query(`
      SELECT m.id, m.nombre, mpe.nivel
      FROM materia m
      INNER JOIN materia_planes_estudio mpe ON m.id = mpe.materiaId
      WHERE mpe.planEstudioId = $1
    `, [estudiante[0].planEstudioId]);

    logger.log(`✅ Materias del plan encontradas: ${materiasPlan.length}`);

    // 4. Verificar materias que el estudiante está cursando
    const materiasCursando = await dataSource.query(`
      SELECT i.materiaId, m.nombre
      FROM inscripcion i
      INNER JOIN materia m ON i.materiaId = m.id
      WHERE i.estudianteId = $1 AND i.stc = 'cursando'
    `, [estudiante[0].id]);

    logger.log(`✅ Materias cursando encontradas: ${materiasCursando.length}`);

    // 5. Simular lógica del servicio
    logger.log('🧠 Simulando lógica del servicio...');

    const materiasCursandoIds = materiasCursando.map(i => i.materiaId);
    const materiasDisponibles = materiasPlan.filter(materia =>
      !materiasCursandoIds.includes(materia.id)
    );

    logger.log(`✅ Materias disponibles calculadas: ${materiasDisponibles.length}`);

    logger.log('✅ Debug completado exitosamente');

    return {
      success: true,
      estudiante: estudiante[0],
      planEstudio: planEstudio[0],
      materiasPlan: materiasPlan.length,
      materiasCursando: materiasCursando.length,
      materiasDisponibles: materiasDisponibles.length,
    };

  } catch (error) {
    logger.error('❌ Error durante el debug:', error instanceof Error ? error.message : String(error));

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
    const result = await debugInscripcion();
    console.log('\n📊 Resultado del debug:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('\n❌ Error fatal:', error);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
