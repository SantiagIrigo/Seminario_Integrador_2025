// src/common/database/date-column.util.spec.ts
import { getDateColumnType } from './date-column.util';

describe('date-column.util', () => {
  const prevEnv = { ...process.env };
  afterEach(() => {
    process.env = { ...prevEnv } as any;
  });

  it('returns datetime for sqlite when DB_TYPE=sqlite', () => {
    process.env.DB_TYPE = 'sqlite';
    expect(getDateColumnType()).toBe('datetime');
  });

  it('returns datetime for sqlite when NODE_ENV=test (implicit sqlite)', () => {
    delete process.env.DB_TYPE;
    delete process.env.TYPEORM_CONNECTION;
    process.env.NODE_ENV = 'test';
    expect(getDateColumnType()).toBe('datetime');
  });

  it('returns timestamp for postgres by default', () => {
    delete process.env.DB_TYPE;
    delete process.env.TYPEORM_CONNECTION;
    process.env.NODE_ENV = 'production';
    expect(getDateColumnType()).toBe('timestamp');
  });

  it('honors TYPEORM_CONNECTION', () => {
    delete process.env.DB_TYPE;
    process.env.TYPEORM_CONNECTION = 'postgres';
    expect(getDateColumnType()).toBe('timestamp');
    process.env.TYPEORM_CONNECTION = 'sqlite';
    expect(getDateColumnType()).toBe('datetime');
  });
});
