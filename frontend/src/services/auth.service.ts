import api, { setAuthToken } from '@/lib/api';

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  dni: string;
  legajo: string;
  rol?: string;
}

export interface User {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  dni: string;
  legajo: string;
  rol: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

class AuthService {
  async login(credentials: LoginDto): Promise<AuthResponse> {
    const response = await api.post('/auth/login', credentials);
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setAuthToken(response.data.access_token);
    }
    return response.data;
  }

  async register(data: RegisterDto): Promise<User> {
    const response = await api.post('/auth/register', data);
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/profile');
    return response.data;
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }
}

export default new AuthService();
