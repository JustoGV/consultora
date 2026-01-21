# Consultora Salud - Sistema de Gestión de Discapacidad

Sistema web completo desarrollado en Next.js para la gestión de certificados de discapacidad con arquitectura multi-administradora.

## Tecnologías
- Next.js 14+ con App Router
- TypeScript
- Tailwind CSS
- Heroicons
- React Context API

## Características Clave
- Autenticación con roles (Admin/Usuario)
- **Arquitectura Multi-Administradora**: Cada usuario pertenece a una administradora
- **Aislamiento de Datos**: Cada administradora tiene sus propios datos (categorías, nomencladores, certificados)
- **Pacientes Compartidos**: Un paciente puede tener certificados de múltiples administradoras
- Dashboard personalizado por rol y administradora
- Carga y procesamiento de certificados PDF
- CRUD de categorías y nomencladores (por administradora)
- Gestión de pacientes
- **Búsqueda Avanzada**: Filtros múltiples para certificados (nombre, DNI, categoría, fechas, nivel de discapacidad)
- Datos hardcodeados (sin backend por ahora)

## Estructura
- `/src/app`: Páginas y layouts
- `/src/components`: Componentes reutilizables (Sidebar, CertificateSearch)
- `/src/contexts`: Context API (Auth)
- `/src/lib`: Datos mock con 3 administradoras
- `/src/types`: Definiciones TypeScript

## Credenciales de Prueba

### Salud Integral SA
- Admin: admin@saludintegral.com / password123
- Usuario: juan@saludintegral.com / password123

### Medicina Total SRL
- Admin: admin@medicinatotal.com / password123
- Usuario: maria@medicinatotal.com / password123

### Asistencia Médica Plus
- Admin: admin@asistenciaplus.com / password123

## Modelo de Datos

### Administradora
- Cada administradora tiene: id, nombre, CUIT, dirección, teléfono, email
- Los usuarios pertenecen a UNA administradora
- Las categorías y nomencladores pertenecen a UNA administradora
- Los certificados están asociados a UNA administradora
- Los pacientes pueden estar en MÚLTIPLES administradoras (array de administradoraIds)

### Aislamiento de Datos
- Todos los componentes filtran datos por `user.administradoraId`
- Dashboard muestra solo estadísticas de la administradora del usuario
- Certificados se filtran por administradora
- Categorías y nomencladores son únicos por administradora
- Pacientes muestran solo certificados de la administradora actual
