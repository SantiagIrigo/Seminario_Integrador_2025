import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Logger } from '@nestjs/common';

// Logger
const logger = new Logger('DatabaseSeed');

// Utility functions
const validateId = (id: any, name: string): number => {
  const numId = Number(id);
  if (isNaN(numId) || numId <= 0) {
    throw new Error(`ID de ${name} inválido: ${id}`);
  }
  return numId;
};

const validateEmail = (email: string): void => {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error(`Email inválido: ${email}`);
  }
};

const validateDni = (dni: string): void => {
  if (!/^\d{7,8}$/.test(dni)) {
    throw new Error(`DNI inválido: ${dni}. Debe contener 7 u 8 dígitos.`);
  }
};

const validateLegajo = (legajo: string, prefix: string): void => {
  if (!new RegExp(`^${prefix}\\d{3}$`).test(legajo)) {
    throw new Error(`Legajo inválido: ${legajo}. Debe tener el formato ${prefix}NNN (ej: ${prefix}001).`);
  }
};

const validateDiaSemana = (dia: string): void => {
  const diasValidos = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sábado'];
  if (!diasValidos.includes(dia.toLowerCase())) {
    throw new Error(`Día de la semana inválido: ${dia}. Debe ser uno de: ${diasValidos.join(', ')}`);
  }
};

const validateTimeFormat = (time: string): void => {
  if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
    throw new Error(`Formato de hora inválido: ${time}. Debe ser HH:MM en formato 24h.`);
  }
};

interface SeedUser {
  nombre: string;
  apellido: string;
  email: string;
  legajo: string;
  dni: string;
  rol: 'admin' | 'profesor' | 'estudiante' | 'secretaria_academica';
}

interface SeedResult {
  success: boolean;
  message: string;
  error?: any;
}

