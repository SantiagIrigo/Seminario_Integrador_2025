import request from 'supertest';
import { createE2EApp, seedUser, seedMateria, login } from './e2e-utils';
import { DiaSemana } from '../src/horario/entities/horario.entity';

describe('Horario e2e', () => {
  let app: any;

  beforeAll(async () => {
    const boot = await createE2EApp();
    app = boot.app;
    await seedUser(boot.dataSource, { email: 'sec@example.com', password: 'secret', rol: 'secretaria_academica', nombre: 'Sec', apellido: 'Retaria' } as any);
    await seedMateria(boot.dataSource, { nombre: 'Arquitectura', descripcion: 'Intro' } as any);
  });

  afterAll(async () => {
    await app.close();
  });

  it('secretaria crea, lista y actualiza un horario', async () => {
    const { access_token } = await login(app, 'sec@example.com', 'secret');

    // crear
    const createRes = await request(app.getHttpServer())
      .post('/horario')
      .set('Authorization', `Bearer ${access_token}`)
      .send({ materiaId: 1, dia: DiaSemana.LUNES, horaInicio: '08:00', horaFin: '10:00', aula: 'Lab 1' })
      .expect(201);
    const horarioId = createRes.body.id || 1;

    // listar por materia
    const listRes = await request(app.getHttpServer())
      .get('/horario/materia/1')
      .expect(200);
    expect(Array.isArray(listRes.body)).toBe(true);

    // actualizar
    await request(app.getHttpServer())
      .put(`/horario/${horarioId}`)
      .set('Authorization', `Bearer ${access_token}`)
      .send({ aula: 'Lab 2' })
      .expect(200);
  });
});