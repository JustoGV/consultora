'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { alertService } from '@/services/alertService';
import { Alert } from '@/types';
import { 
  BellIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  FunnelIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function AlertsPage() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([]);
  const [filterLevel, setFilterLevel] = useState<'all' | 'info' | 'warning' | 'critical'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'resolved'>('active');
  const [loading, setLoading] = useState(true);

  const loadAlerts = () => {
    setLoading(true);
    
    setTimeout(() => {
      // ALERTAS HARDCODEADAS según el rol del usuario
      let hardcodedAlerts: Alert[] = [];
      const userAdminId = user?.administradoraId || 'admin-consultora'; // Fallback por si no tiene administradora
      
      if (user?.rol === 'user') {
        // Alertas para PACIENTES/USUARIOS - filtradas por su administradora
        hardcodedAlerts = [
          {
            id: 'alert-user-001',
            tipoUsuario: 'user',
            nivelGravedad: 'info',
            administradoraId: userAdminId,
            titulo: '📊 Glucosa fuera del rango recomendado',
            descripcion: 'Tu glucosa registró un valor de 145 mg/dL. Te recomendamos consultar con tu médico para evaluar este resultado.',
            fecha: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            accionSugerida: 'Agenda una consulta con tu médico de cabecera para revisar este resultado.',
            metricaRelacionada: 'metric-001',
            activa: true,
            escalada: false,
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'alert-user-002',
            tipoUsuario: 'user',
            nivelGravedad: 'warning',
            administradoraId: userAdminId,
            titulo: '⚠️ Atención: Presión Arterial requiere seguimiento',
            descripcion: 'Tu presión arterial registró un valor de 140 mmHg. Te recomendamos consultar con tu médico para evaluar este resultado.',
            fecha: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            accionSugerida: 'Contacta a tu médico lo antes posible. Mantén un registro de tus síntomas.',
            metricaRelacionada: 'metric-002',
            activa: true,
            escalada: false,
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'alert-user-003',
            tipoUsuario: 'user',
            nivelGravedad: 'info',
            administradoraId: userAdminId,
            titulo: '📊 Peso dentro del rango esperado',
            descripcion: 'Tu peso se encuentra en 72 kg, dentro del rango saludable para tu altura. Continúa con tus hábitos actuales.',
            fecha: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            accionSugerida: 'Mantén una dieta balanceada y ejercicio regular.',
            activa: false,
            escalada: false,
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            accionTomada: {
              fecha: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              descripcion: 'Paciente informado, seguimiento en próxima consulta',
              usuarioId: user?.id || 'user-001'
            }
          }
        ];
      } else if (user?.rol === 'admin') {
        // Alertas para ADMINISTRADORES - solo de su administradora
        hardcodedAlerts = [
          {
            id: 'alert-admin-001',
            tipoUsuario: 'admin',
            nivelGravedad: 'critical',
            administradoraId: userAdminId,
            titulo: '🚨 CRÍTICO: Saturación de Oxígeno en rango peligroso',
            descripcion: 'Paciente María González presenta saturación de oxígeno en nivel crítico que requiere intervención inmediata. Valor registrado: 88 %. Paciente con dificultad respiratoria reportada.',
            paciente: {
              id: 'patient-003',
              nombre: 'María González',
              documentNumber: '35.789.456'
            },
            fecha: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            accionSugerida: 'ACCIÓN URGENTE: Contactar al paciente inmediatamente. Evaluar derivación a urgencias. Registrar intervención en el sistema.',
            metricaRelacionada: 'metric-003',
            activa: true,
            escalada: false,
            createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'alert-admin-002',
            tipoUsuario: 'admin',
            nivelGravedad: 'critical',
            administradoraId: userAdminId,
            titulo: '🚨 CRÍTICO: Presión Arterial en rango peligroso',
            descripcion: 'Paciente Carlos Martínez presenta presión arterial en nivel crítico que requiere intervención inmediata. Valor registrado: 180 mmHg. Hipertensión severa, paciente con cefalea intensa.',
            paciente: {
              id: 'patient-002',
              nombre: 'Carlos Martínez',
              documentNumber: '28.456.789'
            },
            fecha: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            accionSugerida: 'ACCIÓN URGENTE: Contactar al paciente inmediatamente. Evaluar derivación a urgencias. Registrar intervención en el sistema.',
            metricaRelacionada: 'metric-002',
            activa: true,
            escalada: true,
            motivoEscalamiento: 'Sin acción registrada durante 5 horas',
            createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'alert-admin-003',
            tipoUsuario: 'admin',
            nivelGravedad: 'warning',
            administradoraId: userAdminId,
            titulo: '⚠️ Advertencia: Glucosa fuera de rango',
            descripcion: 'Paciente Ana López presenta glucosa fuera del rango normal que requiere seguimiento. Valor registrado: 145 mg/dL. Paciente en ayunas, valor ligeramente elevado.',
            paciente: {
              id: 'patient-001',
              nombre: 'Ana López',
              documentNumber: '42.123.456'
            },
            fecha: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            accionSugerida: 'Programar consulta de seguimiento en las próximas 48hs. Solicitar nuevas métricas. Revisar tratamiento actual.',
            metricaRelacionada: 'metric-001',
            activa: true,
            escalada: false,
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'alert-admin-004',
            tipoUsuario: 'admin',
            nivelGravedad: 'warning',
            administradoraId: userAdminId,
            titulo: '⚠️ Advertencia: Falta de registro de métricas',
            descripcion: 'Paciente Roberto Sánchez no ha registrado métricas en los últimos 7 días. Se requiere contacto para verificar estado y programar nueva medición.',
            paciente: {
              id: 'patient-004',
              nombre: 'Roberto Sánchez',
              documentNumber: '31.987.654'
            },
            fecha: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            accionSugerida: 'Contactar al paciente para verificar su estado. Programar cita para nuevas mediciones.',
            activa: true,
            escalada: false,
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'alert-admin-005',
            tipoUsuario: 'admin',
            nivelGravedad: 'warning',
            administradoraId: userAdminId,
            titulo: '⚠️ Advertencia: Colesterol elevado',
            descripcion: 'Paciente Laura Fernández presenta colesterol fuera del rango normal. Valor registrado: 245 mg/dL. Requiere ajuste en dieta y posible medicación.',
            paciente: {
              id: 'patient-005',
              nombre: 'Laura Fernández',
              documentNumber: '39.654.321'
            },
            fecha: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            accionSugerida: 'Programar consulta nutricional. Evaluar inicio de tratamiento farmacológico.',
            activa: false,
            escalada: false,
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            accionTomada: {
              fecha: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              descripcion: 'Paciente contactada. Programada consulta con nutricionista para el próximo lunes. Se solicitaron estudios complementarios.',
              usuarioId: user?.id || 'admin-001'
            }
          }
        ];
      } else if (user?.rol === 'superadmin') {
        // Alertas para SUPERADMINISTRADOR - SOLO CRÍTICAS de TODAS las administradoras
        hardcodedAlerts = [
          {
            id: 'alert-super-001',
            tipoUsuario: 'superadmin',
            nivelGravedad: 'critical',
            administradoraId: 'admin-jerarquicos', // Jerárquicos Salud
            titulo: '🚨 Alerta Crítica Sistémica: Saturación de Oxígeno',
            descripcion: 'Se detectó una métrica crítica sin intervención del administrador. Paciente María González con saturación de oxígeno en 88 %. Requiere acción inmediata del admin responsable.',
            paciente: {
              id: 'patient-003',
              nombre: 'María González',
              documentNumber: '35.789.456'
            },
            adminRelacionado: {
              id: 'admin-jerarquicos',
              nombre: 'Admin Jerárquicos Salud'
            },
            fecha: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            accionSugerida: 'Contactar al administrador responsable inmediatamente. Verificar protocolo de emergencia. Asegurar que se haya iniciado intervención.',
            metricaRelacionada: 'metric-003',
            activa: true,
            escalada: false,
            createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'alert-super-002',
            tipoUsuario: 'superadmin',
            nivelGravedad: 'critical',
            administradoraId: 'admin-jerarquicos', // Jerárquicos Salud
            titulo: '🚨 Alerta Crítica Sistémica: Múltiples pacientes en riesgo',
            descripcion: 'Se detectaron 3 pacientes con métricas críticas en la última hora sin registro de intervención. Administrador responsable no ha tomado acción sobre ninguna alerta.',
            adminRelacionado: {
              id: 'admin-jerarquicos',
              nombre: 'Admin Jerárquicos Salud'
            },
            fecha: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            accionSugerida: 'Contactar al administrador inmediatamente. Verificar disponibilidad del personal. Activar protocolo de emergencia si es necesario.',
            activa: true,
            escalada: true,
            motivoEscalamiento: 'Sin acción registrada durante 6 horas en múltiples alertas críticas',
            createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'alert-super-003',
            tipoUsuario: 'superadmin',
            nivelGravedad: 'critical',
            administradoraId: 'admin-jerarquicos', // Jerárquicos Salud
            titulo: '🚨 Alerta Crítica Sistémica: Presión Arterial',
            descripcion: 'Se detectó métrica crítica sin intervención. Paciente Carlos Martínez con presión arterial en 180 mmHg. Admin no ha registrado contacto con el paciente.',
            paciente: {
              id: 'patient-002',
              nombre: 'Carlos Martínez',
              documentNumber: '28.456.789'
            },
            adminRelacionado: {
              id: 'admin-jerarquicos',
              nombre: 'Admin Jerárquicos Salud'
            },
            fecha: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            accionSugerida: 'Contactar al administrador responsable. Verificar que se haya realizado derivación o contacto con el paciente.',
            activa: true,
            escalada: true,
            motivoEscalamiento: 'Sin acción registrada durante 5 horas',
            createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'alert-super-004',
            tipoUsuario: 'superadmin',
            nivelGravedad: 'critical',
            administradoraId: 'admin-osde', // OSDE
            titulo: '🚨 Alerta Crítica Sistémica: Fallo en protocolo de emergencia',
            descripcion: 'Sistema detectó que el admin responsable no ha seguido el protocolo de emergencia para 2 pacientes críticos. Se requiere supervisión inmediata.',
            adminRelacionado: {
              id: 'admin-osde',
              nombre: 'Admin OSDE'
            },
            fecha: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            accionSugerida: 'Revisar acciones del administrador. Verificar cumplimiento de protocolos. Considerar escalamiento a dirección médica.',
            activa: false,
            escalada: false,
            createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            accionTomada: {
              fecha: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
              descripcion: 'Reunión realizada con el administrador. Protocolo de emergencia revisado. Se programó capacitación para todo el equipo administrativo.',
              usuarioId: user?.id || 'superadmin-001'
            }
          },
          {
            id: 'alert-super-005',
            tipoUsuario: 'superadmin',
            nivelGravedad: 'critical',
            administradoraId: 'admin-consultora', // Consultora
            titulo: '🚨 Alerta Crítica Sistémica: Paciente con arritmia severa',
            descripcion: 'Paciente Juan Pérez presenta arritmia cardíaca crítica. Frecuencia cardíaca irregular de 165 lpm. Admin no ha registrado derivación a cardiología.',
            paciente: {
              id: 'patient-006',
              nombre: 'Juan Pérez',
              documentNumber: '27.654.987'
            },
            adminRelacionado: {
              id: 'admin-consultora',
              nombre: 'Admin Consultora Salud'
            },
            fecha: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            accionSugerida: 'Contactar urgente al administrador. Verificar si se realizó derivación a servicio de emergencias cardiovasculares.',
            metricaRelacionada: 'metric-006',
            activa: true,
            escalada: false,
            createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
          }
        ];
      }

      // Filtrar alertas por administradora del usuario (excepto superadmin que ve todas)
      const alertasFiltradas = user?.rol === 'superadmin' 
        ? hardcodedAlerts // Superadmin ve TODAS las alertas críticas
        : hardcodedAlerts.filter(alert => alert.administradoraId === user?.administradoraId);

      setAlerts(alertasFiltradas);
      setLoading(false);
    }, 500);
  };

  const applyFilters = () => {
    let filtered = [...alerts];

    // Filtrar por nivel
    if (filterLevel !== 'all') {
      filtered = filtered.filter(alert => alert.nivelGravedad === filterLevel);
    }

    // Filtrar por estado
    if (filterStatus === 'active') {
      filtered = filtered.filter(alert => alert.activa);
    } else if (filterStatus === 'resolved') {
      filtered = filtered.filter(alert => !alert.activa);
    }

    setFilteredAlerts(filtered);
  };

  useEffect(() => {
    loadAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alerts, filterLevel, filterStatus]);

  const handleResolveAlert = (alertId: string) => {
    const success = alertService.registerAction(
      alertId,
      user?.id || '',
      'Alerta revisada y acción tomada desde el dashboard'
    );

    if (success) {
      loadAlerts();
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'critical':
        return <XCircleIcon className="w-6 h-6 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-6 h-6 text-amber-500" />;
      case 'info':
        return <BellIcon className="w-6 h-6 text-blue-500" />;
      default:
        return <BellIcon className="w-6 h-6 text-gray-500" />;
    }
  };

  const getLevelBadgeClass = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAlertCardClass = (level: string, escalada: boolean) => {
    const base = 'premium-card p-6 border-l-4 transition-all hover:shadow-lg';
    if (escalada) return `${base} border-red-600 bg-red-50`;
    
    switch (level) {
      case 'critical':
        return `${base} border-red-500`;
      case 'warning':
        return `${base} border-amber-500`;
      case 'info':
        return `${base} border-blue-500`;
      default:
        return `${base} border-gray-300`;
    }
  };

  const getRoleName = (rol: string) => {
    switch (rol) {
      case 'superadmin':
        return '🛡️ Superadministrador';
      case 'admin':
        return '👑 Administrador';
      case 'user':
        return '👤 Paciente';
      default:
        return rol;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
            Alertas Clínicas
          </h1>
          <p className="text-neutral-600 mt-2">
            {user?.rol === 'user' && 'Notificaciones sobre tus métricas de salud'}
            {user?.rol === 'admin' && 'Alertas de tus pacientes que requieren atención'}
            {user?.rol === 'superadmin' && 'Alertas críticas sistémicas que requieren supervisión'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-600">
            {getRoleName(user?.rol || '')}
          </span>
          <button
            onClick={loadAlerts}
            className="btn-primary flex items-center gap-2"
          >
            <BellIcon className="w-5 h-5" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="premium-card p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-5 h-5 text-neutral-500" />
            <span className="text-sm font-semibold text-neutral-700">Filtros:</span>
          </div>

          {/* Filtro por nivel */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilterLevel('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filterLevel === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilterLevel('critical')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filterLevel === 'critical'
                  ? 'bg-red-600 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              Críticas
            </button>
            <button
              onClick={() => setFilterLevel('warning')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filterLevel === 'warning'
                  ? 'bg-amber-600 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              Advertencias
            </button>
            <button
              onClick={() => setFilterLevel('info')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filterLevel === 'info'
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              Info
            </button>
          </div>

          {/* Filtro por estado */}
          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filterStatus === 'active'
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              Activas
            </button>
            <button
              onClick={() => setFilterStatus('resolved')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filterStatus === 'resolved'
                  ? 'bg-green-600 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              Resueltas
            </button>
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filterStatus === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              Todas
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="premium-card p-4 bg-gradient-to-br from-blue-50 to-blue-100">
          <p className="text-sm font-medium text-blue-800">Total Alertas</p>
          <p className="text-2xl font-bold text-blue-900 mt-1">{alerts.length}</p>
        </div>
        <div className="premium-card p-4 bg-gradient-to-br from-red-50 to-red-100">
          <p className="text-sm font-medium text-red-800">Críticas</p>
          <p className="text-2xl font-bold text-red-900 mt-1">
            {alerts.filter(a => a.nivelGravedad === 'critical' && a.activa).length}
          </p>
        </div>
        <div className="premium-card p-4 bg-gradient-to-br from-amber-50 to-amber-100">
          <p className="text-sm font-medium text-amber-800">Advertencias</p>
          <p className="text-2xl font-bold text-amber-900 mt-1">
            {alerts.filter(a => a.nivelGravedad === 'warning' && a.activa).length}
          </p>
        </div>
        <div className="premium-card p-4 bg-gradient-to-br from-green-50 to-green-100">
          <p className="text-sm font-medium text-green-800">Resueltas</p>
          <p className="text-2xl font-bold text-green-900 mt-1">
            {alerts.filter(a => !a.activa).length}
          </p>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="premium-card p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="text-neutral-600 mt-4">Cargando alertas...</p>
        </div>
      ) : (
        <>
          {/* Lista de Alertas */}
          {filteredAlerts.length === 0 ? (
            <div className="premium-card p-12 text-center">
              <BellIcon className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-500 text-lg font-medium">No hay alertas para mostrar</p>
              <p className="text-neutral-400 text-sm mt-2">
                {filterStatus === 'active' ? 'No tienes alertas activas en este momento' : 'Ajusta los filtros para ver más resultados'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAlerts.map((alert) => (
                <div key={alert.id} className={getAlertCardClass(alert.nivelGravedad, alert.escalada)}>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getLevelIcon(alert.nivelGravedad)}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-neutral-900">
                            {alert.titulo}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getLevelBadgeClass(alert.nivelGravedad)}`}>
                              {alert.nivelGravedad.toUpperCase()}
                            </span>
                            {alert.escalada && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                ⚡ ESCALADA
                              </span>
                            )}
                            {!alert.activa && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                ✓ RESUELTA
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-neutral-500">
                          <ClockIcon className="w-4 h-4" />
                          {new Date(alert.fecha).toLocaleString('es-AR')}
                        </div>
                      </div>

                      {/* Descripción */}
                      <p className="text-neutral-700 mb-4">{alert.descripcion}</p>

                      {/* Paciente, Admin y Administradora (si aplica) */}
                      {(alert.paciente || alert.adminRelacionado || user?.rol === 'superadmin') && (
                        <div className="flex gap-4 mb-4 text-sm flex-wrap">
                          {alert.paciente && (
                            <div className="flex items-center gap-2 bg-neutral-50 px-3 py-2 rounded-lg">
                              <span className="font-medium text-neutral-700">Paciente:</span>
                              <span className="text-neutral-900">{alert.paciente.nombre}</span>
                              {alert.paciente.documentNumber && (
                                <span className="text-neutral-500">({alert.paciente.documentNumber})</span>
                              )}
                            </div>
                          )}
                          {alert.adminRelacionado && (
                            <div className="flex items-center gap-2 bg-neutral-50 px-3 py-2 rounded-lg">
                              <span className="font-medium text-neutral-700">Admin:</span>
                              <span className="text-neutral-900">{alert.adminRelacionado.nombre}</span>
                            </div>
                          )}
                          {user?.rol === 'superadmin' && (
                            <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                              <span className="font-medium text-blue-700">Administradora:</span>
                              <span className="text-blue-900 font-semibold">
                                {alert.administradoraId === 'admin-jerarquicos' && 'Jerárquicos Salud'}
                                {alert.administradoraId === 'admin-osde' && 'OSDE'}
                                {alert.administradoraId === 'admin-consultora' && 'Consultora Salud'}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Motivo de Escalamiento */}
                      {alert.motivoEscalamiento && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                          <p className="text-sm font-semibold text-red-800">
                            ⚠️ Motivo de Escalamiento: {alert.motivoEscalamiento}
                          </p>
                        </div>
                      )}

                      {/* Acción Sugerida */}
                      <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 mb-4">
                        <p className="text-sm font-semibold text-primary-800 mb-1">💡 Acción Sugerida:</p>
                        <p className="text-sm text-primary-700">{alert.accionSugerida}</p>
                      </div>

                      {/* Acción Tomada */}
                      {alert.accionTomada && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                          <p className="text-sm font-semibold text-green-800 mb-1">✓ Acción Registrada:</p>
                          <p className="text-sm text-green-700">{alert.accionTomada.descripcion}</p>
                          <p className="text-xs text-green-600 mt-1">
                            Por {alert.accionTomada.usuarioId} el {new Date(alert.accionTomada.fecha).toLocaleString('es-AR')}
                          </p>
                        </div>
                      )}

                      {/* Acciones */}
                      {alert.activa && user?.rol !== 'user' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleResolveAlert(alert.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                          >
                            <CheckCircleIcon className="w-4 h-4" />
                            Marcar como Resuelta
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
