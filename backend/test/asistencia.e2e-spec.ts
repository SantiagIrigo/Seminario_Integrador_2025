import request from 'supertest';
import { createE2EApp, seedUser, login } from './e2e-utils';

describe('Asistencia e2e', () => {
  let app: any;

  beforeAll(async () => {
    const boot = await createE2EApp();
    app = boot.app;
    await seedUser(boot.dataSource, { email: 'alumno2@example.com', password: 'secret', rol: 'estudiante', nombre: 'Juan', apellido: 'Pérez', legajo: 'L2222', dni: '23333333' } as any);
  });

  afterAll(async () => {
    await app.close();
  });

  it('estudiante puede consultar sus asistencias (vacío)', async () => {
    const { access_token } = await login(app, 'alumno2@example.com', 'secret');

    const res = await request(app.getHttpServer())
      .get('/asistencia/mis-asistencias')
      .set('Authorization', `Bearer ${access_token}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });
});