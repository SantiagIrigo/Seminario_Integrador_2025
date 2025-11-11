# Guía de pruebas y estructura por responsabilidad

## Ejecutar proyecto
- Requisitos: base de datos levantada (docker compose up -d)
- Compilar y correr:
  - npm install
  - npm run build
  - node dist/main

## Seeds
- Básico: npm run seed
- Extra (más datos reales): npm run seed:more

## Colección de requests
- Usa requests.http (VS Code REST Client) o importa a Postman.
- Flujo sugerido:
  1) Logins (admin, secretaria, estudiante)
  2) Materias, planes, departamentos
  3) Inscripción a cursada (estudiante)
  4) Cursada (historial/cursando)
  5) Evaluaciones (profesor carga, alumno consulta)
  6) Asistencia (consulta)
  7) Comisiones/Horarios/Clases (secretaría)
  8) Exámenes finales (admin/jefe cátedra)

## Responsabilidad única (SRP)

Se separó explícitamente la funcionalidad en módulos específicos:

- Inscripción (InscripcionModule)
  - Enfocado solo en inscribirse a una materia y obtener materias disponibles.
  - Endpoints bajo /inscripcion (p. ej., POST /inscripcion/materia/:materiaId, GET /inscripcion/materia/disponibles).

- Cursada (CursadaModule)
  - Seguimiento de la cursada: historial, materias en curso, carga de faltas y cierre de cursada (nota final/STC) por docentes.
  - Endpoints bajo /cursada (p. ej., GET /cursada/historial, POST /cursada/:id/faltas, POST /cursada/:id/nota).

- Evaluación (EvaluacionModule)
  - Carga y consulta de evaluaciones parciales/TPs/lab de la cursada, asociadas a una inscrpción/materia/estudiante.
  - Endpoints bajo /evaluacion.

- Asistencia (AsistenciaModule)
  - Registro y consulta de asistencias por clase.

- Clase, Horario, Comisión
  - Administración académica de dictado.

- Examen (legado) y Examen Final (nuevo)
  - Examen (legado): inscripciones históricas a finales previos.
  - Examen Final (nuevo): publicación y administración de mesas de final.

### Verificación actual
- InscripcionModule: inscribirse, disponibles.
- CursadaModule: historial/cursando, faltas/nota.
- EvaluacionModule: crear evaluación (profesor), obtener por materia, obtener por estudiante.
- AsistenciaModule: consultas.
- No hay lógica de cursada en InscripcionService (solo mapping DTO y alta).

## Recomendaciones adicionales
- Mantener DTOs específicos por módulo (evitar que InscripcionResponseDto crezca con campos de cursada; usar Cursada DTOs para faltas/nota/STC si se requiere separar aún más).
- Añadir guards/roles donde aplique (ya aplicado para profesor/secretaría).
- Documentar en Swagger agrupado por tag (ya usando @ApiTags).

## Testing rápido (CLI)
- requests.http contiene llamadas ordenadas para pruebas end-to-end.
- Para automatizar, considerar una suite e2e con Jest + supertest que consuma los endpoints clave tras los seeds.
