import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { User } from '../src/user/entities/user.entity';
import { Materia } from '../src/materia/entities/materia.entity';
import { Carrera } from '../src/carrera/entities/carrera.entity';
import { PlanEstudio } from '../src/plan-estudio/entities/plan-estudio.entity';
import { Departamento } from '../src/departamento/entities/departamento.entity';
import { MateriaPlanEstudio } from '../src/materia/entities/materia-plan-estudio.entity';

export async function createE2EApp(): Promise<{ app: INestApplication; dataSource: DataSource }> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  await app.init();
  const dataSource = app.get(DataSource);
  return { app, dataSource };
}

export async function seedUser(ds: DataSource, partial: Partial<User> & { password?: string }): Promise<User> {
  const repo = ds.getRepository(User);
  const entity = repo.create({
    nombre: 'Test',
    apellido: 'User',
    email: 'test@example.com',
    rol: 'admin',
    legajo: 'L0001',
    dni: '10000000',
    ...partial,
  } as any);
  if ((partial as any).password) {
    (entity as any).password = await bcrypt.hash((partial as any).password, 10);
  }
  return repo.save(entity as any);
}

export async function seedMateria(ds: DataSource, partial: Partial<Materia> = {}): Promise<Materia> {
  const repo = ds.getRepository(Materia);
  const entity = repo.create({
    nombre: 'Materia Test',
    descripcion: 'Materia de prueba',
    correlativasCursada: [],
    correlativasFinal: [],
    ...partial,
  } as any);
  return repo.save(entity as any);
}

export async function seedEstructuraAcademica(ds: DataSource) {
  const carreraRepo = ds.getRepository(Carrera);
  const deptoRepo = ds.getRepository(Departamento);
  const planRepo = ds.getRepository(PlanEstudio);

  const carrera = await carreraRepo.save(carreraRepo.create({ nombre: 'Sistemas', descripcion: 'Ing. en Sistemas' } as any));
  const basicas = await deptoRepo.save(deptoRepo.create({ nombre: 'Básicas', descripcion: 'Depto Básicas', carrera } as any));
  const plan = await planRepo.save(planRepo.create({ nombre: 'Plan 2023', año: 2023, carrera } as any));
  return { carrera, basicas, plan };
}

export async function linkMateriaAPlan(ds: DataSource, materia: Materia, plan: PlanEstudio, nivel = 1) {
  const repo = ds.getRepository(MateriaPlanEstudio);
  await repo.save(repo.create({ materiaId: materia.id, planEstudioId: plan.id, nivel } as any));
}

export async function asignarPlanAUsuario(ds: DataSource, userId: number, planId: number) {
  await ds.getRepository(User).update(userId, { planEstudio: { id: planId } } as any);
}

export async function login(app: INestApplication, identifier: string, password: string) {
  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send(identifier.includes('@') ? { email: identifier, password } : { legajo: identifier, password })
    .expect(201);
  return res.body as { access_token: string; user: any };
}