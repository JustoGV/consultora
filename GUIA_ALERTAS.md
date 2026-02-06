# 🔔 Sistema de Alertas - Guía de Acceso

## 📍 Cómo acceder a las alertas

### Para todos los usuarios:

1. **Inicia sesión** en el sistema
2. En el **menú lateral izquierdo** (Sidebar), encontrarás la opción **"Alertas"** con un ícono de campana 🔔
3. Haz clic en **"Alertas"** para acceder a tu panel personalizado

### Ubicación visual:
```
┌─────────────────────────┐
│ Consultora Salud        │
│ Sistema de Gestión      │
├─────────────────────────┤
│ Usuario / Admin / Super │
├─────────────────────────┤
│ ▶ Inicio                │
│ 🔔 Alertas  ← AQUÍ      │
│   Métricas              │
│   Pacientes             │
│   Certificados          │
│   ...                   │
└─────────────────────────┘
```

## 👥 Vistas por Rol de Usuario

### 👤 **Usuario (Paciente)**

**Ubicación:** `/dashboard/alerts`

**Qué verás:**
- ✅ Solo tus alertas personales de salud
- 📊 Alertas informativas y preventivas
- 💡 Recomendaciones claras (no alarmistas)
- 📈 Seguimiento de tus métricas

**Ejemplo:**
```
📊 Glucosa fuera del rango recomendado
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INFO | Hace 2 horas

Tu glucosa registró un valor de 145 mg/dL. 
Te recomendamos consultar con tu médico para 
evaluar este resultado.

💡 Acción Sugerida:
Agenda una consulta con tu médico de cabecera
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### 👑 **Admin (Administrador)**

**Ubicación:** `/dashboard/alerts`

**Qué verás:**
- ✅ Alertas de **todos tus pacientes**
- ⚠️ Advertencias y alertas críticas
- 📋 Información detallada del paciente
- 🎯 Acciones sugeridas específicas
- ✓ Opción de marcar como resuelta

**Ejemplo:**
```
🚨 CRÍTICO: Presión Arterial en rango peligroso
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL | Hace 5 horas

Paciente: Juan Pérez (ID: patient-002)

Paciente presenta presión arterial en nivel 
crítico que requiere intervención inmediata. 
Valor: 180 mmHg. Hipertensión severa.

💡 Acción Sugerida:
ACCIÓN URGENTE: Contactar al paciente 
inmediatamente. Evaluar derivación a urgencias.

[✓ Marcar como Resuelta]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### 🛡️ **Superadmin**

**Ubicación:** `/dashboard/alerts`

**Qué verás:**
- ✅ Solo alertas **CRÍTICAS sistémicas**
- 🚨 Situaciones que requieren supervisión
- 👨‍⚕️ Admin responsable identificado
- ⚡ Detección de inacción del admin
- 📊 Patrones de múltiples pacientes en riesgo

**Ejemplo:**
```
⚠️ Alerta Crítica Sistémica: Saturación de Oxígeno
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL | Hace 1 hora

Paciente: María López (ID: patient-003)
Admin Responsable: Dr. González (admin-002)

Se detectó métrica crítica sin intervención 
del administrador. Paciente con saturación 
de oxígeno en 88%. Requiere acción inmediata.

💡 Acción Sugerida:
Contactar al administrador inmediatamente.
Verificar protocolo de emergencia.

[✓ Marcar como Resuelta]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 🎛️ Funcionalidades del Panel de Alertas

### Filtros Disponibles

**Por Nivel:**
- 🔵 **Todas** - Ver todas las alertas
- 🔴 **Críticas** - Solo alertas urgentes
- 🟡 **Advertencias** - Alertas de seguimiento
- 🔵 **Info** - Alertas informativas

**Por Estado:**
- 🟢 **Activas** - Alertas pendientes de acción
- ✅ **Resueltas** - Alertas ya atendidas
- 📋 **Todas** - Ver historial completo

### Estadísticas Rápidas

```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Total       │ Críticas    │ Advertencias│ Resueltas   │
│ Alertas     │ Activas     │ Activas     │             │
├─────────────┼─────────────┼─────────────┼─────────────┤
│     12      │      3      │      5      │      4      │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

### Acciones Disponibles

**Para Admins y Superadmins:**
- ✓ **Marcar como Resuelta** - Registra que se tomó acción
- 🔄 **Actualizar** - Recargar alertas nuevas
- 🔍 **Filtrar** - Personalizar vista

**Para Usuarios:**
- 👀 **Ver detalles** - Información completa
- 🔄 **Actualizar** - Ver nuevas alertas

## 🚀 Estados de las Alertas

### 🟢 Activa
- Requiere atención
- Sin acción registrada
- Visible en filtro "Activas"

### ⚡ Escalada
- Sin acción por más de 24hs
- Nivel de gravedad aumentado
- Marcada con badge "ESCALADA"

### ✅ Resuelta
- Acción tomada y registrada
- Muestra quién y cuándo la resolvió
- Visible en filtro "Resueltas"

## 📱 Indicador Visual en el Sidebar

- 🔴 **Punto rojo pulsante** en el ícono de Alertas
- Indica que hay alertas activas
- Visible desde cualquier página del dashboard

## 🔔 Notificaciones

El sistema genera alertas automáticamente cuando:
- 📊 Una métrica está fuera de rango normal
- ⚠️ Una métrica llega a nivel crítico
- ⏰ Una alerta no tiene acción después de 24hs (escala)
- 🔄 Se detectan patrones preocupantes

## 💡 Consejos de Uso

### Para Pacientes:
1. Revisa tus alertas regularmente
2. No te alarmes, son recordatorios de seguimiento
3. Sigue las acciones sugeridas
4. Consulta con tu médico ante dudas

### Para Admins:
1. Prioriza alertas críticas primero
2. Marca como resuelta después de actuar
3. Usa los filtros para organizar tu trabajo
4. Revisa alertas escaladas diariamente

### Para Superadmins:
1. Monitorea alertas críticas sin atención
2. Contacta admins que no responden
3. Identifica patrones sistémicos
4. Asegura protocolos de emergencia

## 🛠️ Acceso Programático

Si necesitas integrar el sistema de alertas:

```typescript
import { alertService } from '@/services/alertService';

// Obtener alertas activas
const alertasActivas = alertService.getActiveAlerts();

// Filtrar por usuario
const misAlertas = alertService.filterAlerts({
  tipoUsuario: 'admin',
  activa: true
});

// Registrar acción
alertService.registerAction(
  'alert-123',
  'admin-001',
  'Paciente contactado y derivado'
);
```

## 📞 Soporte

Para más información:
- Ver documentación completa: `/ALERTAS_SISTEMA.md`
- Código fuente: `/src/app/dashboard/alerts/page.tsx`
- Servicio de alertas: `/src/services/alertService.ts`

---

**Sistema de Alertas Clínicas - Consultora Salud**  
Versión 1.0 | Febrero 2026
