'use client';

import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { mockPatients } from '@/lib/mockData';
import { getUserAdministradoraId } from '@/lib/userHelpers';
import PatientMetrics from '@/components/PatientMetrics';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function MetricsPage() {
  const { user, isSuperAdmin } = useAuth();

  // Filtrar pacientes por administradora
  const filteredPatients = useMemo(() => {
    if (!user) return [];

    const administradoraId = getUserAdministradoraId(user);

    // Global admin sees all data
    if (administradoraId === 'global') {
      return mockPatients;
    }

    return mockPatients.filter(p => administradoraId && p.administradoras.includes(administradoraId));
  }, [user]);

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Restringido</h2>
          <p className="text-gray-600 mb-6">
            Solo el superadministrador puede acceder a las métricas detalladas.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Volver al Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Volver
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">
          📊 Métricas y Análisis de Pacientes
        </h1>
        <p className="text-gray-600 mt-2">
          Análisis detallado de la información de pacientes y certificados
          {user?.administradoraId && user.administradoraId !== 'global' 
            ? ' de tu administradora' 
            : ' del sistema completo'}
        </p>
      </div>

      {/* Estadísticas y Métricas */}
      {filteredPatients.length > 0 ? (
        <PatientMetrics patients={filteredPatients} />
      ) : (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="text-6xl mb-4">📭</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No hay datos disponibles</h2>
          <p className="text-gray-600 mb-6">
            Aún no hay pacientes registrados para mostrar métricas.
          </p>
          <Link
            href="/dashboard/patients"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ver Pacientes
          </Link>
        </div>
      )}

      {/* Información Adicional */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="text-2xl">💡</div>
          <div>
            <h3 className="font-bold text-blue-900 mb-2">Sobre estas métricas</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Las métricas se calculan en tiempo real basándose en los datos actuales</li>
              <li>• La distribución por edad se agrupa en rangos para mejor visualización</li>
              <li>• Los certificados vencidos son aquellos cuya fecha de expiración ya pasó</li>
              <li>• Los porcentajes se calculan sobre el total de pacientes o certificados según corresponda</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
