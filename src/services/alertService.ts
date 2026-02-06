import { 
  Alert, 
  AlertLevel, 
  ClinicalMetric, 
  UserRole,
  AlertFilters
} from '@/types';

/**
 * Servicio de generación y gestión de alertas clínicas
 * Genera alertas según métricas, umbrales y roles de usuario
 */
class AlertService {
  private alerts: Alert[] = [];
  private alertIdCounter = 1;

  /**
   * Genera alertas basadas en métricas clínicas
   */
  generateAlertsFromMetrics(
    metrics: ClinicalMetric[],
    userRole: UserRole,
    userId: string,
    adminId?: string,
    administradoraId?: string
  ): Alert[] {
    const newAlerts: Alert[] = [];

    for (const metric of metrics) {
      // Evitar duplicados
      if (this.isDuplicateAlert(metric.id)) {
        continue;
      }

      const alert = this.createAlertFromMetric(metric, userRole, userId, adminId, administradoraId);
      if (alert) {
        newAlerts.push(alert);
        this.alerts.push(alert);
      }
    }

    return newAlerts;
  }

  /**
   * Crea una alerta según el tipo de métrica y rol del usuario
   */
  private createAlertFromMetric(
    metric: ClinicalMetric,
    userRole: UserRole,
    userId: string,
    adminId?: string,
    administradoraId?: string
  ): Alert | null {
    const alertId = `alert-${this.alertIdCounter++}`;
    const now = new Date().toISOString();

    switch (userRole) {
      case 'user':
        return this.generateUserAlert(alertId, metric, now, administradoraId || 'admin-consultora');
      
      case 'admin':
        return this.generateAdminAlert(alertId, metric, userId, now, administradoraId || 'admin-consultora');
      
      case 'superadmin':
        return this.generateSuperadminAlert(alertId, metric, adminId, now, administradoraId || 'admin-consultora');
      
      default:
        return null;
    }
  }

  /**
   * Genera alertas para pacientes (usuarios)
   */
  private generateUserAlert(
    alertId: string,
    metric: ClinicalMetric,
    timestamp: string,
    administradoraId: string
  ): Alert | null {
    // Solo alertas informativas o preventivas para usuarios
    if (metric.status === 'normal') {
      return null; // No generar alerta si está normal
    }

    const nivel: AlertLevel = metric.status === 'warning' ? 'info' : 'warning';
    
    return {
      id: alertId,
      tipoUsuario: 'user',
      nivelGravedad: nivel,
      administradoraId: administradoraId,
      titulo: this.getUserAlertTitle(metric),
      descripcion: this.getUserAlertDescription(metric),
      fecha: timestamp,
      accionSugerida: this.getUserActionSuggestion(metric),
      metricaRelacionada: metric.id,
      activa: true,
      escalada: false,
      createdAt: timestamp
    };
  }

  /**
   * Genera alertas para administradores
   */
  private generateAdminAlert(
    alertId: string,
    metric: ClinicalMetric,
    adminId: string,
    timestamp: string,
    administradoraId: string
  ): Alert | null {
    // Solo métricas de advertencia o críticas
    if (metric.status === 'normal') {
      return null;
    }

    const nivel: AlertLevel = metric.status === 'warning' ? 'warning' : 'critical';

    return {
      id: alertId,
      tipoUsuario: 'admin',
      nivelGravedad: nivel,
      administradoraId: administradoraId,
      titulo: this.getAdminAlertTitle(metric),
      descripcion: this.getAdminAlertDescription(metric),
      paciente: {
        id: metric.patientId,
        nombre: 'Paciente ' + metric.patientId.substring(0, 8)
      },
      fecha: timestamp,
      accionSugerida: this.getAdminActionSuggestion(metric),
      metricaRelacionada: metric.id,
      activa: true,
      escalada: false,
      createdAt: timestamp
    };
  }

