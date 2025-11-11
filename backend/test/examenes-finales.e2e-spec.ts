import request from 'supertest';
import { createE2EApp, seedUser, seedMateria, login } from './e2e-utils';

describe('Examenes Finales e2e', () => {
  let app: any;

  let materiaId: number;
  let docenteId: number;

  beforeAll(async () => {
    const boot = await createE2EApp();
    app = boot.app;

    // Seed admin (crea/actualiza/borrar) y docente (asignado al examen)
    await seedUser(boot.dataSource, { email: 'admin2@example.com', password: 'secret', rol: 'admin', nombre: 'Admin2', apellido: 'Test' } as any);
    const docente = await seedUser(boot.dataSource, { email: 'docente@example.com', password: 'secret', rol: 'profesor', nombre: 'Doc', apellido: 'Ente' } as any);
    docenteId = docente.id;

    // Materia básica
    const materia = await seedMateria(boot.dataSource, { nombre: 'Algoritmos', descripcion: 'Intro' } as any);
    materiaId = materia.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('admin can create, list and delete an examen final', async () => {
    const { access_token } = await login(app, 'admin2@example.com', 'secret');

    // Usar ids realmente insertados

    const fecha = new Date();
    fecha.setDate(fecha.getDate() + 7);
    const fechaStr = fecha.toISOString().split('T')[0];

    // Crear
    const createRes = await request(app.getHttpServer())
      .post('/examenes-finales')
      .set('Authorization', `Bearer ${access_token}`)
      .send({
        materiaId,
        docenteId,
        fecha: fechaStr,
        horaInicioTeorico: '08:00',
        horaFinTeorico: '10:00',
        aulaTeorico: 'A1',
        cupo: 20,
      })
      .expect(201);

    const examenId = createRes.body.id;

    // Listar
    const listRes = await request(app.getHttpServer())
      .get('/examenes-finales')
      .set('Authorization', `Bearer ${access_token}`)
      .expect(200);
    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.find((e: any) => e.id === examenId)).toBeTruthy();

    // Borrar
    await request(app.getHttpServer())
      .delete(`/examenes-finales/${examenId}`)
      .set('Authorization', `Bearer ${access_token}`)
      .expect(200);
  });
});