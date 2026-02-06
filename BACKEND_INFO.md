# 🚀 Información del Backend - Consultora TEN

## 📍 URL del Backend en Producción

**Backend API**: `https://consultora-ten-back.fly.dev`

---

## 🌐 Hosting y Base de Datos

### Backend
- **Plataforma**: Fly.io
- **Región**: GRU (São Paulo, Brasil) 🇧🇷
- **Plan**: Free Tier
- **Características**:
  - Auto-start/stop (se suspende sin tráfico, despierta en ~3-5 segundos)
  - HTTPS forzado
  - 256MB RAM, 1 CPU compartida
  - Keep-alive cada 4 minutos para mantener activo

### Base de Datos
- **Proveedor**: Neon PostgreSQL
- **Región**: São Paulo (sa-east-1) 🇧🇷
- **Latencia**: ~20-40ms desde Argentina (mejora del 85% vs Virginia)
- **Plan**: Free Tier

---

## 🔐 Usuarios de Prueba

### Superadmin
- **Email**: `consultora@admin.com`
- **Password**: `consultora123`
- **Permisos**: Acceso total (métricas, crear/editar categorías y nomencladores)

### Admin Obra Social
- **Email**: `admin@jerarquicos.com`
- **Password**: `jerarquicos123`
- **Permisos**: Sin métricas, sin modificar categorías/nomencladores (solo lectura)

---

## 📊 Datos Migrados

- ✅ **4 usuarios** registrados
- ✅ **1 administradora**: Jerárquicos Salud
- ✅ **4 categorías**: UNICA, A, B, C
- ✅ **96 nomencladores** ANDIS
- ✅ **384 valores de nomenclador** (4 por nomenclador)

---

## 🔧 Endpoints Disponibles

Base URL: `https://consultora-ten-back.fly.dev`

### Autenticación
- `POST /auth/register` - Registro
- `POST /auth/login` - Login
- `GET /auth/profile` - Perfil (requiere token)

### Administradoras
- `GET /administradoras` - Listar
- `GET /administradoras/:id` - Obtener
- `POST /administradoras` - Crear (SUPERADMIN)
- `PATCH /administradoras/:id` - Actualizar (SUPERADMIN)
- `DELETE /administradoras/:id` - Eliminar (SUPERADMIN)

### Categorías
- `GET /categorias` - Listar
- `GET /categorias/:id` - Obtener
- `POST /categorias` - Crear (SUPERADMIN)
- `PATCH /categorias/:id` - Actualizar (SUPERADMIN)
- `DELETE /categorias/:id` - Eliminar (SUPERADMIN)

### Nomencladores
- `GET /nomencladores` - Listar (filtrados por administradora)
- `GET /nomencladores/:id` - Obtener
- `POST /nomencladores` - Crear
- `PATCH /nomencladores/:id` - Actualizar
- `DELETE /nomencladores/:id` - Eliminar

### Valores de Nomenclador
- `GET /valores-nomenclador` - Listar
- `GET /valores-nomenclador/nomenclador/:nomencladorId` - Por nomenclador
- `POST /valores-nomenclador` - Crear
- `PATCH /valores-nomenclador/:id` - Actualizar
- `DELETE /valores-nomenclador/:id` - Eliminar

---

## ⚡ Consideraciones de Performance

### Primera Carga
- La app puede tardar **3-5 segundos** en la primera request después de estar inactiva
- Fly.io suspende la app después de inactividad (free tier)
- Requests subsecuentes son instantáneas

### Keep-Alive
- El frontend hace ping cada **4 minutos** para mantener el backend activo
- Se inicia automáticamente 1 minuto después de cargar la página

---

## 🐛 Troubleshooting

### Error: 502 Bad Gateway
**Síntoma**: Error 502 en primera request  
**Solución**: Esperar 5-10 segundos y reintentar (app despertando)

### Error: Unauthorized
**Síntoma**: 401 en endpoints protegidos  
**Solución**: Verificar token JWT en header `Authorization: Bearer <token>`

### Error: CORS
**Síntoma**: `Access-Control-Allow-Origin` error  
**Solución**: Verificar que la URL del frontend esté en la whitelist del backend

---

## 📝 Changelog

### v3 - 4 Feb 2026
- ✅ Migración a Fly.io (São Paulo)
- ✅ Base de datos migrada a São Paulo (~85% mejora de latencia)
- ✅ 96 nomencladores ANDIS + 384 valores migrados
- ✅ Keep-alive optimizado (4 minutos)

---

**Última actualización**: 4 de febrero de 2026