  /**
   * Genera alertas para superadministradores
   */
  private generateSuperadminAlert(
    alertId: string,
    metric: ClinicalMetric,
    adminId: string | undefined,
    timestamp: string,
    administradoraId: string
  ): Alert | null {
    // Solo alertas críticas para superadmin
    if (metric.status !== 'critical') {
      return null;
    }

    return {
      id: alertId,
      tipoUsuario: 'superadmin',
      nivelGravedad: 'critical',
      administradoraId: administradoraId,
      titulo: `⚠️ Alerta Crítica Sistémica: ${this.getMetricTypeName(metric.metricType)}`,
      descripcion: `Se detectó una métrica crítica sin intervención del administrador. Paciente ${metric.patientId} con ${metric.metricType} en ${metric.value} ${metric.unit}. Requiere acción inmediata.`,
      paciente: {
        id: metric.patientId,
        nombre: 'Paciente ' + metric.patientId.substring(0, 8)
      },
      adminRelacionado: adminId ? {
        id: adminId,
        nombre: 'Admin ' + adminId.substring(0, 8)
      } : undefined,
      fecha: timestamp,
      accionSugerida: 'Contactar al administrador responsable inmediatamente. Verificar protocolo de emergencia.',
      metricaRelacionada: metric.id,
      activa: true,
      escalada: false,
      createdAt: timestamp
    };
  }

  /**
   * Escala alertas que no han tenido acción
   */
  escalateAlerts(hoursThreshold: number = 24): Alert[] {
    const now = new Date();
    const escalatedAlerts: Alert[] = [];

    for (const alert of this.alerts) {
      if (!alert.activa || alert.escalada || alert.accionTomada) {
        continue;
      }

      const alertDate = new Date(alert.fecha);
      const hoursDiff = (now.getTime() - alertDate.getTime()) / (1000 * 60 * 60);

      if (hoursDiff >= hoursThreshold) {
        alert.escalada = true;
        alert.motivoEscalamiento = `Sin acción registrada durante ${Math.floor(hoursDiff)} horas`;
        alert.nivelGravedad = this.escalateLevel(alert.nivelGravedad);
        alert.updatedAt = now.toISOString();
        escalatedAlerts.push(alert);
      }
    }

    return escalatedAlerts;
  }

  /**
   * Registra una acción tomada sobre una alerta
   */
  registerAction(
    alertId: string,
    usuarioId: string,
    descripcion: string
  ): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return false;

    alert.accionTomada = {
      fecha: new Date().toISOString(),
      descripcion,
      usuarioId
    };
    alert.activa = false;
    alert.updatedAt = new Date().toISOString();

