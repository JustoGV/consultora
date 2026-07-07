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
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Users, FileText, CalendarClock, Activity, PieChart as PieIcon, BarChart3, TrendingUp } from 'lucide-react';

import {
  CHART_TICK,
  CHART_GRID,
  CHART_TOOLTIP_STYLE,
  CHART_TOOLTIP_LABEL_STYLE,
  CHART_TOOLTIP_ITEM_STYLE,
  CHART_CATEGORICAL,
  CHART_PRIMARY,
  CHART_ANIM_MS,
} from '@/lib/chartTheme';

interface PatientMetricsProps {
  patients: Patient[];
}

export default function PatientMetrics({ patients }: PatientMetricsProps) {
  // Calcular métricas
  const metrics = useMemo(() => {
    const genderDistribution = patients.reduce((acc, patient) => {
      const gender = patient.gender || 'No especificado';
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

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

    const allCertificates = patients.flatMap((p) => p.certificates || []);
    const disabilityTypes = allCertificates.reduce((acc, cert) => {
      const category = cert.extractedData?.category || 'No especificado';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

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

    const certificatesByMonth = allCertificates.reduce((acc, cert) => {
      const date = new Date(cert.uploadDate);
      const monthYear = date.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' });
      acc[monthYear] = (acc[monthYear] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const now = new Date();
    const activeCount = allCertificates.filter((cert) => {
      const expiryDate = cert.extractedData?.expiryDate;
      return expiryDate && new Date(expiryDate) > now;
    }).length;

    const expiredCount = allCertificates.length - activeCount;

    const avgAge =
      patients.reduce((sum, patient) => {
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
      certificatesByMonth,
    };
  }, [patients]);

  const chartData = useMemo(() => {
    const genderData = Object.entries(metrics.genderDistribution).map(([name, value]) => ({
      name,
      value,
      percentage: ((value / metrics.total) * 100).toFixed(1),
    }));

    const ageData = Object.entries(metrics.ageDistribution)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, value]) => ({ name: `${name} años`, pacientes: value }));

    const disabilityTypeData = Object.entries(metrics.disabilityTypes).map(([name, value]) => ({
      name,
      certificados: value,
    }));

    const disabilityLevelData = Object.entries(metrics.disabilityLevels)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, value]) => ({
        name,
        value,
        percentage: ((value / metrics.totalCertificates) * 100).toFixed(1),
      }));

    const monthlyData = Object.entries(metrics.certificatesByMonth)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([name, certificados]) => ({ mes: name, certificados }));

    return { genderData, ageData, disabilityTypeData, disabilityLevelData, monthlyData };
  }, [metrics]);

  return (
    <div className="space-y-6 fade-in">
      {/* KPIs principales — mismo patrón que las cards del inicio */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Users} label="Total pacientes" value={metrics.total} />
        <KpiCard icon={FileText} label="Certificados activos" value={metrics.activeCertificates} />
        <KpiCard icon={CalendarClock} label="Por renovar" value={metrics.expiredCertificates} />
        <KpiCard
          icon={Activity}
          label="Edad promedio"
          value={metrics.avgAge}
          suffix="años"
        />
      </div>

      {/* Gráficos de distribución */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard icon={PieIcon} title="Distribución por género" subtitle={`${metrics.total} pacientes`}>
          {chartData.genderData.length === 0 ? (
            <ChartEmpty />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={chartData.genderData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${((entry.percent ?? 0) * 100).toFixed(0)}%`}
                  outerRadius={95}
                  innerRadius={52}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="var(--surface)"
                  strokeWidth={2}
                  animationDuration={CHART_ANIM_MS}
                >
                  {chartData.genderData.map((entry, index) => (
                    <Cell key={entry.name} fill={CHART_CATEGORICAL[index % CHART_CATEGORICAL.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  labelStyle={CHART_TOOLTIP_LABEL_STYLE}
                  itemStyle={CHART_TOOLTIP_ITEM_STYLE}
                  formatter={(value) => [`${value ?? 0} pacientes`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard icon={BarChart3} title="Distribución por edad" subtitle="Rangos etarios">
          {chartData.ageData.length === 0 ? (
            <ChartEmpty />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData.ageData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                <XAxis dataKey="name" tick={CHART_TICK} tickLine={false} axisLine={{ stroke: CHART_GRID }} />
                <YAxis tick={CHART_TICK} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: 'var(--surface-sunken)' }}
                  contentStyle={CHART_TOOLTIP_STYLE}
                  labelStyle={CHART_TOOLTIP_LABEL_STYLE}
                  itemStyle={CHART_TOOLTIP_ITEM_STYLE}
                  formatter={(value) => [`${value ?? 0}`, 'Pacientes']}
                />
                <Bar dataKey="pacientes" fill={CHART_PRIMARY} radius={[4, 4, 0, 0]} maxBarSize={56} animationDuration={CHART_ANIM_MS} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard icon={FileText} title="Tipo de discapacidad" subtitle="Categorías principales">
          {chartData.disabilityTypeData.length === 0 ? (
            <ChartEmpty />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={chartData.disabilityTypeData}
                layout="vertical"
                margin={{ top: 4, right: 12, left: 4, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} horizontal={false} />
                <XAxis type="number" tick={CHART_TICK} tickLine={false} axisLine={{ stroke: CHART_GRID }} allowDecimals={false} />
                <YAxis dataKey="name" type="category" width={140} tick={CHART_TICK} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: 'var(--surface-sunken)' }}
                  contentStyle={CHART_TOOLTIP_STYLE}
                  labelStyle={CHART_TOOLTIP_LABEL_STYLE}
                  itemStyle={CHART_TOOLTIP_ITEM_STYLE}
                  formatter={(value) => [`${value ?? 0}`, 'Certificados']}
                />
                <Bar dataKey="certificados" fill={CHART_PRIMARY} radius={[0, 4, 4, 0]} maxBarSize={28} animationDuration={CHART_ANIM_MS} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard icon={PieIcon} title="Nivel de discapacidad" subtitle="Severidad certificada">
          {chartData.disabilityLevelData.length === 0 ? (
            <ChartEmpty />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={chartData.disabilityLevelData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => {
                    const name = entry.name || '';
                    const shortName = name.split('(')[0].trim();
                    return `${shortName}: ${((entry.percent ?? 0) * 100).toFixed(0)}%`;
                  }}
                  outerRadius={95}
                  innerRadius={52}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="var(--surface)"
                  strokeWidth={2}
                  animationDuration={CHART_ANIM_MS}
                >
                  {chartData.disabilityLevelData.map((entry, index) => (
                    <Cell key={entry.name} fill={CHART_CATEGORICAL[index % CHART_CATEGORICAL.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  labelStyle={CHART_TOOLTIP_LABEL_STYLE}
                  itemStyle={CHART_TOOLTIP_ITEM_STYLE}
                  formatter={(value) => [`${value ?? 0} certificados`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Tendencia mensual */}
      <ChartCard icon={TrendingUp} title="Tendencia mensual" subtitle="Certificados cargados por mes">
        {chartData.monthlyData.length === 0 ? (
          <ChartEmpty />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData.monthlyData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
              <XAxis dataKey="mes" tick={CHART_TICK} tickLine={false} axisLine={{ stroke: CHART_GRID }} />
              <YAxis tick={CHART_TICK} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                labelStyle={CHART_TOOLTIP_LABEL_STYLE}
                itemStyle={CHART_TOOLTIP_ITEM_STYLE}
                formatter={(value) => [`${value ?? 0}`, 'Certificados']}
              />
              <Line
                type="monotone"
                dataKey="certificados"
                stroke={CHART_PRIMARY}
                strokeWidth={2.5}
                dot={{ fill: CHART_PRIMARY, r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: CHART_PRIMARY, stroke: 'var(--surface)', strokeWidth: 2 }}
                animationDuration={CHART_ANIM_MS}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}

/** KPI card — mismo patrón que el inicio: icono en tile teñido + número tabular. */
function KpiCard({
  icon: Icon,
  label,
  value,
  suffix,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--fg-subtle)]">{label}</p>
        <p className="mt-1 text-3xl font-semibold tabular-nums text-[var(--fg)]">
          {value}
          {suffix && <span className="ml-1 text-base font-normal text-[var(--fg-muted)]">{suffix}</span>}
        </p>
      </div>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-50)] text-[var(--primary-700)]">
        <Icon className="size-5" />
      </span>
    </div>
  );
}

/** Contenedor de gráfico con header consistente (icono + título + subtítulo). */
function ChartCard({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)]">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-md bg-[var(--primary-50)] text-[var(--primary-700)]">
          <Icon className="size-4" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-[var(--fg)]">{title}</h3>
          <p className="text-xs text-[var(--fg-subtle)]">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function ChartEmpty() {
  return (
    <div className="flex h-[280px] flex-col items-center justify-center gap-2 text-center">
      <BarChart3 className="size-8 text-[var(--fg-subtle)]" aria-hidden />
      <p className="text-sm text-[var(--fg-muted)]">Sin datos suficientes para este gráfico.</p>
    </div>
  );
}
