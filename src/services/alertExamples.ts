/**
 * SISTEMA DE ALERTAS CLÍNICAS - EJEMPLOS Y CASOS DE USO
 * 
 * Este archivo demuestra cómo usar el sistema de alertas según diferentes roles
 */

import { alertService } from './alertService';
import { ClinicalMetric } from '@/types';

// ============================================
// MÉTRICAS DE EJEMPLO
// ============================================

const metricasEjemplo: ClinicalMetric[] = [
  // Métrica normal - no genera alerta
  {
    id: 'metric-001',
    patientId: 'patient-001',
    metricType: 'presion_arterial',
    value: 120,
    unit: 'mmHg',
    status: 'normal',
    timestamp: new Date().toISOString(),
    registeredBy: 'admin-001'
  },
  
  // Métrica en advertencia
  {
    id: 'metric-002',
    patientId: 'patient-002',
    metricType: 'glucosa',
    value: 145,
    unit: 'mg/dL',
    status: 'warning',
    timestamp: new Date().toISOString(),
    registeredBy: 'admin-001',
    notes: 'Paciente en ayunas, valor ligeramente elevado'
  },
  
  // Métrica crítica
  {
    id: 'metric-003',
    patientId: 'patient-003',
    metricType: 'saturacion_oxigeno',
    value: 88,
    unit: '%',
    status: 'critical',
    timestamp: new Date().toISOString(),
    registeredBy: 'admin-002',
    notes: 'Paciente con dificultad respiratoria'
  },
  
  // Otra métrica crítica del mismo admin
  {
    id: 'metric-004',
    patientId: 'patient-004',
    metricType: 'presion_arterial',
    value: 180,
    unit: 'mmHg',
    status: 'critical',
    timestamp: new Date().toISOString(),
    registeredBy: 'admin-002',
    notes: 'Hipertensión severa, paciente con cefalea'
  }
];

// ============================================
// CASO 1: ALERTAS PARA USUARIO (PACIENTE)
// ============================================

console.log('\n=== ALERTAS PARA USUARIO (PACIENTE) ===\n');

const alertasUsuario = alertService.generateAlertsFromMetrics(
  [metricasEjemplo[1]], // Solo glucosa en warning
  'user',
  'patient-002'
);

