
# PPIV - El Quinto Elemento

## Descripción del Proyecto

Sistema de gestión para la Cooperativa Eléctrica "Gobernador Ugarte" desarrollado como proyecto final de la tecnicatura. Este sistema cuenta con tres perfiles de usuario: Cliente, Operario y Administrativo, cada uno con funcionalidades específicas para la gestión de servicios eléctricos, facturación, reclamos y operaciones técnicas.

El proyecto está basado en prototipos de Figma que incluyen:
- **Cliente**: Login, dashboard, gestión de facturas, reclamos y pagos
- **Operario**: Gestión de órdenes asignadas, seguimiento de reclamos y carga de insumos
- **Administrativo**: Planificación de itinerarios, ABM de clientes y métricas del sistema

## Tecnologías Utilizadas

### Core Framework
- **React 18.3.1** - Librería principal para la interfaz de usuario
- **TypeScript** - Tipado estático para JavaScript
- **Vite 6.3.5** - Build tool y desarrollo con React SWC

### UI Framework y Componentes
- **Radix UI** - Sistema completo de componentes accesibles:
  - Accordion, Alert Dialog, Avatar, Calendar, Card
  - Checkbox, Dialog, Dropdown Menu, Form, Input
  - Navigation Menu, Popover, Progress, Select
  - Tabs, Tooltip, y más componentes primitivos
- **Tailwind CSS v4.1.3** - Framework de CSS utilitario
- **Shadcn/ui** - Componentes pre-construidos basados en Radix UI

### Librerías de UI Adicionales
- **Lucide React 0.487.0** - Iconografía
- **Class Variance Authority 0.7.1** - Gestión de variantes de componentes
- **clsx & tailwind-merge** - Utilidades para clases CSS
- **Recharts 2.15.2** - Gráficos y visualización de datos (variables CSS preparadas)
- **Sonner 2.0.3** - Sistema de notificaciones toast

### Funcionalidades Especializadas
- **Next Themes 0.4.6** - Preparado para gestión de temas (modo oscuro/claro)

### Componentes UI Disponibles (no utilizados en App principal)
- **React Hook Form 7.55.0** - Gestión de formularios
- **React Day Picker 8.10.1** - Selector de fechas
- **Input OTP 1.4.2** - Campos de entrada para códigos OTP
- **CMDK 1.1.1** - Command palette y búsqueda
- **Embla Carousel React 8.6.0** - Componente de carrusel
- **React Resizable Panels 2.1.7** - Paneles redimensionables
- **Vaul 1.1.2** - Drawer/modal components

### Herramientas de Desarrollo
- **@vitejs/plugin-react-swc** - Plugin de Vite con SWC para mejor performance
- **@types/node** - Tipos de TypeScript para Node.js

## Estructura del Proyecto

- `src/components/ui/` - Componentes de interfaz reutilizables
- `src/components/figma/` - Componentes específicos del diseño de Figma
- `src/styles/` - Estilos globales y configuración de CSS
- `src/guidelines/` - Documentación y guidelines del proyecto

## Instalación y Ejecución

### 🚀 Inicio Rápido

#### Usando Scripts Automatizados (Recomendado)

```bash
# Iniciar todo el sistema (PostgreSQL + Backend + Frontend)
./scripts/start.sh

# Detener todo el sistema
./scripts/stop.sh
```

El script de inicio levanta automáticamente:
- 🐘 PostgreSQL en Docker (puerto 5432)
- 🔧 Backend API (puerto 3001)
- 🌐 Frontend React (puerto 3000)

#### Instalación Manual

```bash
# Instalar dependencias del frontend
npm install

# Instalar dependencias del backend
cd backend && npm install

# Levantar PostgreSQL
docker-compose up -d

# Iniciar backend (desde ./backend)
npm run dev

# Iniciar frontend (desde raíz)
npm run dev
```

### 🌐 Acceso al Sistema

Una vez iniciado el sistema:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **PostgreSQL**: localhost:5432
  - Usuario: `cooperativa_user`
  - Contraseña: `cooperativa_pass`
  - Base de datos: `cooperativa_db`

## 👥 Usuarios de Prueba

El sistema incluye **11 usuarios pre-configurados** con diferentes roles:

### 🟢 Clientes (6 usuarios)

| Email | Nombre | Password |
|-------|--------|----------|
| `mariaelena.gonzalez@hotmail.com` | María Elena González | `password123` |
| `robertocarlos.martinez@gmail.com` | Roberto Carlos Martínez | `password123` |
| `anapaula.fernandez@yahoo.com` | Ana Paula Fernández | `password123` |
| `juanmanuel.lopez@outlook.com` | Juan Manuel López | `password123` |
| `silviaraquel.rodriguez@gmail.com` | Silvia Raquel Rodríguez | `password123` |
| `carlosalberto.sanchez@hotmail.com` | Carlos Alberto Sánchez | `password123` |

**Funcionalidades del Cliente:**
- ✅ Ver mis reclamos
- ✅ Crear nuevos reclamos
- ✅ Dashboard con estadísticas personales
- ✅ Cerrar sesión

### 🔧 Operarios (3 usuarios)

| Email | Nombre | Cargo | Password |
|-------|--------|-------|----------|
| `pedro.electricista@cooperativa-ugarte.com.ar` | Pedro Ramón García | Técnico Electricista | `password123` |
| `juan.operario@cooperativa-ugarte.com.ar` | Juan Carlos Pérez | Operario de Campo | `password123` |
| `luis.tecnico@cooperativa-ugarte.com.ar` | Luis Alberto Gómez | Técnico Especializado | `password123` |

**Funcionalidades del Operario:**
- ✅ Ver reclamos asignados
- ✅ Estadísticas de trabajo (pendientes, en proceso, resueltos)
- ✅ Filtrar reclamos por estado
- ✅ Dashboard con métricas operativas
- ✅ Cerrar sesión

