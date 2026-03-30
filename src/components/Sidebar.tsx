'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  HomeIcon,
  DocumentPlusIcon,
  FolderOpenIcon,
  UsersIcon,
  CogIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  ArrowLeftOnRectangleIcon,
  ChartPieIcon,
  SparklesIcon,
  BellIcon,
  HeartIcon,
  UserGroupIcon,
  LinkIcon,
  DocumentTextIcon,
  IdentificationIcon,
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, isAdmin, isSuperAdmin } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const userMenuItems = [
    { name: 'Inicio', href: '/dashboard', icon: HomeIcon, section: 'main' },
    { name: 'Alertas', href: '/dashboard/alerts', icon: BellIcon, section: 'main' },
    { name: 'Nuevo Afiliado/Certificado', href: '/dashboard/upload', icon: DocumentPlusIcon, section: 'main' },
    { name: 'Mis Certificados', href: '/dashboard/certificates', icon: FolderOpenIcon, section: 'main' },
  ];

  // Menú para Superadmin (acceso completo)
  const superAdminMenuItems = [
    { name: 'Inicio', href: '/dashboard', icon: HomeIcon, section: 'main' },
    { name: 'Alertas', href: '/dashboard/alerts', icon: BellIcon, section: 'main' },
    { name: 'Métricas', href: '/dashboard/metrics', icon: ChartPieIcon, section: 'main' },
    
    { name: 'Afiliados', href: '/dashboard/afiliados', icon: IdentificationIcon, section: 'gestion' },
    { name: 'Terceros Vinculados', href: '/dashboard/terceros-vinculados', icon: UserGroupIcon, section: 'gestion' },
    { name: 'Relaciones Afiliado-Tercero', href: '/dashboard/persona-terceros', icon: LinkIcon, section: 'gestion' },
    
    { name: 'Certificados Discapacidad', href: '/dashboard/certificados-discapacidad', icon: DocumentTextIcon, section: 'certificados' },
    { name: 'Certificados', href: '/dashboard/certificates', icon: FolderOpenIcon, section: 'certificados' },
    { name: 'Diagnósticos', href: '/dashboard/diagnosticos', icon: MagnifyingGlassIcon, section: 'certificados' },
    
    { name: 'Estado Civil', href: '/dashboard/estado-civil', icon: HeartIcon, section: 'catalogos' },
    { name: 'Tipos de Discapacidad', href: '/dashboard/tipo-discapacidad', icon: AdjustmentsHorizontalIcon, section: 'catalogos' },
    { name: 'Categorías', href: '/dashboard/categories', icon: ClipboardDocumentListIcon, section: 'catalogos' },
    { name: 'Nomencladores', href: '/dashboard/nomenclators', icon: ChartBarIcon, section: 'catalogos' },
    { name: 'Servicios', href: '/dashboard/servicios', icon: AdjustmentsHorizontalIcon, section: 'catalogos' },
    { name: 'Orientación Prestacional', href: '/dashboard/orientacion-prestacional', icon: LinkIcon, section: 'catalogos' },
    
    { name: 'Configuración', href: '/dashboard/settings', icon: CogIcon, section: 'config' },
  ];

  // Menú para Admin de Obra Social (sin métricas, sin modificar categorías/nomencladores)
  const adminObraSocialMenuItems = [
    { name: 'Inicio', href: '/dashboard', icon: HomeIcon, section: 'main' },
    { name: 'Alertas', href: '/dashboard/alerts', icon: BellIcon, section: 'main' },
    
    { name: 'Afiliados', href: '/dashboard/afiliados', icon: IdentificationIcon, section: 'gestion' },
    { name: 'Terceros Vinculados', href: '/dashboard/terceros-vinculados', icon: UserGroupIcon, section: 'gestion' },
    { name: 'Relaciones Afiliado-Tercero', href: '/dashboard/persona-terceros', icon: LinkIcon, section: 'gestion' },
    
    { name: 'Certificados Discapacidad', href: '/dashboard/certificados-discapacidad', icon: DocumentTextIcon, section: 'certificados' },
    { name: 'Certificados', href: '/dashboard/certificates', icon: FolderOpenIcon, section: 'certificados' },
    { name: 'Diagnósticos', href: '/dashboard/diagnosticos', icon: MagnifyingGlassIcon, section: 'certificados' },
    
    { name: 'Estado Civil', href: '/dashboard/estado-civil', icon: HeartIcon, section: 'catalogos' },
    { name: 'Tipos de Discapacidad', href: '/dashboard/tipo-discapacidad', icon: AdjustmentsHorizontalIcon, section: 'catalogos' },
    { name: 'Categorías', href: '/dashboard/categories', icon: ClipboardDocumentListIcon, section: 'catalogos' },
    { name: 'Nomencladores', href: '/dashboard/nomenclators', icon: ChartBarIcon, section: 'catalogos' },
    { name: 'Servicios', href: '/dashboard/servicios', icon: AdjustmentsHorizontalIcon, section: 'catalogos' },
    { name: 'Orientación Prestacional', href: '/dashboard/orientacion-prestacional', icon: LinkIcon, section: 'catalogos' },
    
    { name: 'Configuración', href: '/dashboard/settings', icon: CogIcon, section: 'config' },
  ];

  const menuItems = isSuperAdmin ? superAdminMenuItems : isAdmin ? adminObraSocialMenuItems : userMenuItems;

  return (
    <div className="flex flex-col h-screen w-72 bg-gray-900 border-r border-gray-800 shadow-lg">
      
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-700 bg-gray-800/50">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg">
            <SparklesIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold text-gray-100">
              Consultora Salud
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-300 ml-1 font-medium">
          Sistema de Gestión
        </p>
      </div>

      {/* User Profile */}
      {/* <div className="p-5 border-b border-gray-800 bg-gray-800/50">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
              <span className="text-sm font-semibold text-white">
                {user?.nombre ? `${user.nombre.charAt(0)}${(user.nombre.charAt(1) || '')}` : ''}
              </span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-teal-500 rounded-full border-2 border-gray-900"></div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base text-white truncate">
              {user?.nombre}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-600/20 text-white border border-blue-600/30">
                {user?.rol === 'superadmin' ? '🛡️ Superadmin' : user?.rol === 'admin' ? '👑 Admin' : '👤 Usuario'}
              </span>
            </div>
          </div>
        </div>
      </div> */}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {(isAdmin || isSuperAdmin) ? (
          <>
            {/* Navegación Principal */}
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
              Principal
            </div>
            {menuItems.filter((item) => item.section === 'main').map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              const isAlertsPage = item.href === '/dashboard/alerts';
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <div className="relative">
                    <Icon className={`w-5 h-5`} />
                    {isAlertsPage && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    )}
                  </div>
                  <span className="font-medium text-sm">{item.name}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white"></div>
                  )}
                </Link>
              );
            })}

            {/* Gestión */}
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mt-6 mb-2">
              Gestión
            </div>
            {menuItems.filter((item) => item.section === 'gestion').map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5`} />
                  <span className="font-medium text-sm">{item.name}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white"></div>
                  )}
                </Link>
              );
            })}

            {/* Certificados */}
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mt-6 mb-2">
              Certificados
            </div>
            {menuItems.filter((item) => item.section === 'certificados').map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5`} />
                  <span className="font-medium text-sm">{item.name}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white"></div>
                  )}
                </Link>
              );
            })}

            {/* Catálogos */}
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mt-6 mb-2">
              Catálogos
            </div>
            {menuItems.filter((item) => item.section === 'catalogos').map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5`} />
                  <span className="font-medium text-sm">{item.name}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white"></div>
                  )}
                </Link>
              );
            })}

            {/* Configuración */}
            {menuItems.filter((item) => item.section === 'config').map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors mt-6 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5`} />
                  <span className="font-medium text-sm">{item.name}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white"></div>
                  )}
                </Link>
              );
            })}
          </>
        ) : (
          <>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
              Navegación
            </div>
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              const isAlertsPage = item.href === '/dashboard/alerts';
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <div className="relative">
                    <Icon className={`w-5 h-5`} />
                    {isAlertsPage && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    )}
                  </div>
                  <span className="font-medium text-sm">{item.name}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white"></div>
                  )}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Logout Section */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="group flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-red-600/10 hover:text-red-400 transition-colors w-full border border-transparent hover:border-red-600/30"
        >
          <ArrowLeftOnRectangleIcon className="w-5 h-5" />
          <span className="font-medium text-sm">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}
