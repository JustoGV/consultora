import { User } from '@/types';

/**
 * Helper para obtener el administradoraId del usuario
 * - SUPERADMIN: retorna 'global' (ve todas las administradoras)
 * - ADMIN: retorna su administradoraId (solo ve su propia administradora)
 * - USER: retorna su administradoraId o null
 */
export function getUserAdministradoraId(user: User | null): string | null {
  if (!user) return null;
  
  // Si es superadmin, puede ver todas las administradoras
  if (user.rol === 'superadmin') {
    return 'global';
  }
  
  // Si es admin o usuario regular, retorna su administradoraId
  return user.administradoraId || null;
}

/**
 * Helper para verificar si el usuario es superadmin (acceso global)
 */
export function isGlobalAdmin(user: User | null): boolean {
  return user?.rol === 'superadmin';
}

/**
 * Helper para verificar si el usuario es admin de obra social
 */
export function isAdminObraSocial(user: User | null): boolean {
  return user?.rol === 'admin';
}
