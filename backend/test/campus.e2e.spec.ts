import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Campus E2E (happy paths)', () => {
  let app: INestApplication;
  let studentToken: string;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET / should respond 200', async () => {
    await request(app.getHttpServer()).get('/').expect(200);
  });

  it('Login estudiante', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'estudiante@universidad.edu', password: 'password123' })
      .expect(201);
    expect(res.body.access_token).toBeDefined();
    studentToken = res.body.access_token;
  });

  it('Materias del plan (estudiante, protegido)', async () => {
    await request(app.getHttpServer())
      .get('/materia/del-plan/1')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);
  });

  it('Login admin', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@universidad.edu', password: 'password123' })
      .expect(201);
    adminToken = res.body.access_token;
  });

  it('Listar examenes finales (admin)', async () => {
    await request(app.getHttpServer())
      .get('/examenes-finales')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });
});