    return true;
  }

  /**
   * Filtra alertas según criterios
   */
  filterAlerts(filters: AlertFilters): Alert[] {
    return this.alerts.filter(alert => {
      if (filters.tipoUsuario && alert.tipoUsuario !== filters.tipoUsuario) return false;
      if (filters.nivelGravedad && alert.nivelGravedad !== filters.nivelGravedad) return false;
      if (filters.activa !== undefined && alert.activa !== filters.activa) return false;
      if (filters.escalada !== undefined && alert.escalada !== filters.escalada) return false;
      if (filters.pacienteId && alert.paciente?.id !== filters.pacienteId) return false;
      if (filters.adminRelacionadoId && alert.adminRelacionado?.id !== filters.adminRelacionadoId) return false;
      
      if (filters.fechaDesde) {
        if (new Date(alert.fecha) < new Date(filters.fechaDesde)) return false;
      }
      if (filters.fechaHasta) {
        if (new Date(alert.fecha) > new Date(filters.fechaHasta)) return false;
      }

      return true;
    });
  }

  /**
   * Obtiene todas las alertas
   */
  getAllAlerts(): Alert[] {
    return [...this.alerts];
  }

  /**
   * Obtiene alertas activas
   */
  getActiveAlerts(): Alert[] {
    return this.alerts.filter(a => a.activa);
  }

  /**
   * Verifica si ya existe una alerta similar activa
   */
  private isDuplicateAlert(metricId: string): boolean {
    return this.alerts.some(
      alert => 
        alert.activa && 
        alert.metricaRelacionada === metricId &&
        !alert.accionTomada
    );
  }

  /**
   * Escala el nivel de gravedad
   */
  private escalateLevel(currentLevel: AlertLevel): AlertLevel {
    if (currentLevel === 'info') return 'warning';
    if (currentLevel === 'warning') return 'critical';
    return 'critical';
  }

  /**
   * Genera título para alerta de usuario
   */
  private getUserAlertTitle(metric: ClinicalMetric): string {
    const metricName = this.getMetricTypeName(metric.metricType);
    if (metric.status === 'warning') {
      return `📊 ${metricName} fuera del rango recomendado`;
    }
    return `⚠️ Atención: ${metricName} requiere seguimiento`;
  }

  /**
   * Genera descripción para alerta de usuario
   */
  private getUserAlertDescription(metric: ClinicalMetric): string {
    const metricName = this.getMetricTypeName(metric.metricType);
    return `Tu ${metricName.toLowerCase()} registró un valor de ${metric.value} ${metric.unit}. Te recomendamos consultar con tu médico para evaluar este resultado.`;
  }

  /**
   * Genera acción sugerida para usuario
   */
  private getUserActionSuggestion(metric: ClinicalMetric): string {
    if (metric.status === 'warning') {
      return 'Agenda una consulta con tu médico de cabecera para revisar este resultado.';
    }
    return 'Contacta a tu médico lo antes posible. Mantén un registro de tus síntomas.';
  }

  /**
   * Genera título para alerta de admin
   */
  private getAdminAlertTitle(metric: ClinicalMetric): string {
    const metricName = this.getMetricTypeName(metric.metricType);
    if (metric.status === 'critical') {
      return `🚨 CRÍTICO: ${metricName} en rango peligroso`;
    }
    return `⚠️ Advertencia: ${metricName} fuera de rango`;
  }

  /**
   * Genera descripción para alerta de admin
   */
  private getAdminAlertDescription(metric: ClinicalMetric): string {
    const metricName = this.getMetricTypeName(metric.metricType);
    const severityText = metric.status === 'critical' 
      ? 'en nivel crítico que requiere intervención inmediata'
      : 'fuera del rango normal que requiere seguimiento';

    return `Paciente ${metric.patientId.substring(0, 8)} presenta ${metricName.toLowerCase()} ${severityText}. Valor registrado: ${metric.value} ${metric.unit}. ${metric.notes || 'Sin observaciones adicionales.'}`;
  }

  /**
   * Genera acción sugerida para admin
   */
  private getAdminActionSuggestion(metric: ClinicalMetric): string {
    if (metric.status === 'critical') {
      return 'ACCIÓN URGENTE: Contactar al paciente inmediatamente. Evaluar derivación a urgencias. Registrar intervención en el sistema.';
    }
    return 'Programar consulta de seguimiento en las próximas 48hs. Solicitar nuevas métricas. Revisar tratamiento actual.';
  }

  /**
   * Obtiene nombre legible del tipo de métrica
   */
  private getMetricTypeName(metricType: string): string {
    const names: Record<string, string> = {
      'presion_arterial': 'Presión Arterial',
      'glucosa': 'Glucosa',
      'peso': 'Peso',
      'temperatura': 'Temperatura',
      'frecuencia_cardiaca': 'Frecuencia Cardíaca',
      'saturacion_oxigeno': 'Saturación de Oxígeno',
      'colesterol': 'Colesterol',
      'trigliceridos': 'Triglicéridos'
    };

    return names[metricType] || metricType.replace(/_/g, ' ').toUpperCase();
  }
}

export const alertService = new AlertService();
