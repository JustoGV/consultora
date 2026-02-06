# Sistema de Alertas Clínicas

Sistema inteligente de generación y gestión de alertas basado en métricas clínicas de pacientes.

## 📋 Descripción General

El sistema analiza métricas clínicas existentes y genera alertas personalizadas según:
- **Umbrales de las métricas** (normal, warning, critical)
- **Rol del usuario** (Usuario/Paciente, Admin, Superadmin)
- **Recurrencia y tiempo** sin acción
- **Nivel de gravedad** de la situación

## 🎯 Características Principales

### 1. Generación Inteligente de Alertas
- Analiza métricas clínicas en tiempo real
- Evita duplicados automáticamente
- Personaliza mensajes según el rol del destinatario
- Diferentes niveles de gravedad (info, warning, critical)

### 2. Escalamiento Automático
- Escala alertas sin acción después de X horas
- Aumenta el nivel de gravedad progresivamente
- Notifica a niveles superiores cuando es necesario

### 3. Gestión de Acciones
- Registro de intervenciones sobre alertas
- Cierre automático al registrar acción
- Histórico de acciones tomadas

### 4. Filtrado Avanzado
- Por nivel de gravedad
- Por tipo de usuario
- Por paciente o admin
- Por rango de fechas
- Por estado (activa/resuelta)

## 👥 Comportamiento por Rol

### 👤 Usuario (Paciente)

**Características:**
- Solo recibe alertas **informativas** o **preventivas**
- Lenguaje claro y **no alarmista**
- Enfoque en el **seguimiento personal**
- No ve información de otros pacientes

**Ejemplo de Alerta:**
```
📊 Glucosa fuera del rango recomendado

Tu glucosa registró un valor de 145 mg/dL. 
Te recomendamos consultar con tu médico para evaluar este resultado.

Acción Sugerida: Agenda una consulta con tu médico de cabecera 
para revisar este resultado.
```

### 🏥 Admin (Administrador)

**Características:**
- Recibe alertas sobre **sus pacientes** cargados
- Incluye gravedad **media y alta**
- Detecta **tendencias negativas** y reiteraciones
- Prioriza según **riesgo clínico**
- Alertas de falta de carga de métricas

**Ejemplo de Alerta:**
```
🚨 CRÍTICO: Saturación de Oxígeno en rango peligroso

Paciente patient-003 presenta saturación de oxígeno en nivel crítico 
que requiere intervención inmediata. Valor registrado: 88 %. 
Paciente con dificultad respiratoria.

Acción Sugerida: ACCIÓN URGENTE: Contactar al paciente inmediatamente. 
Evaluar derivación a urgencias. Registrar intervención en el sistema.
```

### 👑 Superadmin

**Características:**
- Solo recibe alertas **críticas o sistémicas**
- Detecta **inacción** del admin ante métricas graves
- Identifica **patrones repetidos**
- Alerta sobre **múltiples pacientes** en riesgo
- Objetivo: notificar y exigir **intervención del admin**

**Ejemplo de Alerta:**
```
⚠️ Alerta Crítica Sistémica: Saturación de Oxígeno

Se detectó una métrica crítica sin intervención del administrador. 
Paciente patient-003 con saturacion_oxigeno en 88 %. 
Requiere acción inmediata.

Admin Responsable: Admin admin-002
Acción Sugerida: Contactar al administrador responsable inmediatamente. 
Verificar protocolo de emergencia.
```

## 🚀 Uso del Sistema

### Instalación

```typescript
import { alertService } from '@/services/alertService';
import { ClinicalMetric } from '@/types';
```

### Generar Alertas desde Métricas

```typescript
// Crear métricas clínicas
const metricas: ClinicalMetric[] = [
  {
    id: 'metric-001',
    patientId: 'patient-001',
    metricType: 'presion_arterial',
    value: 180,
    unit: 'mmHg',
    status: 'critical',
    timestamp: new Date().toISOString(),
    registeredBy: 'admin-001',
    notes: 'Paciente con cefalea intensa'
  }
];

// Generar alertas para Admin
const alertas = alertService.generateAlertsFromMetrics(
  metricas,
  'admin',          // rol del destinatario
  'admin-001',      // ID del admin
  undefined         // ID del admin (solo para superadmin)
);
```

### Registrar Acción sobre una Alerta

