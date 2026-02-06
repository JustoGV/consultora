import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  timeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 60000, // 60 segundos para dar tiempo al backend a despertar
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token automáticamente a todas las peticiones
api.interceptors.request.use(
  (config) => {
    // Solo intentar leer del localStorage en el cliente
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación y otros errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Solo ejecutar redirección en el cliente
    if (typeof window !== 'undefined') {
      // Si el token expiró o es inválido, limpiar y redirigir al login
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Solo redirigir si no estamos ya en login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
