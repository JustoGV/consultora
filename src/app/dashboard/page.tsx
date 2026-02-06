'use client';

import { useMemo, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { afiliadosService } from '@/services/afiliadosService';
import { certificadosDiscapacidadService } from '@/services/certificadosDiscapacidadService';
import {
  UsersIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Afiliado, CertificadoDiscapacidad } from '@/types';

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [afiliados, setAfiliados] = useState<Afiliado[]>([]);
  const [certificados, setCertificados] = useState<CertificadoDiscapacidad[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [afiliadosData, certificadosData] = await Promise.all([
        afiliadosService.getAll(),
        certificadosDiscapacidadService.getAll(),
      ]);
      setAfiliados(afiliadosData);
      setCertificados(certificadosData);
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular estadísticas
  const administradoraStats = useMemo(() => {
    if (!user) return { patients: 0, certificates: 0, categories: 0, nomenclators: 0 };

    return {
      patients: afiliados.length,
      certificates: certificados.length,
      categories: 0, // TODO: Conectar con API de categorías
      nomenclators: 0, // TODO: Conectar con API de nomencladores
    };
  }, [user, afiliados, certificados]);

  const stats = isAdmin ? [
    {
      name: 'Pacientes Registrados',
      value: administradoraStats.patients,
      icon: UsersIcon,
      change: '+12.5%',
      trend: 'up' as const,
      description: 'vs mes anterior',
      color: '#4680ff',
      bgColor: 'bg-blue-50'
    },
    {
      name: 'Certificados Vigentes',
      value: administradoraStats.certificates,
      icon: DocumentTextIcon,
      change: '+8.2%',
      trend: 'up' as const,
      description: 'activos en sistema',
      color: '#2ed8b6',
      bgColor: 'bg-teal-50'
    },
    {
      name: 'Categorías Activas',
      value: administradoraStats.categories,
      icon: ClipboardDocumentListIcon,
      change: '0%',
      trend: 'neutral' as const,
      description: 'clasificaciones',
      color: '#6c757d',
      bgColor: 'bg-gray-100'
    },
    {
      name: 'Nomencladores',
      value: administradoraStats.nomenclators,
      icon: ChartBarIcon,
      change: '+3.1%',
      trend: 'up' as const,
      description: 'en configuración',
      color: '#ffb64d',
      bgColor: 'bg-orange-50'
    },
  ] : [
    {
      name: 'Certificados Asignados',
      value: administradoraStats.certificates,
      icon: DocumentTextIcon,
      change: 'Actualizado',
      trend: 'neutral' as const,
      description: 'tu cuenta',
      color: '#4680ff',
      bgColor: 'bg-blue-50'
    },
    {
      name: 'Pacientes en Cartera',
      value: administradoraStats.patients,
      icon: UsersIcon,
      change: 'Vigente',
      trend: 'neutral' as const,
      description: 'bajo tu gestión',
      color: '#2ed8b6',
      bgColor: 'bg-teal-50'
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header Moderno */}
      <div className="relative">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-gray-600 mt-2 flex items-center gap-2">
              {isAdmin 
                ? (
                  <>
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-xs font-bold uppercase tracking-wide shadow-lg">
                      Admin
                    </span>
                    <span className="font-medium">Vista Completa del Sistema</span>
                  </>
                )
                : (
                  <>
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-slate-600 to-slate-800 text-white text-xs font-bold uppercase tracking-wide shadow-lg">
                      Usuario
                    </span>
                    <span className="font-medium">Mis Certificaciones</span>
                  </>
                )}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Bienvenido/a,</p>
            <p className="text-xl font-bold text-gray-900">{user?.nombre}</p>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* KPIs Grid - Diseño Elegante */}
          <div className={`grid grid-cols-1 ${isAdmin ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-2'} gap-4`}>
        {stats.map((stat) => {
          const Icon = stat.icon;
          
          return (
            <div key={stat.name} className="bg-white rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 ${stat.bgColor} rounded-lg`}>
                  <Icon className="w-6 h-6" style={{ color: stat.color }} />
                </div>
                {stat.trend === 'up' && (
                  <div className="flex items-center gap-1 text-teal-600 bg-teal-50 px-2.5 py-1 rounded-md">
                    <ArrowTrendingUpIcon className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold">{stat.change}</span>
                  </div>
                )}
                {stat.trend === 'neutral' && (
                  <div className="flex items-center gap-1 text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md">
                    <CheckCircleIcon className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold">{stat.change}</span>
                  </div>
                )}
              </div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{stat.name}</p>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-2">{stat.description}</p>
            </div>
          );
        })}
      </div>

      {/* Actividad Reciente - Diseño Moderno */}
      <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Actividad Reciente</h2>
          <p className="text-gray-500 mt-1">Últimas acciones en el sistema</p>
        </div>
        <div className="space-y-3">
          {isAdmin ? (
            <>
              <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-all group border-l-4 border-l-transparent hover:border-l-blue-500">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl group-hover:scale-110 transition-transform">
                  <CheckCircleIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900">Certificado procesado exitosamente</p>
                  <p className="text-sm text-gray-600">María González - Discapacidad motriz certificada</p>
                </div>
                <span className="text-sm text-gray-500 font-semibold">Hace 2h</span>
              </div>
              
              <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-all group border-l-4 border-l-transparent hover:border-l-emerald-500">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl group-hover:scale-110 transition-transform">
                  <DocumentTextIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900">Actualización de categoría</p>
                  <p className="text-sm text-gray-600">Discapacidad Sensorial - Parámetros modificados</p>
                </div>
                <span className="text-sm text-gray-500 font-semibold">Hace 5h</span>
              </div>
              
              <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-all group border-l-4 border-l-transparent hover:border-l-indigo-500">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl group-hover:scale-110 transition-transform">
                  <ClipboardDocumentListIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900">Nomenclador agregado</p>
                  <p className="text-sm text-gray-600">NOM-005 - Prótesis de miembro inferior configurada</p>
                </div>
                <span className="text-sm text-gray-500 font-semibold">Ayer</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-all group border-l-4 border-l-transparent hover:border-l-blue-500">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl group-hover:scale-110 transition-transform">
                  <CheckCircleIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900">Certificado procesado</p>
                  <p className="text-sm text-gray-600">Documentación validada y archivada correctamente</p>
                </div>
                <span className="text-sm text-gray-500 font-semibold">Hace 1 día</span>
              </div>
              
              <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-all group border-l-4 border-l-transparent hover:border-l-emerald-500">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl group-hover:scale-110 transition-transform">
                  <UsersIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900">Acceso al sistema</p>
                  <p className="text-sm text-gray-600">Inicio de sesión exitoso en la plataforma</p>
                </div>
                <span className="text-sm text-gray-500 font-semibold">Hace 3 días</span>
              </div>
            </>
          )}
        </div>
      </div>
        </>
      )}
    </div>
  );
}
