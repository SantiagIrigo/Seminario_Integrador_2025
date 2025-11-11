import request from 'supertest';
import { createE2EApp, seedUser, seedEstructuraAcademica, seedMateria, linkMateriaAPlan, asignarPlanAUsuario, login } from './e2e-utils';

describe('Inscripciones e2e', () => {
  let app: any;
  let estudianteEmail = 'alumno@example.com';

  beforeAll(async () => {
    const boot = await createE2EApp();
    app = boot.app;

    const { plan, basicas } = await seedEstructuraAcademica(boot.dataSource) as any;

    const estudiante = await seedUser(boot.dataSource, { email: estudianteEmail, password: 'secret', rol: 'estudiante', nombre: 'Alu', apellido: 'Mno', legajo: 'L1234', dni: '20000000' } as any);
    await asignarPlanAUsuario(boot.dataSource, estudiante.id, plan.id);

    const materia = await seedMateria(boot.dataSource, { nombre: 'Programación I', descripcion: 'Intro', departamento: { id: basicas.id } } as any);
    await linkMateriaAPlan(boot.dataSource, materia, plan, 1);
  });

  afterAll(async () => {
    await app.close();
  });

  it('estudiante ve materias disponibles y se inscribe', async () => {
    const { access_token } = await login(app, estudianteEmail, 'secret');

    const dispRes = await request(app.getHttpServer())
      .get('/inscripcion/materia/disponibles')
      .set('Authorization', `Bearer ${access_token}`)
      .expect(200);

    expect(Array.isArray(dispRes.body)).toBe(true);
    const materia = dispRes.body.find((m: any) => m.nombre === 'Programación I');
    expect(materia).toBeTruthy();

    const inscRes = await request(app.getHttpServer())
      .post(`/inscripcion/materia/${materia.id}`)
      .set('Authorization', `Bearer ${access_token}`)
      .expect(201);

    expect(inscRes.body).toHaveProperty('id');
    expect(inscRes.body.materia.nombre).toBe('Programación I');
  });
});