import api from '@/lib/axios';
import { AuthResponse, LoginCredentials, RegisterData, User } from '@/types';

const USER_KEY = 'auth_user';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log('🌐 authService: Enviando petición de login a', `${process.env.NEXT_PUBLIC_API_URL}/auth/login`);
    console.log('📧 authService: Email:', credentials.email);
    
    try {
      const response = await api.post<AuthResponse>('/auth/login', credentials);
      console.log('✅ authService: Login exitoso:', response.data);
      
      // Guardar token y usuario en localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', response.data.token); // Backend devuelve 'token'
        localStorage.setItem(USER_KEY, JSON.stringify(response.data.usuario)); // Backend devuelve 'usuario'
        console.log('💾 authService: Token y usuario guardados en localStorage');
      }
      
      return response.data;
    } catch (error: unknown) {
      console.error('❌ authService: Error completo:', error);
      console.error('❌ authService: Tipo de error:', typeof error);
      
      if (error && typeof error === 'object') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const err = error as any;
        console.error('❌ authService: Detalles del error:', {
          hasResponse: !!err.response,
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          hasRequest: !!err.request,
          message: err.message,
          code: err.code,
          configUrl: err.config?.url,
          configMethod: err.config?.method
        });
      }
      
      throw error;
    }
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