async function seed(): Promise<SeedResult> {
  let app;
  let queryRunner;
  
  try {
    app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // Datos de ejemplo
    const defaultPassword = 'password123';
    const usuariosMock: SeedUser[] = [
      {
        nombre: 'Admin',
        apellido: 'Sistema',
        email: 'admin@universidad.edu',
        legajo: 'ADM001',
        dni: '10000001',
        rol: 'admin',
      },
      {
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'profesor@universidad.edu',
        legajo: 'PROF001',
        dni: '20000001',
        rol: 'profesor',
      },
      {
        nombre: 'María',
        apellido: 'González',
        email: 'estudiante@universidad.edu',
        legajo: 'EST001',
        dni: '30000001',
        rol: 'estudiante',
      },
      {
        nombre: 'Soledad',
        apellido: 'Martínez',
        email: 'secretaria@universidad.edu',
        legajo: 'SEC001',
        dni: '40000001',
        rol: 'secretaria_academica',
      },
    ];

    // Crear usuarios base
    logger.log('Creando usuarios base...');
    interface UsuarioCreado {
      id: number;
      legajo: string;
      email: string;
      rol: 'admin' | 'profesor' | 'estudiante' | 'secretaria_academica';
    }
    const usuariosCreados: UsuarioCreado[] = [];
    
    for (const usuario of usuariosMock) {
      try {
        logger.log(`Procesando usuario: ${usuario.email} (${usuario.rol})`);
        const created = await ensureUser(queryRunner, usuario, defaultPassword);
        usuariosCreados.push({ 
          id: created.id, 
          legajo: usuario.legajo, 
          email: usuario.email,
          rol: usuario.rol 
        });
      } catch (error) {
        logger.error(`Error al crear usuario ${usuario.email}: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
      }
    }

    // Obtener referencias a usuarios importantes
    const users = {
      admin: usuariosCreados.find((u) => u.rol === 'admin'),
      profesor: usuariosCreados.find((u) => u.rol === 'profesor'),
      estudiante: usuariosCreados.find((u) => u.rol === 'estudiante'),
      secretaria: usuariosCreados.find((u) => u.rol === 'secretaria_academica')
    } as const;

    // Verificar usuarios requeridos
    if (!users.profesor || !users.estudiante) {
      throw new Error('No se pudieron crear los usuarios requeridos (profesor y estudiante)');
    }

    // Crear departamentos
    logger.log('Creando departamentos...');
    interface Departamento {
      id: number;
      nombre: string;
      descripcion: string;
    }
    
    const departamentos: Array<{nombre: string, descripcion: string}> = [
      { nombre: 'Básicas', descripcion: 'Departamento de materias básicas' },
      { nombre: 'Sistemas', descripcion: 'Departamento de sistemas y programación' },
      { nombre: 'Gestión', descripcion: 'Departamento de gestión y administración' },
    ];
    
    const departamentosCreados: Departamento[] = [];
    for (const depto of departamentos) {
      try {
        const creado = await ensureDepartamento(queryRunner, depto.nombre, depto.descripcion);
        if (creado && typeof creado === 'object' && 'id' in creado) {
          departamentosCreados.push({
            id: Number(creado.id),
            nombre: depto.nombre,
            descripcion: depto.descripcion
          });
        } else {
          throw new Error(`No se pudo crear el departamento ${depto.nombre}`);
        }
      } catch (error: any) {
        logger.error(`Error al crear departamento ${depto.nombre}: ${error.message}`);
        throw error;
      }
    }
    
    const departamentoBasicas = departamentosCreados.find(d => d.nombre === 'Básicas');
    if (!departamentoBasicas) {
      throw new Error('No se pudo obtener el departamento de Básicas');
    }

    // Crear carrera y plan de estudios
    logger.log('Creando carrera y plan de estudios...');
    let carrera, plan;
    
    try {
      carrera = await ensureCarrera(queryRunner, 'Ingeniería en Sistemas', 'Carrera de Ingeniería en Sistemas');
      plan = await ensurePlanEstudio(queryRunner, 'Plan 2025', 'Plan de estudios 2025', 2025, carrera.id);
    } catch (error: any) {
      logger.error(`Error al crear carrera o plan de estudios: ${error.message}`);
      throw error;
    }

    // Crear materia de ejemplo
    logger.log('Creando materia de ejemplo...');
    let materia;
    
    try {
      if (!departamentoBasicas) {
        throw new Error('No se pudo encontrar el departamento de Básicas');
      }
      
      materia = await ensureMateriaAnalisis(queryRunner, plan.id, departamentoBasicas.id);
      logger.log(`Materia creada: ${materia.nombre}`);
      
      // Verificar que el profesor existe
      if (!users.profesor) {
        throw new Error('No se encontró el usuario profesor');
      }
      
      // Crear comisión
      const comision = await ensureComision(queryRunner, {
        materiaId: materia.id,
        codigo: 'A',
        fechaInicio: '2025-03-01',
        fechaFin: '2025-07-15',
        profesorId: users.profesor.id
      });
      
      logger.log(`Comisión creada: ${comision.codigo}`);
      
      // Crear horarios para la comisión
      await ensureHorario(queryRunner, {
        comisionId: comision.id,
        dia: 'lunes',
        horaInicio: '08:00',
        horaFin: '12:00',
        aula: 'Aula 101',
        tipo: 'Teoría'
      });
      
      await ensureHorario(queryRunner, {
        comisionId: comision.id,
        dia: 'miercoles',
        horaInicio: '08:00',
        horaFin: '12:00',
        aula: 'Aula 101',
        tipo: 'Teoría'
      });

      // Asignar plan de estudios al estudiante
      logger.log('Asignando plan de estudios al estudiante...');
      const updateResult = await queryRunner.query(
        'UPDATE "user" SET "planEstudioId" = $1 WHERE email = $2 RETURNING id',
        [plan.id, 'estudiante@universidad.edu']
      );

      if (!updateResult || updateResult.length === 0) {
        throw new Error('No se pudo asignar el plan de estudios al estudiante. Verifica que el email exista.');
      }

      logger.log(`Plan de estudios asignado al estudiante: ${plan.nombre}`);

      // Confirmar transacción
      await queryRunner.commitTransaction();
      
      // Mostrar resumen de credenciales
      console.log('\nCredenciales de ejemplo:');
      usuariosCreados.forEach(u => {
        console.log(`${u.rol.padEnd(20)}: ${u.email.padEnd(30)} / ${defaultPassword}`);
      });
      
      return {
        success: true,
        message: 'Seed completado exitosamente',
      };
      
    } catch (error) {
      if (queryRunner?.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error al crear la materia o comisiones:', errorMessage);
      
      return {
        success: false,
        message: 'Error durante la ejecución del seed',
        error: errorMessage,
      };
    }
    
  } catch (error) {
    if (queryRunner?.isTransactionActive) {
      await queryRunner.rollbackTransaction();
    }
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('\nError durante el seed:', errorMessage);
    
    return {
      success: false,
      message: 'Error durante la ejecución del seed',
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

// Función auxiliar corregida para crear usuarios
const ensureUser = async (queryRunner: QueryRunner, user: SeedUser, password: string) => {
  try {
    // Validaciones
    validateEmail(user.email);
    validateDni(user.dni);
    
    const rolePrefix = {
      admin: 'ADM',
      profesor: 'PROF',
      estudiante: 'EST',
      secretaria_academica: 'SEC'
    };
    
    validateLegajo(user.legajo, rolePrefix[user.rol]);
    
    // Verificar si el usuario ya existe
    const existing = await queryRunner.query(
      'SELECT id FROM "user" WHERE email = $1 OR legajo = $2',
      [user.email, user.legajo],
    );

    if (existing && existing.length > 0) {
      logger.log(`Usuario ya existe: ${user.email}`);
      return existing[0];
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const result = await queryRunner.query(
      `INSERT INTO "user" (nombre, apellido, email, password, legajo, dni, rol)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [user.nombre, user.apellido, user.email, hashedPassword, user.legajo, user.dni, user.rol],
    );
    
    const created = Array.isArray(result) ? result[0] : result;
    logger.log(`Usuario creado: ${user.email} (${user.rol})`);
    return created;
  } catch (error) {
    logger.error(`Error al crear usuario ${user.email}: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

// Función auxiliar corregida para crear departamentos
const ensureDepartamento = async (queryRunner: QueryRunner, nombre: string, descripcion: string) => {
  try {
    if (!nombre || !descripcion) {
      throw new Error('Nombre y descripción del departamento son requeridos');
    }

    const existing = await queryRunner.query(
      'SELECT id FROM "departamento" WHERE nombre = $1',
      [nombre],
    );

    if (existing && existing.length > 0) {
      logger.log(`Departamento ya existe: ${nombre}`);
      return existing[0];
    }

    const result = await queryRunner.query(
      `INSERT INTO "departamento" (nombre, descripcion)
       VALUES ($1, $2)
       RETURNING id`,
      [nombre, descripcion],
    );
    
    const created = Array.isArray(result) ? result[0] : result;
    logger.log(`Departamento creado: ${nombre}`);
    return created;
  } catch (error) {
    logger.error(`Error al crear departamento ${nombre}: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

// Función auxiliar corregida para crear carreras
const ensureCarrera = async (queryRunner: QueryRunner, nombre: string, descripcion: string) => {
  try {
    if (!nombre || !descripcion) {
      throw new Error('Nombre y descripción de la carrera son requeridos');
    }

    const existing = await queryRunner.query(
      'SELECT id FROM "carrera" WHERE nombre = $1',
      [nombre],
    );

    if (existing && existing.length > 0) {
      logger.log(`Carrera ya existe: ${nombre}`);
      return existing[0];
    }

    const result = await queryRunner.query(
      `INSERT INTO "carrera" (nombre, descripcion)
       VALUES ($1, $2)
       RETURNING id`,
      [nombre, descripcion],
    );
    
    const created = Array.isArray(result) ? result[0] : result;
    logger.log(`Carrera creada: ${nombre}`);
    return created;
  } catch (error) {
    logger.error(`Error al crear carrera ${nombre}: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

// Función auxiliar corregida para crear planes de estudio
const ensurePlanEstudio = async (queryRunner: QueryRunner, nombre: string, descripcion: string, año: number, carreraId: number) => {
  try {
    const validCarreraId = validateId(carreraId, 'carrera');
    
    // Verificar si la carrera existe
    const carrera = await queryRunner.query(
      'SELECT id FROM "carrera" WHERE id = $1',
      [validCarreraId],
    );
    
    if (!carrera || carrera.length === 0) {
      throw new Error(`No se encontró la carrera con ID: ${validCarreraId}`);
    }

    const existing = await queryRunner.query(
      'SELECT id FROM "plan_estudio" WHERE nombre = $1 AND "carreraId" = $2',
      [nombre, validCarreraId],
    );

    if (existing && existing.length > 0) {
      logger.log(`Plan de estudio ya existe: ${nombre}`);
      return existing[0];
    }

    const result = await queryRunner.query(
      `INSERT INTO "plan_estudio" (nombre, descripcion, año, "carreraId")
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [nombre, descripcion, año, validCarreraId],
    );
    
    const created = Array.isArray(result) ? result[0] : result;
    logger.log(`Plan de estudio creado: ${nombre}`);
    return created;
  } catch (error) {
    logger.error(`Error al crear plan de estudio ${nombre}: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

// Función auxiliar corregida para crear materias
const ensureMateriaAnalisis = async (queryRunner: QueryRunner, planEstudioId: number, departamentoId: number) => {
  try {
    const validPlanEstudioId = validateId(planEstudioId, 'plan de estudio');
    const validDepartamentoId = validateId(departamentoId, 'departamento');

    const nombre = 'Análisis Matemático I';
    const existing = await queryRunner.query(
      `SELECT m.id FROM "materia" m
       INNER JOIN "materia_planes_estudio" mpe ON m.id = mpe."materiaId"
       WHERE m.nombre = $1 AND mpe."planEstudioId" = $2`,
      [nombre, validPlanEstudioId],
    );

    if (existing && existing.length > 0) {
      logger.log(`Materia ya existe en el plan: ${nombre}`);
      return existing[0];
    }

    // Crear materia
    const result = await queryRunner.query(
      `INSERT INTO "materia" (nombre, "departamentoId")
       VALUES ($1, $2)
       RETURNING id`,
      [nombre, validDepartamentoId],
    );

    const created = Array.isArray(result) ? result[0] : result;

    // Crear relación con el plan de estudios
    await queryRunner.query(
      `INSERT INTO "materia_planes_estudio" ("materiaId", "planEstudioId", nivel)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [created.id, validPlanEstudioId, 1],
    );

    logger.log(`Materia creada: ${nombre}`);
    return created;
  } catch (error) {
    logger.error(`Error al crear materia Análisis Matemático I: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

// Función auxiliar corregida para crear comisiones
const ensureComision = async (queryRunner: QueryRunner, data: {
  materiaId: number;
  codigo: string;
  fechaInicio: string;
  fechaFin: string;
  profesorId: number;
}) => {
  try {
    const validMateriaId = validateId(data.materiaId, 'materia');

    const nombre = data.codigo;
    const existing = await queryRunner.query(
      `SELECT id FROM "comision" WHERE nombre = $1 AND "materiaId" = $2`,
      [nombre, validMateriaId],
    );
    
    if (existing.length) {
      logger.log(`La comisión "${nombre}" ya existe`);
      return existing[0];
    }

    // Crear nueva comisión
    const result = await queryRunner.query(
      `INSERT INTO "comision" (nombre, "materiaId", "profesorId")
       VALUES ($1, $2, $3)
       RETURNING id`,
      [nombre, validMateriaId, data.profesorId],
    );
    
    const created = Array.isArray(result) ? result[0] : result;
    logger.log(`Comisión creada: ${nombre}`);
    return created;
  } catch (error) {
    logger.error(`Error al crear comisión ${data.codigo}: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

// Función auxiliar corregida para crear horarios
const ensureHorario = async (queryRunner: QueryRunner, data: {
  comisionId: number;
  dia: string;
  horaInicio: string;
  horaFin: string;
  aula: string;
  tipo: string;
}) => {
  try {
    const validComisionId = validateId(data.comisionId, 'comision');

    validateDiaSemana(data.dia);
    validateTimeFormat(data.horaInicio);
    validateTimeFormat(data.horaFin);

    // Verificar si la comisión existe
    const comision = await queryRunner.query(
      'SELECT id FROM "comision" WHERE id = $1',
      [validComisionId],
    );
    
    if (!comision || comision.length === 0) {
      throw new Error(`No se encontró la comisión con ID: ${validComisionId}`);
    }

    // Verificar si el horario ya existe
    const existing = await queryRunner.query(
      `SELECT id FROM "horario"
       WHERE "comisionId" = $1 AND dia = $2 AND "horaInicio" = $3 AND "horaFin" = $4`,
      [validComisionId, data.dia.toLowerCase(), data.horaInicio, data.horaFin],
    );

    if (existing && existing.length > 0) {
      logger.log(`El horario ya existe para la comisión ${validComisionId} el día ${data.dia} de ${data.horaInicio} a ${data.horaFin}`);
      return existing[0];
    }

    // Insertar nuevo horario
    const result = await queryRunner.query(
      `INSERT INTO "horario" (dia, "horaInicio", "horaFin", aula, "comisionId")
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [data.dia.toLowerCase(), data.horaInicio, data.horaFin, data.aula, validComisionId],
    );
    
    const created = Array.isArray(result) ? result[0] : result;
    logger.log(`Horario registrado: ${data.dia} ${data.horaInicio}-${data.horaFin} (${data.aula})`);
    return created;
  } catch (error) {
    logger.error(`Error al crear horario: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

// Ejecutar el seed
async function main() {
  logger.log('Iniciando proceso de seed...');
  
  try {
    const result = await seed();
    if (result.success) {
      logger.log(`${result.message}`);
    } else {
      logger.error(`${result.message}`);
      if (result.error) {
        logger.error('Detalles del error:', result.error);
      }
      process.exit(1);
    }
  } catch (error) {
    logger.error('Error inesperado durante el seed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('\nError fatal inesperado:', error);
    process.exit(1);
  });
}