alertasUsuario.forEach(alert => {
  console.log(`
📋 ALERTA PARA PACIENTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nivel: ${alert.nivelGravedad.toUpperCase()}
Título: ${alert.titulo}
Descripción: ${alert.descripcion}
Acción Sugerida: ${alert.accionSugerida}
Fecha: ${new Date(alert.fecha).toLocaleString('es-AR')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});

// ============================================
// CASO 2: ALERTAS PARA ADMIN
// ============================================

console.log('\n=== ALERTAS PARA ADMIN ===\n');

const alertasAdmin = alertService.generateAlertsFromMetrics(
  metricasEjemplo.slice(1), // Glucosa (warning) y métricas críticas
  'admin',
  'admin-002'
);

alertasAdmin.forEach(alert => {
  console.log(`
🏥 ALERTA PARA ADMINISTRADOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nivel: ${alert.nivelGravedad.toUpperCase()}
Título: ${alert.titulo}
Paciente: ${alert.paciente?.nombre} (${alert.paciente?.id})
Descripción: ${alert.descripcion}
Acción Sugerida: ${alert.accionSugerida}
Fecha: ${new Date(alert.fecha).toLocaleString('es-AR')}
${alert.escalada ? `⚠️ ESCALADA: ${alert.motivoEscalamiento}` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});

// ============================================
// CASO 3: ALERTAS PARA SUPERADMIN
// ============================================

console.log('\n=== ALERTAS PARA SUPERADMIN ===\n');

const alertasSuperadmin = alertService.generateAlertsFromMetrics(
  metricasEjemplo.slice(2), // Solo métricas críticas
  'superadmin',
  'superadmin-001',
  'admin-002'
);

alertasSuperadmin.forEach(alert => {
  console.log(`
🚨 ALERTA CRÍTICA SISTÉMICA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nivel: ${alert.nivelGravedad.toUpperCase()}
Título: ${alert.titulo}
Paciente: ${alert.paciente?.nombre} (${alert.paciente?.id})
Admin Responsable: ${alert.adminRelacionado?.nombre} (${alert.adminRelacionado?.id})
Descripción: ${alert.descripcion}
Acción Sugerida: ${alert.accionSugerida}
Fecha: ${new Date(alert.fecha).toLocaleString('es-AR')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});

// ============================================
// CASO 4: ESCALAMIENTO DE ALERTAS
// ============================================

console.log('\n=== ESCALAMIENTO DE ALERTAS (SIN ACCIÓN) ===\n');

// Simular que pasaron 25 horas sin acción
const alertasEscaladas = alertService.escalateAlerts(0.001); // threshold muy bajo para demo

alertasEscaladas.forEach(alert => {
  console.log(`
⚡ ALERTA ESCALADA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ID: ${alert.id}
Nivel Original → Nuevo: ${alert.nivelGravedad}
Motivo Escalamiento: ${alert.motivoEscalamiento}
Título: ${alert.titulo}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});

// ============================================
// CASO 5: REGISTRO DE ACCIÓN
// ============================================

console.log('\n=== REGISTRO DE ACCIÓN SOBRE ALERTA ===\n');

const alertaParaAccion = alertasAdmin[0];
if (alertaParaAccion) {
  const accionRegistrada = alertService.registerAction(
    alertaParaAccion.id,
    'admin-002',
    'Se contactó al paciente. Programada consulta presencial para mañana 9:00hs. Se ajustó medicación según protocolo.'
  );

  if (accionRegistrada) {
    console.log(`
✅ ACCIÓN REGISTRADA EXITOSAMENTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Alerta: ${alertaParaAccion.id}
Acción: ${alertaParaAccion.accionTomada?.descripcion}
Responsable: ${alertaParaAccion.accionTomada?.usuarioId}
Fecha: ${alertaParaAccion.accionTomada?.fecha ? new Date(alertaParaAccion.accionTomada.fecha).toLocaleString('es-AR') : ''}
Estado: ${alertaParaAccion.activa ? 'ACTIVA' : 'RESUELTA'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
  }
}

// ============================================
// CASO 6: FILTRADO DE ALERTAS
// ============================================

console.log('\n=== FILTRADO DE ALERTAS ===\n');

// Filtrar solo alertas críticas activas
const alertasCriticas = alertService.filterAlerts({
  nivelGravedad: 'critical',
  activa: true
});

console.log(`📊 Alertas Críticas Activas: ${alertasCriticas.length}`);
alertasCriticas.forEach(alert => {
  console.log(`  - ${alert.titulo} (${alert.paciente?.nombre})`);
});

// Filtrar alertas escaladas
const alertasEscaladasFiltro = alertService.filterAlerts({
  escalada: true
});

console.log(`\n⚡ Alertas Escaladas: ${alertasEscaladasFiltro.length}`);

// ============================================
// RESUMEN GENERAL
// ============================================

console.log('\n=== RESUMEN GENERAL DEL SISTEMA ===\n');

const todasLasAlertas = alertService.getAllAlerts();
const alertasActivas = alertService.getActiveAlerts();

console.log(`
📊 ESTADÍSTICAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total de Alertas: ${todasLasAlertas.length}
Alertas Activas: ${alertasActivas.length}
Alertas Resueltas: ${todasLasAlertas.length - alertasActivas.length}

Por Nivel:
  - Info: ${todasLasAlertas.filter(a => a.nivelGravedad === 'info').length}
  - Warning: ${todasLasAlertas.filter(a => a.nivelGravedad === 'warning').length}
  - Critical: ${todasLasAlertas.filter(a => a.nivelGravedad === 'critical').length}

Por Rol:
  - Usuario: ${todasLasAlertas.filter(a => a.tipoUsuario === 'user').length}
  - Admin: ${todasLasAlertas.filter(a => a.tipoUsuario === 'admin').length}
  - Superadmin: ${todasLasAlertas.filter(a => a.tipoUsuario === 'superadmin').length}

Escaladas: ${todasLasAlertas.filter(a => a.escalada).length}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

// ============================================
// EXPORTAR PARA USO EN LA APLICACIÓN
// ============================================

export {
  alertService,
  metricasEjemplo,
  alertasUsuario,
  alertasAdmin,
  alertasSuperadmin
};
