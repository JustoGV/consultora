'use client';

import Link from 'next/link';
import Image from 'next/image';
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
  ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/outline';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAdmin } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const userMenuItems = [
    { name: 'Inicio', href: '/dashboard', icon: HomeIcon },
    { name: 'Subir Certificado', href: '/dashboard/upload', icon: DocumentPlusIcon },
    { name: 'Mis Certificados', href: '/dashboard/certificates', icon: FolderOpenIcon },
  ];

  const adminMenuItems = [
    { name: 'Inicio', href: '/dashboard', icon: HomeIcon },
    { name: 'Pacientes', href: '/dashboard/patients', icon: UsersIcon },
    { name: 'Certificados', href: '/dashboard/certificates', icon: FolderOpenIcon },
    { name: 'Categorías', href: '/dashboard/categories', icon: ClipboardDocumentListIcon },
    { name: 'Nomencladores', href: '/dashboard/nomenclators', icon: ChartBarIcon },
    { name: 'Configuración', href: '/dashboard/settings', icon: CogIcon },
  ];

  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

  return (
    <div className="flex flex-col h-screen w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white">
      {/* Logo */}
      <div className="p-6 border-b border-blue-700">
        <h1 className="text-2xl font-bold">Consultora Salud</h1>
        <p className="text-xs text-blue-200 mt-1">Gestión de Discapacidad</p>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-blue-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center overflow-hidden">
            {user?.avatar ? (
              <Image src={user.avatar} alt={user.name} width={40} height={40} className="w-10 h-10 rounded-full" />
            ) : (
              <span className="text-sm font-semibold">{user?.name.charAt(0)}</span>
            )}
          </div>
          <div>
            <p className="font-medium text-sm">{user?.name}</p>
            <p className="text-xs text-blue-200 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-blue-100 hover:bg-blue-700/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-blue-700">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 px-4 py-3 rounded-lg text-blue-100 hover:bg-blue-700/50 transition-colors w-full"
        >
          <ArrowLeftOnRectangleIcon className="w-5 h-5" />
          <span className="font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}
