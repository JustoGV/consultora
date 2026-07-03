import api from '@/lib/axios';
import { AuthResponse, LoginCredentials, RegisterData, User } from '@/types';

const USER_KEY = 'auth_user';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // NOTE: do not log credentials, tokens, or full response payloads (AUD-17).
    const response = await api.post<AuthResponse>('/auth/login', credentials);

    // Guardar token y usuario en localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', response.data.token); // Backend devuelve 'token'
      localStorage.setItem(USER_KEY, JSON.stringify(response.data.usuario)); // Backend devuelve 'usuario'
    }

    return response.data;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    
    // Guardar token y usuario en localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.data.usuario));
    }
    
    return response.data;
  },

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem(USER_KEY);
    }
  },

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  },

  getCurrentUser(): User | null {
    if (typeof window !== 'undefined') {
      const userJson = localStorage.getItem(USER_KEY);
      if (!userJson || userJson === 'undefined' || userJson === 'null') {
        return null;
      }
      try {
        return JSON.parse(userJson);
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
        localStorage.removeItem(USER_KEY);
        return null;
      }
    }
    return null;
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  async getProfile(): Promise<User> {
    const response = await api.get<User>('/auth/profile');
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_KEY, JSON.stringify(response.data));
    }
    return response.data;
  }
};
