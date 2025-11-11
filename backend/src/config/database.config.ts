import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const getDatabaseConfig = (): TypeOrmModuleOptions => {
  const isJest = process.env.JEST_WORKER_ID !== undefined || process.env.JEST === 'true';
  const useSqlite = isJest || process.env.NODE_ENV === 'test' || process.env.DB_TYPE === 'sqlite';

  if (useSqlite) {
    return {
      type: 'sqlite',
      database: process.env.DB_FILE || ':memory:',
      autoLoadEntities: true,
      synchronize: true,
      dropSchema: true,
      logging: false,
    } as TypeOrmModuleOptions;
  }

  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'testpass',
    database: process.env.DB_DATABASE || 'autogestion',
    autoLoadEntities: true,
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV === 'development',
    ssl: false,
    connectTimeoutMS: 10000,
  } as TypeOrmModuleOptions;
};
