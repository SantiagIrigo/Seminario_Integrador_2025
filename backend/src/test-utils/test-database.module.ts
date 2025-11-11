import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';

const testOrmConfig: TypeOrmModuleOptions = {
  type: 'sqlite',
  database: ':memory:',
  entities: ['src/**/*.entity.ts'],
  synchronize: true,
  dropSchema: true,
  logging: false,
};

@Module({
  imports: [TypeOrmModule.forRoot(testOrmConfig)],
  exports: [TypeOrmModule],
})
export class TestDatabaseModule {}
