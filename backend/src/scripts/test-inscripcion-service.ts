// src/scripts/test-inscripcion-service.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { InscripcionService } from '../inscripcion/inscripcion.service';
import { Logger } from '@nestjs/common';

const logger = new Logger('TestInscripcionService');

async function testInscripcionService() {
  let app;

  try {
    app = await NestFactory.createApplicationContext(AppModule);
    const inscripcionService = app.get(InscripcionService);

    logger.log('🧪 Probando servicio de inscripciones directamente...');

    // Probar método simple primero
    logger.log('🔍 Probando materiasDisponibles...');

    try {
      const estudianteId = 3; // ID del estudiante de prueba
      const result = await inscripcionService.materiasDisponibles(estudianteId);
      logger.log(`✅ materiasDisponibles ejecutado correctamente: ${result.length} materias`);

      return {
        success: true,
        materiasDisponibles: result.length,
        materias: result,
      };

    } catch (error) {
      logger.error('❌ Error en materiasDisponibles:', error instanceof Error ? error.message : String(error));
      logger.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }

  } catch (error) {
    logger.error('❌ Error al inicializar la aplicación:', error instanceof Error ? error.message : String(error));

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
    const result = await testInscripcionService();
    console.log('\n📊 Resultado del test del servicio:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('\n❌ Error fatal:', error);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
