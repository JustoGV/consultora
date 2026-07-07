'use client';

import { useMemo } from 'react';
import { Patient } from '@/types';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import {
  ChartBarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface PatientMetricsProps {
  patients: Patient[];
}

export default function PatientMetrics({ patients }: PatientMetricsProps) {
  
  // Calcular métricas
  const metrics = useMemo(() => {
    // Distribución por género
    const genderDistribution = patients.reduce((acc, patient) => {
      const gender = patient.gender || 'No especificado';
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Distribución por edad
    const ageDistribution = patients.reduce((acc, patient) => {
      const birthYear = new Date(patient.dateOfBirth).getFullYear();
      const age = new Date().getFullYear() - birthYear;
      
      let ageGroup = '60+';
      if (age < 18) ageGroup = '0-17';
      else if (age < 30) ageGroup = '18-29';
      else if (age < 45) ageGroup = '30-44';
      else if (age < 60) ageGroup = '45-59';
      
      acc[ageGroup] = (acc[ageGroup] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Distribución por tipo de discapacidad
    const allCertificates = patients.flatMap(p => p.certificates || []);
    const disabilityTypes = allCertificates.reduce((acc, cert) => {
      const category = cert.extractedData?.category || 'No especificado';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Distribución por nivel de discapacidad
    const disabilityLevels = allCertificates.reduce((acc, cert) => {
      const levelStr = cert.extractedData?.disabilityLevel || '0%';
      const level = parseInt(levelStr.replace('%', ''));
      
      let levelGroup = 'Severa (>75%)';
      if (level < 33) levelGroup = 'Leve (<33%)';
      else if (level < 66) levelGroup = 'Moderada (33-66%)';
      else if (level < 76) levelGroup = 'Grave (66-75%)';
      
      acc[levelGroup] = (acc[levelGroup] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Certificados por mes (últimos 6 meses)
    const certificatesByMonth = allCertificates.reduce((acc, cert) => {
      const date = new Date(cert.uploadDate);
      const monthYear = date.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' });
      acc[monthYear] = (acc[monthYear] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Certificados activos vs vencidos
    const now = new Date();
    const activeCount = allCertificates.filter(cert => {
      const expiryDate = cert.extractedData?.expiryDate;
      return expiryDate && new Date(expiryDate) > now;
    }).length;

    const expiredCount = allCertificates.length - activeCount;

    // Promedio de edad
    const avgAge = patients.reduce((sum, patient) => {
      const birthYear = new Date(patient.dateOfBirth).getFullYear();
      return sum + (new Date().getFullYear() - birthYear);
    }, 0) / patients.length || 0;

    return {
      total: patients.length,
      totalCertificates: allCertificates.length,
      activeCertificates: activeCount,
      expiredCertificates: expiredCount,
      avgAge: Math.round(avgAge),
      genderDistribution,
      ageDistribution,
      disabilityTypes,
      disabilityLevels,
      certificatesByMonth
    };
  }, [patients]);

  // Preparar datos para gráficos
  const chartData = useMemo(() => {
    const genderData = Object.entries(metrics.genderDistribution).map(([name, value]) => ({
      name,
      value,
      percentage: ((value / metrics.total) * 100).toFixed(1)
    }));

    const ageData = Object.entries(metrics.ageDistribution)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, value]) => ({
        name: `${name} años`,
        pacientes: value
      }));

    const disabilityTypeData = Object.entries(metrics.disabilityTypes).map(([name, value]) => ({
      name,
      certificados: value
    }));

    const disabilityLevelData = Object.entries(metrics.disabilityLevels)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, value]) => ({
        name,
        value,
        percentage: ((value / metrics.totalCertificates) * 100).toFixed(1)
      }));

    const monthlyData = Object.entries(metrics.certificatesByMonth)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([name, certificados]) => ({
        mes: name,
        certificados
      }));

    return {
      genderData,
      ageData,
      disabilityTypeData,
      disabilityLevelData,
      monthlyData
    };
  }, [metrics]);

  // Colores para los gráficos - Admindek Style
  const GENDER_COLORS = ['#4680ff', '#ff5370', '#adb5bd'];
  const AGE_COLORS = '#2ed8b6';
  const DISABILITY_TYPE_COLORS = '#4680ff';
  const LEVEL_COLORS = ['#ffb64d', '#ff9226', '#ff5370', '#e63757'];

  return (
    <div className="space-y-6">
      {/* KPIs Principales - Admindek Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pacientes */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Pacientes</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.total}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <UserGroupIcon className="w-8 h-8 text-[#4680ff]" />
            </div>
          </div>
        </div>

        {/* Certificados Activos */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Certificados Activos</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.activeCertificates}</p>
            </div>
            <div className="p-3 bg-teal-50 rounded-lg">
              <DocumentTextIcon className="w-8 h-8 text-[#2ed8b6]" />
            </div>
          </div>
        </div>

        {/* Certificados Vencidos */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Por Renovar</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.expiredCertificates}</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <ClockIcon className="w-8 h-8 text-[#ffb64d]" />
            </div>
          </div>
        </div>

        {/* Edad Promedio */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Edad Promedio</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.avgAge} <span className="text-lg text-gray-500">años</span></p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <ChartBarIcon className="w-8 h-8 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos de Distribución */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Distribución por Género - Pie Chart */}
        <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-blue-50 rounded-lg">
              <UserGroupIcon className="w-5 h-5 text-[#4680ff]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Distribución por Género</h3>
              <p className="text-xs text-gray-500">{metrics.total} pacientes</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.genderData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${((entry.percent ?? 0) * 100).toFixed(1)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.genderData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Distribución por Edad - Bar Chart */}
        <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-teal-50 rounded-lg">
              <ChartBarIcon className="w-5 h-5 text-[#2ed8b6]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Distribución por Edad</h3>
              <p className="text-xs text-gray-500">Rangos etarios</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.ageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6c757d' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6c757d' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #dee2e6',
                  borderRadius: '6px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  fontSize: '13px'
                }}
              />
              <Bar dataKey="pacientes" fill={AGE_COLORS} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tipo de Discapacidad - Bar Chart */}
        <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-blue-50 rounded-lg">
              <DocumentTextIcon className="w-5 h-5 text-[#4680ff]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Tipo de Discapacidad</h3>
              <p className="text-xs text-gray-500">Categorías principales</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.disabilityTypeData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#6c757d' }} />
              <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 11, fill: '#6c757d' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #dee2e6',
                  borderRadius: '6px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  fontSize: '13px'
                }}
              />
              <Bar dataKey="certificados" fill={DISABILITY_TYPE_COLORS} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Nivel de Discapacidad - Pie Chart */}
        <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-orange-50 rounded-lg">
              <ChartBarIcon className="w-5 h-5 text-[#ffb64d]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Nivel de Discapacidad</h3>
              <p className="text-xs text-gray-500">Severidad certificada</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.disabilityLevelData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => {
                  const name = entry.name || '';
                  const shortName = name.split('(')[0].trim();
                  return `${shortName}: ${((entry.percent ?? 0) * 100).toFixed(1)}%`;
                }}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.disabilityLevelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={LEVEL_COLORS[index % LEVEL_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Certificados por Mes - Line Chart */}
      <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
        <div className="flex items-center gap-2 mb-5">
          <div className="p-2 bg-gray-100 rounded-lg">
            <ChartBarIcon className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Tendencia Mensual</h3>
            <p className="text-xs text-gray-500">Certificados cargados por mes</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData.monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#6c757d' }} />
            <YAxis tick={{ fontSize: 11, fill: '#6c757d' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                fontSize: '13px'
              }}
            />
            <Legend wrapperStyle={{ fontSize: '13px' }} />
            <Line 
              type="monotone" 
              dataKey="certificados" 
              stroke="#4680ff" 
              strokeWidth={2}
              dot={{ fill: '#4680ff', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
