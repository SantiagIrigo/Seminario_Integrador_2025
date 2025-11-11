# Sistema de Gestión Académica 🎓

Sistema de gestión académica desarrollado para la materia de Seminario Integrador.

## 🚀 Funcionalidades Principales

### Estudiantes
- Inscripción a materias
- Visualización de horarios
- Control de asistencia
- Inscripción a exámenes

### Profesores
- Gestión de comisiones
- Registro de asistencia
- Carga de calificaciones

### Administradores
- Gestión de carreras y materias
- Administración de usuarios
- Reportes generales

## 🛠️ Tecnologías Utilizadas

### Backend
- NestJS
- TypeORM
- PostgreSQL
- JWT (Autenticación)

### Frontend
- React
- TypeScript
- Tailwind CSS

## 🚀 Cómo Empezar

1. Clonar el repositorio
2. Configurar las variables de entorno (ver sección de configuración a continuación)
3. Instalar dependencias: `npm install`
4. Iniciar el servidor: `npm run start:dev`

## 🔧 Configuración del Entorno

### Backend (NestJS)

1. **Crear archivo `.env`** en `/backend/.env` con el siguiente contenido:

```env
# Configuración de la base de datos
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu_contraseña
DB_NAME=autogestion
DB_SYNCHRONIZE=false
DB_LOGGING=false

# Configuración del servidor
PORT=3000
NODE_ENV=development

# Configuración de autenticación JWT
JWT_SECRET=tu_clave_secreta_muy_segura
JWT_EXPIRES_IN=1d

# Configuración de CORS
CORS_ORIGIN=http://localhost:3001
CORS_METHODS=GET,HEAD,PUT,PATCH,POST,DELETE
CORS_CREDENTIALS=true
CORS_ALLOWED_HEADERS=Content-Type,Authorization
```

### Frontend (Next.js)

1. **Crear archivo `.env.local`** en `/frontend/.env.local` con el siguiente contenido:

```env
# URL de la API del backend
NEXT_PUBLIC_API_URL=http://localhost:3000

# Configuración de autenticación
NEXT_PUBLIC_JWT_SECRET=tu_clave_secreta_muy_segura
NEXT_PUBLIC_JWT_EXPIRES_IN=1d

# Configuración de CORS
NEXT_PUBLIC_CORS_ORIGIN=http://localhost:3000
```

## 📌 Credenciales de Prueba

- **Administrador:**
  - Email: `admin@universidad.edu`
  - Contraseña: `password123`

- **Profesor:**
  - Email: `profesor@universidad.edu`
  - Contraseña: `password123`

- **Estudiante:**
  - Email: `estudiante@universidad.edu`
  - Contraseña: `password123`

## 📝 Requisitos
- Node.js 16+
- PostgreSQL 12+
- npm 8+
- **Swagger** - Documentación de API
- **Bcrypt** - Encriptación de contraseñas

### Frontend
- **Next.js 14** - Framework de React
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos
- **Radix UI** - Componentes accesibles
- **React Hook Form** - Manejo de formularios
- **Axios** - Cliente HTTP
- **Zustand** - Estado global
- **Recharts** - Gráficos

## 📋 Requisitos Previos

- Node.js 18+ 
- PostgreSQL 14+
- npm o yarn

## 🔧 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/autogestion.git
cd autogestion
```

### 2. Configurar la Base de Datos

Si usás Docker, levantá el servicio incluido:

```bash
docker compose up -d db
```

Esto crea la base `autogestion` automáticamente. Si preferís hacerlo manualmente:

```sql
CREATE DATABASE autogestion;
```

### 3. Configurar Variables de Entorno

#### Backend (.env)

Crear archivo `/backend/.env`:

```env
# Database
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=postgres
DB_PASSWORD=testpass
DB_DATABASE=autogestion

# JWT
JWT_SECRET=tu-secret-key-super-segura
JWT_EXPIRES_IN=7d

# App
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3001
```

#### Frontend (.env.local)

Crear archivo `/frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 4. Instalar Dependencias

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd frontend
npm install
```

## 🚀 Ejecución

### Desarrollo

#### Opción 1: Ejecutar por separado

Terminal 1 - Backend:
```bash
cd backend
npm run start:dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

#### Opción 2: Script unificado

Desde la raíz del proyecto:
```bash
npm run dev
```

### Producción

#### Build
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

#### Ejecutar
```bash
# Backend
cd backend
npm run start:prod

# Frontend
cd frontend
npm run start
```

## 📚 Documentación API

Una vez iniciado el backend, la documentación de la API está disponible en:

- Swagger UI: http://localhost:3000/api

## 🔑 Usuarios de Prueba

El sistema incluye usuarios de prueba para cada rol:

> Los usuarios de prueba pueden crearse ejecutando el script `backend/src/scripts/create-admin.ts` o cargándolos manualmente. Ajustá las credenciales según tu entorno. Recuerda que debes configurar la variable de entorno `DB_PORT` en el archivo `.env` para que coincida con el puerto de tu base de datos.

## 📁 Estructura del Proyecto

```
autogestion/
{{ ... }}
│   ├── src/
│   │   ├── auth/          # Autenticación y autorización
│   │   ├── user/          # Gestión de usuarios
│   │   ├── materia/       # Gestión de materias
│   │   ├── inscripcion/   # Sistema de inscripciones
│   │   ├── evaluacion/    # Calificaciones
│   │   ├── asistencia/    # Control de asistencia
│   │   ├── clase/         # Gestión de clases
│   │   ├── comision/      # Comisiones
│   │   ├── carrera/       # Carreras
│   │   ├── plan-estudio/  # Planes de estudio
│   │   └── ...
│   └── test/              # Pruebas
│
└── frontend/
    ├── src/
    │   ├── app/           # Páginas de Next.js
    │   ├── components/    # Componentes React
    │   ├── contexts/      # Contextos de React
    │   ├── services/      # Servicios API
    │   ├── lib/          # Utilidades
    │   └── styles/       # Estilos globales
    └── public/           # Archivos estáticos
```

## Testing

### Backend
```bash
cd backend
# Pruebas unitarias e integración
npm run test

# Pruebas e2e (usa SQLite en memoria)
NODE_ENV=test npm run test:e2e

# Cobertura
npm run test:cov
```

### Frontend
```bash
cd frontend
# Instalar dependencias de desarrollo si no las tienes
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event

# Ejecutar pruebas
npx jest

# Ejecutar pruebas con cobertura
npx jest --coverage
```

Opcionalmente, puedes agregar estos scripts a tu `package.json` del frontend:

```json
"scripts": {
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage"
}
```

## Seguridad

- ✅ Autenticación JWT
- ✅ Encriptación de contraseñas con Bcrypt
- ✅ Validación de datos con class-validator
- ✅ Guards de autorización por roles
- ✅ CORS configurado
- ✅ Variables de entorno para datos sensibles
- ✅ SQL Injection prevention con TypeORM

## 📈 Funcionalidades Principales

### Gestión de Materias
- CRUD completo de materias
- Sistema de correlatividades
- Asignación de profesores
- Gestión de comisiones y horarios

### Sistema de Inscripciones
- Inscripción a materias con validación de correlativas
- Control de cupos
- Estados de inscripción (pendiente, aprobada, rechazada)
- Historial de inscripciones

### Control de Asistencia
- Registro de asistencia por clase
- Cálculo automático de porcentajes
- Alertas por inasistencias

### Evaluaciones
- Carga de notas parciales y finales
- Cálculo de promedios
- Historial académico

### Dashboard y Reportes
- Estadísticas en tiempo real
- Gráficos interactivos
- Exportación de datos

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.
