import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateExamenFinalTable9999999999999 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear tabla de exámenes finales
    await queryRunner.createTable(
      new Table({
        name: 'examenes_finales',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'fecha',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'horaInicioTeorico',
            type: 'time',
            isNullable: false,
          },
          {
            name: 'horaFinTeorico',
            type: 'time',
            isNullable: false,
          },
          {
            name: 'aulaTeorico',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'horaInicioPractico',
            type: 'time',
            isNullable: true,
          },
          {
            name: 'horaFinPractico',
            type: 'time',
            isNullable: true,
          },
          {
            name: 'aulaPractico',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'cupo',
            type: 'int',
            default: 30,
          },
          {
            name: 'inscriptos',
            type: 'int',
            default: 0,
          },
          {
            name: 'materiaId',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'docenteId',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Crear índices
    await queryRunner.createIndex(
      'examenes_finales',
      new TableIndex({
        name: 'IDX_EXAMEN_FECHA',
        columnNames: ['fecha'],
      }),
    );

    // Crear claves foráneas
    await queryRunner.createForeignKeys('examenes_finales', [
      new TableForeignKey({
        columnNames: ['materiaId'],
        referencedTableName: 'materia',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['docenteId'],
        referencedTableName: 'user',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    ]);

    // Actualizar tabla de inscripciones_examen para soportar el nuevo modelo
    await queryRunner.query(`
      ALTER TABLE "inscripcion_examen" 
      ADD COLUMN IF NOT EXISTS "examenFinalId" integer,
      ADD COLUMN IF NOT EXISTS "estado" varchar(20) DEFAULT 'pendiente',
      ADD COLUMN IF NOT EXISTS "observaciones" text,
      ADD COLUMN IF NOT EXISTS "fechaActualizacion" timestamp;
    `);

    await queryRunner.createForeignKey(
      'inscripcion_examen',
      new TableForeignKey({
        columnNames: ['examenFinalId'],
        referencedTableName: 'examenes_finales',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar claves foráneas
    const table = await queryRunner.getTable('inscripcion_examen');
    if (table) {
      const examenFinalFk = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('examenFinalId') !== -1,
      );
      
      if (examenFinalFk) {
        await queryRunner.dropForeignKey('inscripcion_examen', examenFinalFk);
      }
    }

    // Eliminar columnas agregadas
    await queryRunner.query(`
      ALTER TABLE "inscripcion_examen" 
      DROP COLUMN IF EXISTS "examenFinalId",
      DROP COLUMN IF EXISTS "estado",
      DROP COLUMN IF EXISTS "observaciones",
      DROP COLUMN IF EXISTS "fechaActualizacion";
    `);

    // Eliminar tabla de exámenes finales
    await queryRunner.dropTable('examenes_finales');
  }
}
