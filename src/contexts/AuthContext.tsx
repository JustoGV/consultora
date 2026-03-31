'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User } from '@/types';
import { authService } from '@/services/authService';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean; // true si es 'superadmin' o 'admin'
  isSuperAdmin: boolean; // true solo si es 'superadmin'
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Cargar usuario desde localStorage al montar
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser && authService.isAuthenticated()) {
      setUser(currentUser);
      // Refrescar perfil para tener administradoraId actualizado
      authService.getProfile()
        .then(profile => setUser(profile))
        .catch(() => {/* si falla el refresh, usamos el del localStorage */})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      console.log('🔐 AuthContext: Iniciando login...', email);
      const response = await authService.login({ email, password });
      console.log('✅ AuthContext: Login exitoso, usuario:', response.usuario);
      setUser(response.usuario); // Backend devuelve 'usuario'
      console.log('✅ AuthContext: Estado de usuario actualizado');
      return true;
    } catch (error) {
      console.error('❌ AuthContext: Error en login:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  // isAdmin: true si es 'superadmin' o 'admin' (ambos tienen acceso a features de admin)
  const isAdmin = user?.rol === 'superadmin' || user?.rol === 'admin';
  
  // isSuperAdmin: true solo si es 'superadmin' (acceso global a todas las administradoras)
  const isSuperAdmin = user?.rol === 'superadmin';

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin, isSuperAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
