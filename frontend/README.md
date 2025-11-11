# Frontend - Sistema de Gestión Académica

Frontend del Sistema de Gestión Académica desarrollado con React y TypeScript.

## 🚀 Empezando

### Requisitos Previos
- Node.js 16+
- npm 8+
- Backend del sistema en ejecución

### Configuración del Entorno

1. **Crear archivo `.env.local`** en la raíz del proyecto con el siguiente contenido:

```env
# URL de la API del backend
NEXT_PUBLIC_API_URL=http://localhost:3000

# Configuración de autenticación
NEXT_PUBLIC_JWT_SECRET=tu_clave_secreta_muy_segura
NEXT_PUBLIC_JWT_EXPIRES_IN=1d

# Configuración de CORS
NEXT_PUBLIC_CORS_ORIGIN=http://localhost:3000
```

### Instalación

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

3. Abrir [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📋 Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Compila la aplicación para producción
- `npm run start` - Inicia el servidor de producción
- `npm run lint` - Ejecuta el linter
- `npm test` - Ejecuta las pruebas

## 🛠️ Tecnologías Utilizadas

- **Next.js 14** - Framework de React
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilizado
- **React Query** - Manejo de estado del servidor
- **Zod** - Validación de esquemas
- **React Hook Form** - Manejo de formularios

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

## 🔧 Estructura del Proyecto

```
frontend/
├── src/
│   ├── app/            # Rutas de la aplicación
│   ├── components/     # Componentes reutilizables
│   ├── contexts/       # Contextos de React
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Utilidades y configuraciones
│   ├── services/       # Llamadas a la API
│   └── styles/         # Estilos globales
└── public/             # Archivos estáticos
```

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
