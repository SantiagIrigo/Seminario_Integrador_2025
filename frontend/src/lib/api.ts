import axios, { AxiosHeaders, InternalAxiosRequestConfig } from 'axios';

// Configuración de la URL base de la API
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Crear instancia de axios con configuración base
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
  timeout: 10000, // 10 segundos de timeout
});

// Función para configurar el token en el cliente de API
export const setAuthToken = (token: string | null) => {
  if (token) {
    const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    api.defaults.headers.common['Authorization'] = authToken;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('token', token); // compatibilidad con formato antiguo
    }
  } else {
    delete api.defaults.headers.common['Authorization'];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('token');
    }
  }
};

// Configurar el token inicial si existe (solo en el contexto de autenticación)
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
  if (token) {
    setAuthToken(token);
  }
}

// Interceptor para agregar el token de autenticación a cada solicitud
// Configurar interceptor de solicitud
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (token) {
        if (config.headers) {
          if (config.headers instanceof AxiosHeaders) {
            if (!config.headers.has('Authorization')) {
              config.headers.set('Authorization', `Bearer ${token}`);
            }
          } else {
            const headers = (config.headers as unknown as Record<string, string>);
            if (!headers.Authorization) {
              headers.Authorization = `Bearer ${token}`;
            }
            config.headers = headers as unknown as AxiosHeaders;
          }
        } else {
          config.headers = new AxiosHeaders({ Authorization: `Bearer ${token}` });
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Configurar interceptor de respuesta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.config) {
      return Promise.reject(error);
    }
    
    const originalRequest = error.config;
    
    // Si es un 404 en el perfil, limpiar la autenticación
    if (error.response?.status === 404 && originalRequest.url.includes('/auth/profile')) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        delete api.defaults.headers.common['Authorization'];
      }
      return Promise.reject(new Error('Sesión no válida'));
    }
    
    // Si es un error 401 y no es la solicitud de login
    if (error.response?.status === 401 && !originalRequest.url.includes('/auth/login')) {
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const isAuthRoute = currentPath.includes('/login') || currentPath.includes('/auth');
        const isInscripcionRoute = currentPath.includes('/inscripciones');
        const isHorarioRoute = currentPath.includes('/mi-horario');

        // Para rutas protegidas que manejan errores 401 internamente, no redirigir automáticamente
        // Dejar que el componente maneje el error 401
        if (isInscripcionRoute || isHorarioRoute) {
          // 401 on protected route; let component handle it
          return Promise.reject(error);
        }

        if (!isAuthRoute) {
          // Session expired or invalid; redirecting to login
          localStorage.removeItem('auth_token');
          delete api.defaults.headers.common['Authorization'];
          window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
