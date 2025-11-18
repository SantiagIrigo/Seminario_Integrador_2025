import api from '@/lib/api';
import { User, UserRole } from '@/types';

export interface Departamento {
  id: number;
  nombre: string;
  descripcion?: string;
}

export interface Carrera {
  id: number;
  nombre: string;
  descripcion?: string;
}

export interface PlanEstudioOption {
  id: number;
  nombre: string;
  descripcion?: string;
  año?: number;
  carrera?: {
    id: number;
    nombre: string;
  };
}

export interface CreateCarreraPayload {
  nombre: string;
  descripcion?: string;
}

export interface CreateMateriaPayload {
  nombre: string;
  descripcion?: string;
  departamentoId: number;
  planesEstudioConNivel?: Array<{
    planEstudioId: number;
    nivel: number;
  }>;
}

export interface MateriaAdmin {
  id: number;
  nombre: string;
  descripcion?: string;
  departamento?: { id: number; nombre: string };
  createdAt?: string;
}

export interface MateriaListResponse {
  items: MateriaAdmin[];
  total: number;
  page: number;
  limit: number;
}

export interface CreatePlanEstudioPayload {
  nombre: string;
  descripcion?: string;
  año: number;
  carreraId: number;
}

export interface CreateUserPayload {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  legajo: string;
  dni: string;
  rol: UserRole;
  planEstudioId?: number;
}

export interface UserListResponse {
  items: User[];
  total: number;
  page: number;
  limit: number;
}

const AdminService = {
  async getDepartamentos(): Promise<Departamento[]> {
    const { data } = await api.get<Departamento[]>('/departamento');
    return Array.isArray(data) ? data : [];
  },

  async getCarreras(): Promise<Carrera[]> {
    const { data } = await api.get<Carrera[]>('/carrera');
    return Array.isArray(data) ? data : [];
  },

  async getPlanesEstudio(): Promise<PlanEstudioOption[]> {
    const { data } = await api.get<PlanEstudioOption[]>('/plan-estudio');
    return Array.isArray(data) ? data : [];
  },

  async getMaterias(page = 1, limit = 10): Promise<MateriaListResponse> {
    const { data } = await api.get('/materia', {
      params: { page, limit },
    });

    if (Array.isArray(data)) {
      return {
        items: data as MateriaAdmin[],
        total: data.length,
        page: 1,
        limit: data.length,
      };
    }

    return {
      items: data?.items ?? [],
      total: data?.meta?.totalItems ?? 0,
      page: data?.meta?.currentPage ?? page,
      limit: data?.meta?.itemsPerPage ?? limit,
    };
  },

  async createMateria(payload: CreateMateriaPayload): Promise<MateriaAdmin> {
    const { data } = await api.post<MateriaAdmin>('/materia', payload);
    return data;
  },

  async createCarrera(payload: CreateCarreraPayload): Promise<Carrera> {
    const { data } = await api.post<Carrera>('/carrera', payload);
    return data;
  },

  async createPlanEstudio(payload: CreatePlanEstudioPayload): Promise<PlanEstudioOption> {
    const { data } = await api.post<PlanEstudioOption>('/plan-estudio', payload);
    return data;
  },

  async getUsers(page = 1, limit = 10): Promise<UserListResponse> {
    const { data } = await api.get('/user', {
      params: { page, limit },
    });

    if (Array.isArray(data)) {
      return {
        items: data as User[],
        total: data.length,
        page: 1,
        limit: data.length,
      };
    }

    return {
      items: data?.items ?? [],
      total: data?.meta?.totalItems ?? 0,
      page: data?.meta?.currentPage ?? page,
      limit: data?.meta?.itemsPerPage ?? limit,
    };
  },

  async createUser(payload: CreateUserPayload): Promise<User> {
    const { data } = await api.post<User>('/user', payload);
    return data;
  },
};

export default AdminService;