```typescript
const exito = alertService.registerAction(
  'alert-001',                    // ID de la alerta
  'admin-001',                    // Usuario que toma la acción
  'Paciente derivado a urgencias' // Descripción de la acción
);
```

### Escalar Alertas sin Acción

```typescript
// Escalar alertas sin acción por más de 24 horas
const escaladas = alertService.escalateAlerts(24);

console.log(`${escaladas.length} alertas escaladas`);
```

### Filtrar Alertas

```typescript
// Solo alertas críticas activas
const criticas = alertService.filterAlerts({
  nivelGravedad: 'critical',
  activa: true
});

// Alertas de un paciente específico
const paciente = alertService.filterAlerts({
  pacienteId: 'patient-001'
});

// Alertas en un rango de fechas
const recientes = alertService.filterAlerts({
  fechaDesde: '2026-02-01',
  fechaHasta: '2026-02-06'
});
```

## 📊 Tipos de Métricas Soportadas

- `presion_arterial` - Presión Arterial
- `glucosa` - Glucosa
- `peso` - Peso
- `temperatura` - Temperatura
- `frecuencia_cardiaca` - Frecuencia Cardíaca
- `saturacion_oxigeno` - Saturación de Oxígeno
- `colesterol` - Colesterol
- `trigliceridos` - Triglicéridos

## ⚙️ Niveles de Alerta

### Info (Informativo)
- Para usuarios/pacientes
- Métricas en advertencia leve
- No requiere acción urgente

### Warning (Advertencia)
- Para admins
- Métricas fuera de rango
- Requiere seguimiento en 48hs

### Critical (Crítico)
- Para admins y superadmins
- Métricas en rango peligroso
- Requiere acción inmediata

## 🔄 Escalamiento de Alertas

Las alertas escalan cuando:
1. **Tiempo sin acción** supera el umbral (default: 24hs)
2. **Aumenta la gravedad** de la métrica
3. **No hay registro** de intervención

Al escalar:
- Se incrementa el nivel de gravedad
- Se agrega motivo del escalamiento
- Se notifica al nivel superior
- Se marca como "escalada"

## 📝 Estructura de una Alerta

```typescript
interface Alert {
  id: string;
  tipoUsuario: 'user' | 'admin' | 'superadmin';
  nivelGravedad: 'info' | 'warning' | 'critical';
  titulo: string;
  descripcion: string;
  paciente?: {
    id: string;
    nombre: string;
  };
  adminRelacionado?: {
    id: string;
    nombre: string;
  };
  fecha: string;
  accionSugerida: string;
  metricaRelacionada?: string;
  activa: boolean;
  escalada: boolean;
  motivoEscalamiento?: string;
  accionTomada?: {
    fecha: string;
    descripcion: string;
    usuarioId: string;
  };
}
```

## 🧪 Ejemplos y Testing

Ejecutar ejemplos:
```bash
npx ts-node src/services/alertExamples.ts
```

Ver casos de uso completos en `src/services/alertExamples.ts`

## 🔒 Reglas del Sistema

1. ✅ No inventa métricas ni pacientes
2. ✅ No repite alertas idénticas activas
3. ✅ Escala si no hay acciones registradas
4. ✅ Nivel de gravedad siempre claro
5. ✅ Personalizado por rol de usuario
6. ✅ Lenguaje apropiado según destinatario

## 📈 Estadísticas y Reportes

```typescript
// Total de alertas
const total = alertService.getAllAlerts();

// Solo activas
const activas = alertService.getActiveAlerts();

// Filtros avanzados
const reporteAdmin = alertService.filterAlerts({
  tipoUsuario: 'admin',
  nivelGravedad: 'critical',
  activa: true,
  fechaDesde: '2026-02-01'
});
```

## 🎨 Integración con UI

El sistema está listo para integrarse con componentes React:

```typescript
// En un componente Dashboard
const [alertas, setAlertas] = useState<Alert[]>([]);

useEffect(() => {
  const alertasUsuario = alertService.filterAlerts({
    tipoUsuario: user.rol,
    activa: true
  });
  setAlertas(alertasUsuario);
}, [user]);
```

## 📞 Soporte

Para más información sobre el sistema de alertas, consultar:
- `/src/types/index.ts` - Definiciones de tipos
- `/src/services/alertService.ts` - Lógica del servicio
- `/src/services/alertExamples.ts` - Ejemplos prácticos

---

**Desarrollado para Consultora Salud**  
Sistema de Gestión de Discapacidad con Alertas Clínicas Inteligentes