### 👔 Administradores (2 usuarios)

| Email | Nombre | Cargo | Password |
|-------|--------|-------|----------|
| `monica.administradora@cooperativa-ugarte.com.ar` | Mónica Administradora | Gerente Administrativa | `password123` |
| `carlos.admin@cooperativa-ugarte.com.ar` | Carlos Alberto Admin | Director General | `password123` |

**Funcionalidades del Administrador:**
- ✅ Vista completa del sistema con pestañas:
  - 📊 **Dashboard**: Estadísticas generales
  - 👥 **Socios**: Lista completa de clientes
  - 📋 **Reclamos**: Todos los reclamos del sistema
  - 👷 **Empleados**: Lista de operarios
- ✅ Métricas y reportes del sistema
- ✅ Cerrar sesión

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test
```

**32 tests pasando** que verifican:
- ✅ Endpoints de autenticación
- ✅ Endpoints de clientes
- ✅ Endpoints de operarios
- ✅ Endpoints de administradores
- ✅ Validaciones y permisos por rol

### Ejemplo de Uso Manual

```bash
# Login como cliente
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"mariaelena.gonzalez@hotmail.com","password":"password123"}'

# Obtener perfil (con token)
curl http://localhost:3001/api/clientes/perfil \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

## 📊 Base de Datos

El sistema utiliza **PostgreSQL** con las siguientes tablas principales:

- `socio` - Información de clientes
- `empleado` - Información de operarios y administradores
- `reclamo` - Reclamos del sistema
- `tipo_reclamo` - Catálogo de tipos de reclamo
- `estado_reclamo` - Estados posibles de los reclamos

### Datos Pre-cargados

- ✅ 6 socios (clientes)
- ✅ 5 empleados (3 operarios + 2 admins)
- ✅ 13 reclamos de ejemplo
- ✅ 8 tipos de reclamo
- ✅ 4 estados de reclamo

## Ramas del Proyecto

- **`main`**: Rama principal con la interfaz de usuario base
- **`integracion-base-datos`**: ⭐ **Rama activa** con integración completa:
  - Base de datos PostgreSQL en Docker
  - Backend API REST con Express
  - Autenticación JWT
  - 3 roles de usuario funcionando
  - Testing completo
  - Imagen Docker: `damian2k/cooperativa-ugarte-db:latest`

## ✨ Características del Sistema

### 🎯 Funcionalidades por Rol

#### Cliente
- 📋 Dashboard personalizado con mis reclamos
- ➕ Crear nuevos reclamos
- 📊 Estadísticas de mis servicios
- 🔍 Filtrar y buscar reclamos propios

#### Operario
- 👷 Dashboard con reclamos asignados
- 📈 Estadísticas de trabajo (pendientes, en proceso, resueltos)
- 🔄 Filtros por estado de reclamo
- ⚡ Métricas operativas en tiempo real

#### Administrador
- 🌐 Vista global del sistema con pestañas
- 👥 Gestión completa de socios
- 📋 Supervisión de todos los reclamos
- 👔 Administración de empleados
- 📊 Dashboard con métricas generales

### 🛠️ Características Técnicas

- **Multi-perfil**: Interfaz adaptada para Cliente, Operario y Administrativo
- **Autenticación JWT**: Sistema seguro de tokens con bcrypt
- **API RESTful**: Backend Express con validaciones
- **Diseño Responsive**: Componentes optimizados para desktop y mobile
- **Accesibilidad**: Componentes Radix UI con soporte completo de accesibilidad
- **Base de Datos**: PostgreSQL con Docker
- **Testing**: 32 tests automatizados con Jest y Supertest
- **Componentes Reutilizables**: Biblioteca completa de componentes UI
- **Gestión de Estado**: React hooks para manejo de estado local
- **Dockerizado**: PostgreSQL en contenedor para desarrollo

## 📝 Logs y Monitoreo

```bash
# Ver logs del backend
tail -f backend/server.log

# Ver logs del frontend
tail -f frontend.log

# Ver logs de PostgreSQL
docker logs cooperativa-db -f
```

## 🔧 Troubleshooting

### El sistema no inicia

```bash
# Verificar que Docker esté corriendo
docker ps

# Verificar puertos disponibles
lsof -i :3000  # Frontend
lsof -i :3001  # Backend
lsof -i :5432  # PostgreSQL

# Reiniciar todo
./scripts/stop.sh && ./scripts/start.sh
```

### Error de autenticación

Verificá que:
- El backend esté corriendo en puerto 3001
- La base de datos esté levantada
- Estés usando uno de los usuarios de prueba listados arriba
- La contraseña sea exactamente `password123`

### Base de datos no conecta

```bash
# Reiniciar PostgreSQL
docker-compose down
docker-compose up -d

# Verificar estado
docker ps | grep cooperativa-db
```

## 🚀 Deployment

### Backend API

El backend está preparado para deployment con:
- Variables de entorno configurables
- CORS configurado para producción
- Logging de errores
- Validaciones de seguridad

### Frontend

```bash
# Build para producción
npm run build

# Previsualizar build
npm run preview
```

## 📚 Documentación Adicional

- [Database Schema](docs/DATABASE.md) - Esquema completo de la base de datos
- [API Documentation](docs/API.md) - Documentación de endpoints
- [Guidelines](src/guidelines/Guidelines.md) - Guías de desarrollo

## 🤝 Contribución

Este proyecto es parte de la tecnicatura y está en desarrollo activo. Para contribuir:

1. Crear una rama desde `integracion-base-datos`
2. Hacer cambios y testear localmente
3. Ejecutar tests: `cd backend && npm test`
4. Crear pull request con descripción detallada  