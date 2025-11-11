import { DataSource } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { Inscripcion } from '../inscripcion/entities/inscripcion.entity';
import { Materia } from '../materia/entities/materia.entity';
import { Comision } from '../comision/entities/comision.entity';
import { PlanEstudio } from '../plan-estudio/entities/plan-estudio.entity';
import { Carrera } from '../carrera/entities/carrera.entity';
import { Departamento } from '../departamento/entities/departamento.entity';
import { Evaluacion } from '../evaluacion/entities/evaluacion.entity';
import { ExamenFinal } from '../examen/entities/examen.entity';
import { Horario } from '../horario/entities/horario.entity';
import { Clase } from '../clase/entities/clase.entity';
import { Asistencia } from '../asistencia/entities/asistencia.entity';
import { InscripcionExamen } from '../inscripcion-examen/entities/inscripcion-examen.entity';
import { EstadoAcademico } from '../estado-academico/entities/estado-academico.entity';
import { CorrelativasCursada } from '../correlativas/entities/correlativas-cursada.entity';
import { CorrelativasFinal } from '../correlativas/entities/correlativas-final.entity';

async function checkEntities() {
  console.log('🔍 Verificando entidades y relaciones...\n');

  const dataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5433,
    username: 'postgres',
    password: 'testpass',
    database: 'autogestion',
    entities: [
      User,
      Inscripcion,
      Materia,
      Comision,
      PlanEstudio,
      Carrera,
      Departamento,
      Evaluacion,
      ExamenFinal,
      Horario,
      Clase,
      Asistencia,
      InscripcionExamen,
      EstadoAcademico,
      CorrelativasCursada,
      CorrelativasFinal,
    ],
    synchronize: false,
    logging: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Conexión a la base de datos exitosa');
    
    const metadata = dataSource.entityMetadatas;
    
    console.log('\n📋 Entidades encontradas:');
    metadata.forEach(entity => {
      console.log(`  - ${entity.name}`);
    });

    console.log('\n🔗 Verificando relaciones de Inscripcion:');
    const inscripcionMeta = metadata.find(m => m.name === 'Inscripcion');
    if (inscripcionMeta) {
      inscripcionMeta.relations.forEach(relation => {
        console.log(`  - ${relation.propertyName} -> ${relation.type}`);
      });
    }

    console.log('\n🔗 Verificando relaciones de User:');
    const userMeta = metadata.find(m => m.name === 'User');
    if (userMeta) {
      userMeta.relations.forEach(relation => {
        console.log(`  - ${relation.propertyName} -> ${relation.type}`);
      });
    }

    await dataSource.destroy();
    console.log('\n✅ Verificación completada exitosamente');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

checkEntities();
