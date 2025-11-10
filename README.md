
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
- `src/components/admin/` - Componentes del dashboard administrativo
- `src/components/cliente/` - Componentes del dashboard de clientes
- `src/components/operario/` - Componentes del dashboard de operarios
- `src/styles/` - Estilos globales y configuración de CSS
- `src/guidelines/` - Documentación y guidelines del proyecto
- `api/` - API REST con Express y PostgreSQL (arquitectura MVC)
  - `api/_lib/models/` - Modelos de datos
  - `api/_lib/controllers/` - Lógica de negocio
  - `api/_lib/routes/` - Definición de rutas
  - `api/_lib/middleware/` - Middlewares (auth, validación)
  - `api/_lib/utils/` - Utilidades compartidas
- `docs/` - Documentación técnica del proyecto

## Instalación y Ejecución

### Requisitos Previos

- **Node.js** 18+ y npm
- **Docker** (para PostgreSQL)
  - Si no tienes Docker: https://docs.docker.com/engine/install/

### Primera Vez - Setup Completo

#### 1. Clonar el Repositorio
```bash
git clone https://github.com/damianclausi/PPIV.git
cd PPIV
git checkout integracion-base-datos
```

#### 2. Instalar Dependencias
```bash
# Dependencias del frontend
npm install

# Dependencias del backend
cd api
npm install
cd ..
```

#### 3. Configurar Variables de Entorno

**Backend** - Crear `api/.env`:
```bash
PORT=3001
DATABASE_URL=postgresql://DB_USER:DB_PASSWORD@localhost:5432/DB_NAME
JWT_SECRET=tu-secreto-jwt-super-seguro-aqui
NODE_ENV=development
```

**Nota:** Reemplaza `DB_USER`, `DB_PASSWORD` y `DB_NAME` con las credenciales de tu base de datos.
Para desarrollo local usando Docker Hub, usa:
- DB_USER: `coop_user`
- DB_PASSWORD: `cooperativa2024`
- DB_NAME: `cooperativa_ugarte_db`

**Frontend** - Crear `.env`:
```bash
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=Sistema de Gestión - Cooperativa Eléctrica
```

#### 4. Iniciar Base de Datos con Docker

**Opción A: Usando el script automatizado (Recomendado)**
```bash
./update-docker.sh
```

Este script:
- Descarga la imagen `damian2k/cooperativa-ugarte-db:latest` desde Docker Hub
- Crea y ejecuta el contenedor PostgreSQL con datos precargados
- Verifica la conectividad automáticamente
- Muestra la cantidad de registros cargados (30 reclamos, 6 clientes, 5 empleados, etc.)

**Opción B: Manual**
```bash
docker run -d \
  --name cooperativa-db \
  -p 5432:5432 \
  -e POSTGRES_DB=cooperativa_ugarte_db \
  -e POSTGRES_USER=coop_user \
  -e POSTGRES_PASSWORD=<tu-password-aqui> \
  damian2k/cooperativa-ugarte-db:latest
```

#### 5. Iniciar el Sistema
```bash
./start.sh
```

Este script inicia automáticamente:
- Backend API (puerto 3001)
- Frontend React (puerto 3002)

#### 6. Verificar que Todo Funcione
```bash
./status.sh
```

Deberías ver:
```
Backend: CORRIENDO puerto 3001
Frontend: CORRIENDO puerto 3002
PostgreSQL: CORRIENDO contenedor cooperativa-db
Sistema: completamente operativo
```

### Inicio Rápido (Sistema Ya Configurado)

```bash
# Iniciar todo
./start.sh

# Ver estado
./status.sh

# Ver logs
./logs.sh all

# Detener todo
./stop.sh

# Reiniciar (útil después de cambios)
./restart.sh
```

### Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `./start.sh` | Inicia backend y frontend |
| `./stop.sh` | Detiene todos los servicios |
| `./restart.sh` | Reinicia el sistema |
| `./status.sh` | Muestra estado del sistema |
| `./logs.sh` | Ver logs (backend\|frontend\|all\|errors) |
| `./update-docker.sh` | Actualiza imagen Docker desde Docker Hub |

Ver **README_SCRIPTS.md** para documentación completa de scripts.

### Acceso al Sistema

Una vez iniciado:

- **Frontend**: http://localhost:3002
- **Backend API**: http://localhost:3001
- **PostgreSQL**: localhost:5432
  - Usuario: `coop_user`
  - Base de datos: `cooperativa_ugarte_db`
  - Contraseña: Ver archivo `.env` o imagen Docker

## Usuarios de Prueba

El sistema incluye **11 usuarios pre-configurados** con diferentes roles:

### Clientes (6 usuarios)

| Email | Nombre | Password |
|-------|--------|----------|
| `mariaelena.gonzalez@hotmail.com` | María Elena González | `password123` |
| `robertocarlos.martinez@gmail.com` | Roberto Carlos Martínez | `password123` |
| `anapaula.fernandez@yahoo.com` | Ana Paula Fernández | `password123` |
| `juanmanuel.lopez@outlook.com` | Juan Manuel López | `password123` |
| `silviaraquel.rodriguez@gmail.com` | Silvia Raquel Rodríguez | `password123` |
| `carlosalberto.sanchez@hotmail.com` | Carlos Alberto Sánchez | `password123` |

**Funcionalidades del Cliente:**
- Ver mis reclamos
- Crear nuevos reclamos
- Dashboard con estadísticas personales
- Cerrar sesión

### Operarios (3 usuarios)

| Email | Nombre | Cargo | Password |
|-------|--------|-------|----------|
| `pedro.electricista@cooperativa-ugarte.com.ar` | Pedro Ramón García | Técnico Electricista | `password123` |
| `juan.operario@cooperativa-ugarte.com.ar` | Juan Carlos Pérez | Operario de Campo | `password123` |
| `luis.tecnico@cooperativa-ugarte.com.ar` | Luis Alberto Gómez | Técnico Especializado | `password123` |

