'use client';

import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { mockPatients, mockCategories, mockNomenclators } from '@/lib/mockData';
import {
  UsersIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();

  // Filtrar datos por administradora del usuario actual
  const administradoraStats = useMemo(() => {
    if (!user) return { patients: 0, certificates: 0, categories: 0, nomenclators: 0 };

    // Global admin sees all data
    if (user.administradoraId === 'global') {
      const patients = mockPatients;
      const certificates = mockPatients.flatMap(p => p.certificates);
      const categories = mockCategories.filter(c => c.administradoraId === 'global');
      const nomenclators = mockNomenclators.filter(n => n.administradoraId === 'global');
      return {
        patients: patients.length,
        certificates: certificates.length,
        categories: categories.length,
        nomenclators: nomenclators.length
      };
    }

    const patients = mockPatients.filter(p => p.administradoras.includes(user.administradoraId));
    const certificates = mockPatients.flatMap(p => p.certificates).filter(c => c.administradoraId === user.administradoraId);
    const categories = mockCategories.filter(c => c.administradoraId === user.administradoraId || c.administradoraId === 'global');
    const nomenclators = mockNomenclators.filter(n => n.administradoraId === user.administradoraId || n.administradoraId === 'global');

    return {
      patients: patients.length,
      certificates: certificates.length,
      categories: categories.length,
      nomenclators: nomenclators.length
    };
  }, [user]);

  const stats = isAdmin ? [
    {
      name: 'Total Pacientes',
      value: administradoraStats.patients,
      icon: UsersIcon,
      color: 'bg-blue-500'
    },
    {
      name: 'Certificados Activos',
      value: administradoraStats.certificates,
      icon: DocumentTextIcon,
      color: 'bg-green-500'
    },
    {
      name: 'Categorías',
      value: administradoraStats.categories,
      icon: ClipboardDocumentListIcon,
      color: 'bg-purple-500'
    },
    {
      name: 'Nomencladores',
      value: administradoraStats.nomenclators,
      icon: ChartBarIcon,
      color: 'bg-orange-500'
    },
  ] : [
    {
      name: 'Mis Certificados',
      value: administradoraStats.certificates,
      icon: DocumentTextIcon,
      color: 'bg-blue-500'
    },
    {
      name: 'Pacientes Asignados',
      value: administradoraStats.patients,
      icon: UsersIcon,
      color: 'bg-green-500'
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Bienvenido, {user?.name}
        </h1>
        <p className="text-gray-600 mt-2">{user?.administradoraName}</p>
        <p className="text-gray-600 mt-2">
          {isAdmin 
            ? 'Panel de administración del sistema' 
            : 'Gestiona tus certificados de discapacidad'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{stat.name}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Actividad Reciente</h2>
        <div className="space-y-4">
          {isAdmin ? (
            <>
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium text-gray-900">Nuevo certificado cargado</p>
                  <p className="text-sm text-gray-600">María González - Certificado de discapacidad motriz</p>
                </div>
                <span className="text-sm text-gray-500">Hace 2 horas</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium text-gray-900">Categoría actualizada</p>
                  <p className="text-sm text-gray-600">Discapacidad Sensorial - Descripción modificada</p>
                </div>
                <span className="text-sm text-gray-500">Hace 5 horas</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-gray-900">Nuevo nomenclador agregado</p>
                  <p className="text-sm text-gray-600">NOM-005 - Prótesis de miembro inferior</p>
                </div>
                <span className="text-sm text-gray-500">Ayer</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium text-gray-900">Certificado cargado</p>
                  <p className="text-sm text-gray-600">Tu certificado ha sido procesado exitosamente</p>
                </div>
                <span className="text-sm text-gray-500">Hace 1 día</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-gray-900">Cuenta creada</p>
                  <p className="text-sm text-gray-600">Bienvenido al sistema de gestión</p>
                </div>
                <span className="text-sm text-gray-500">Hace 3 días</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
