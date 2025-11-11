import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

type AuthStorage = {
  token: string;
  user: {
    id: number;
    email: string;
    rol: string;
  };
};

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
  timeout: 10000, // 10 segundos de timeout
});

// Función para obtener el token de autenticación
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  // 1. Buscar en autogestion.auth
  const storedAuth = localStorage.getItem('autogestion.auth');
  if (storedAuth) {
    try {
      const parsed: AuthStorage = JSON.parse(storedAuth);
      return parsed.token;
    } catch (error) {
      console.warn('Error parsing auth storage', error);
      localStorage.removeItem('autogestion.auth');
    }
  }

  // 2. Si no se encontró, buscar en la clave 'token' antigua
  const oldToken = localStorage.getItem('token');
  if (oldToken) {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const authData: AuthStorage = { 
          token: oldToken, 
          user: {
            id: user.id,
            email: user.email,
            rol: user.rol
          } 
        };
        localStorage.setItem('autogestion.auth', JSON.stringify(authData));
        // Limpiar el formato antiguo
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return oldToken;
      } catch (e) {
        console.error('Error migrating auth data', e);
      }
    }
  }

  return null;
};

// Interceptor para agregar el token de autenticación a las peticiones
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    if (typeof window !== 'undefined') {
      const token = getAuthToken();
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response) {
      // Si recibimos un 401 (No autorizado) o 403 (Prohibido)
      if (error.response.status === 401 || error.response.status === 403) {
        console.warn('Sesión expirada o no autorizada, redirigiendo a login...');
        
        // Limpiar el almacenamiento de autenticación
        if (typeof window !== 'undefined') {
          localStorage.removeItem('autogestion.auth');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
