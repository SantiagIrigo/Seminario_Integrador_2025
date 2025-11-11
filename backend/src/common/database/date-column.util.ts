import { ColumnType } from 'typeorm';

export const getDateColumnType = (): ColumnType => {
  const dbType = (process.env.DB_TYPE || process.env.TYPEORM_CONNECTION || '').toLowerCase();
  
  // Si es SQLite, siempre devolver 'datetime'
  if (dbType.includes('sqlite')) {
    return 'datetime';
  }
  
  // Si es entorno de prueba y no se especificó un tipo de base de datos, usar 'datetime'
  if (process.env.NODE_ENV === 'test' && !dbType) {
    return 'datetime';
  }
  
  // Para cualquier otro caso, incluyendo PostgreSQL, devolver 'timestamp'
  return 'timestamp';
};
