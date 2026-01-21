# Consultora Salud - Sistema de Gestión de Discapacidad

Sistema web completo desarrollado en Next.js para la gestión de certificados de discapacidad en una consultora de salud.

## 🚀 Características

### Autenticación y Roles
- **Rol Admin**: Acceso completo al sistema con panel administrativo
- **Rol Usuario**: Puede cargar y gestionar sus propios certificados
- Login con credenciales mock (hardcoded por ahora)

### Panel de Administración (Admin)
- **Dashboard**: Vista general con estadísticas del sistema
- **Gestión de Pacientes**: Lista y detalles de todos los pacientes
- **Gestión de Certificados**: Visualización de todos los certificados cargados
- **Categorías**: CRUD completo de categorías de discapacidad
- **Nomencladores**: CRUD completo de nomencladores
- **Configuración**: Ajustes generales del sistema

### Panel de Usuario
- **Dashboard**: Vista personal con estadísticas
- **Subir Certificado**: Interfaz para cargar PDFs de certificados de discapacidad
- **Mis Certificados**: Gestión de certificados personales
- **Extracción de Datos**: Simulación de extracción automática de datos del PDF

## 🛠️ Tecnologías

- **Framework**: Next.js 14+ (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Iconos**: Heroicons
- **Estado**: React Context API

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Compilar para producción
npm run build

# Ejecutar en producción
npm start
```

## 🔑 Credenciales de Prueba

El sistema cuenta con **3 administradoras distintas**, cada una con su propio conjunto de datos aislados:

### 🏢 Salud Integral SA
- **Admin**: admin@saludintegral.com / password123
- **Usuario**: juan@saludintegral.com / password123

### 🏢 Medicina Total SRL
- **Admin**: admin@medicinatotal.com / password123
- **Usuario**: maria@medicinatotal.com / password123

### 🏢 Asistencia Médica Plus
- **Admin**: admin@asistenciaplus.com / password123

**Cada administradora tiene**:
- ✅ Sus propias categorías
- ✅ Sus propios nomencladores
- ✅ Sus propios certificados
- ✅ Pacientes que pueden estar registrados en múltiples administradoras

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── page.tsx                    # Página de login
│   ├── layout.tsx                  # Layout principal
│   └── dashboard/
│       ├── layout.tsx              # Layout del dashboard con sidebar
│       ├── page.tsx                # Dashboard home
│       ├── upload/                 # Subir certificados
│       ├── certificates/           # Lista de certificados
│       ├── patients/               # Gestión de pacientes (admin)
│       ├── categories/             # Gestión de categorías (admin)
│       ├── nomenclators/           # Gestión de nomencladores (admin)
│       └── settings/               # Configuración (admin)
├── components/
│   └── Sidebar.tsx                 # Componente de navegación lateral
├── contexts/
│   └── AuthContext.tsx             # Contexto de autenticación
├── lib/
│   └── mockData.ts                 # Datos hardcodeados
└── types/
    └── index.ts                    # Tipos TypeScript
```

## 🎨 Funcionalidades Implementadas

### ✅ Sistema de Autenticación
- Login con validación de credenciales
- Persistencia de sesión en localStorage
- Redirección automática según rol
- Protección de rutas

### ✅ Interfaz de Usuario
- Diseño moderno y profesional
- Sidebar con navegación contextual según rol
- Cards informativos con estadísticas
- Tablas responsivas para gestión de datos
- Modales para crear/editar registros
- Formularios validados

### ✅ Gestión de Certificados
- Carga de archivos PDF
- Simulación de extracción de datos
- Visualización de datos extraídos
- **Búsqueda avanzada con múltiples filtros**:
  - Búsqueda general (nombre, DNI, tipo de discapacidad)
  - Filtro por categoría
  - Filtro por tipo de discapacidad específico
  - Filtro por rango de fechas
  - Filtro por nivel de discapacidad (min/max %)
- Listado de certificados por paciente
- **Aislamiento de datos por administradora**

### ✅ Panel Administrativo
- CRUD completo de categorías (por administradora)
- CRUD completo de nomencladores (por administradora)
- Vista de pacientes con búsqueda
- Dashboard con métricas **filtradas por administradora**
- Configuración del sistema
- **Gestión multi-administradora**:
  - Cada administradora tiene sus propias categorías y nomencladores
  - Los pacientes pueden pertenecer a múltiples administradoras
  - Los certificados están asociados a una administradora específica
  - Completo aislamiento de datos entre administradoras

## 🔄 Próximos Pasos (Backend)

- Integrar con base de datos real
- API para autenticación con JWT
- OCR real para extracción de datos de PDFs
- Sistema de notificaciones
- Reportes y exportación de datos
- Gestión de usuarios
- Auditoría y logs

## 🎯 Flujo de Trabajo

1. **Login**: El usuario ingresa con sus credenciales
2. **Dashboard**: Visualiza su panel según su rol
3. **Cargar Certificado** (Usuario): Sube un PDF y se extraen los datos
4. **Gestionar Datos** (Admin): Administra categorías, nomencladores y pacientes
5. **Visualizar**: Consulta certificados y datos del sistema

## 🌐 Navegación

El servidor de desarrollo se ejecuta en: **http://localhost:3000**

## 📝 Notas

- Todos los datos están hardcodeados en `/src/lib/mockData.ts`
- La autenticación es simulada (no hay backend real)
- La extracción de datos del PDF es simulada
- El sistema está preparado para integración con backend

## 👨‍💻 Desarrollo

El proyecto está configurado para desarrollo con:
- Hot reload automático
- TypeScript strict mode
- ESLint configurado
- Tailwind CSS optimizado

---

**Versión**: 1.0.0  
**Fecha**: Enero 2026  
**Estado**: Desarrollo (Frontend Hardcoded)
# consultora