**Funcionalidades del Operario:**
- Ver reclamos asignados
- Estadísticas de trabajo (pendientes, en proceso, resueltos)
- Filtrar reclamos por estado
- Dashboard con métricas operativas
- Cerrar sesión

### Administradores (2 usuarios)

| Email | Nombre | Cargo | Password |
|-------|--------|-------|----------|
| `monica.administradora@cooperativa-ugarte.com.ar` | Mónica Administradora | Gerente Administrativa | `password123` |
| `carlos.admin@cooperativa-ugarte.com.ar` | Carlos Alberto Admin | Director General | `password123` |

**Funcionalidades del Administrador:**
- Vista completa del sistema con pestañas:
  - **Dashboard**: Estadísticas generales
  - **Socios**: Lista completa de clientes
  - **Reclamos**: Todos los reclamos del sistema
  - **Empleados**: Lista de operarios
- Métricas y reportes del sistema
- Cerrar sesión

## Testing

### Backend Tests

```bash
cd api
npm test
```

**32 tests pasando** que verifican:
- Endpoints de autenticación
- Endpoints de clientes
- Endpoints de operarios
- Endpoints de administradores
- Validaciones y permisos por rol

### Ejemplo de Uso Manual

```bash
# Login como cliente
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"mariaelena.gonzalez@hotmail.com","password":"<ver-tabla-usuarios>"}'

# Obtener perfil (con token)
curl http://localhost:3001/api/clientes/perfil \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

## Base de Datos

El sistema utiliza **PostgreSQL** con las siguientes tablas principales:

- `socio` - Información de clientes
- `empleado` - Información de operarios y administradores
- `reclamo` - Reclamos del sistema
- `tipo_reclamo` - Catálogo de tipos de reclamo
- `estado_reclamo` - Estados posibles de los reclamos

### Datos Pre-cargados

La imagen Docker incluye:
- **6 clientes** (socios con cuentas activas)
- **5 empleados** (3 operarios + 2 administradores)
- **30 reclamos** de ejemplo asignados a operarios
- **8 tipos de reclamo** (Falta de Suministro, Fluctuaciones de Tensión, Daños en Red, Medidor Defectuoso, Facturación, Conexión Nueva, Reconexión, Calidad del Servicio)
- **11 usuarios** configurados (6 clientes + 3 operarios + 2 admins)
- **23 órdenes de trabajo** asignadas al operario Pedro García

### Actualizar Base de Datos

Si se actualiza la imagen en Docker Hub con nuevos datos:

```bash
./stop.sh
./update-docker.sh
./start.sh
```

## Ramas del Proyecto

- **`main`**: Rama principal con la interfaz de usuario base
- **`integracion-base-datos`**: **Rama activa** con integración completa:
  - Base de datos PostgreSQL en Docker
  - Backend API REST con Express
  - Autenticación JWT
  - 3 roles de usuario funcionando
  - Testing completo
  - Imagen Docker: `damian2k/cooperativa-ugarte-db:latest`

## Características del Sistema

### Funcionalidades por Rol

#### Cliente
- Dashboard personalizado con mis reclamos
- Crear nuevos reclamos
- Estadísticas de mis servicios
- Filtrar y buscar reclamos propios

#### Operario
- Dashboard con reclamos asignados
- Estadísticas de trabajo (pendientes, en proceso, resueltos)
- Filtros por estado de reclamo
- Métricas operativas en tiempo real

#### Administrador
- Vista global del sistema con pestañas
- Gestión completa de socios
- Supervisión de todos los reclamos
- Administración de empleados
- Dashboard con métricas generales

### Características Técnicas

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

## Logs y Monitoreo

```bash
# Ver logs en tiempo real
./logs.sh all

# Ver solo logs del backend
./logs.sh backend

# Ver solo logs del frontend
./logs.sh frontend

# Ver solo errores
./logs.sh errors

# O manualmente:
tail -f logs/backend.log
tail -f logs/frontend.log

# Ver logs de PostgreSQL
docker logs cooperativa-db -f
```

## Troubleshooting

### El sistema no inicia

```bash
# Verificar estado del sistema
./status.sh

# Verificar que Docker esté corriendo
docker ps

# Verificar puertos disponibles
lsof -i :3002  # Frontend
lsof -i :3001  # Backend
lsof -i :5432  # PostgreSQL

# Reiniciar todo
./restart.sh
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

## Deployment

### Vercel (Producción)

El sistema está desplegado en Vercel con:
- **Frontend**: Desplegado automáticamente desde la rama `main`
- **Backend**: Funciones serverless en `/api` (sin duplicación de código)
- **Base de Datos**: PostgreSQL externa (configurada vía variables de entorno)

**Arquitectura Unificada:**
- Un solo directorio `/api` funciona tanto para desarrollo local como producción
- MVC preservado: models, controllers, routes en `api/_lib/`
- Sin necesidad de sincronización manual entre carpetas

### Variables de Entorno en Vercel

Backend (Serverless Functions):
- `DATABASE_URL`
- `JWT_SECRET`
- `NODE_ENV=production`

Frontend:
- `VITE_API_URL` (URL de tu API en Vercel)

### Frontend

```bash
# Build para producción
npm run build

# Previsualizar build
npm run preview
```

## Documentación Adicional

- [API Documentation](docs/API.md) - Documentación completa de endpoints
- [Database Schema](docs/DATABASE.md) - Esquema completo de la base de datos
- [Testing Guide](docs/TESTING.md) - Guía completa de testing
- [Guidelines](src/guidelines/Guidelines.md) - Guías de desarrollo

