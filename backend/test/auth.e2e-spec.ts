import request from 'supertest';
import { createE2EApp, seedUser, login } from './e2e-utils';

describe('Auth e2e', () => {
  let app: any;

  beforeAll(async () => {
    const boot = await createE2EApp();
    app = boot.app;
    await seedUser(boot.dataSource, { email: 'admin@example.com', password: 'secret', rol: 'admin', nombre: 'Admin', apellido: 'Test' } as any);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should login and access protected route', async () => {
    // Protected route without token -> 401
    await request(app.getHttpServer()).get('/examenes-finales').expect(401);

    const { access_token } = await login(app, 'admin@example.com', 'secret');

    await request(app.getHttpServer())
      .get('/examenes-finales')
      .set('Authorization', `Bearer ${access_token}`)
      .expect(200);
  });
});