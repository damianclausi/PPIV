# 🎊 Sistema Completo - Cooperativa Eléctrica Gobernador Ugarte

## 📋 Resumen del Proyecto

Sistema web completo para la gestión de una cooperativa eléctrica, desarrollado con arquitectura REST API con patrón MVC, testing completo con Jest y Supertest, y frontend React con TypeScript.

## 🏗️ Arquitectura

### Backend - REST API con MVC
```
backend/
├── models/                 # Capa de datos (Models)
│   ├── Usuario.js
│   ├── Socio.js
│   ├── Factura.js
│   └── Reclamo.js
├── controllers/           # Lógica de negocio (Controllers)
│   ├── AuthController.js
│   └── ClienteController.js
├── middleware/            # Middleware de autenticación
│   └── auth.js           # JWT, verificación de roles
├── utils/                # Utilidades
│   ├── jwt.js           # Manejo de tokens JWT
│   ├── crypto.js        # Bcrypt para passwords
│   └── respuestas.js    # Respuestas HTTP estandarizadas
├── routes/              # Rutas REST (Views)
│   ├── auth.js
│   └── clientes.js
├── __tests__/           # Tests completos
│   ├── unit/           # Tests unitarios
│   └── integration/    # Tests de integración
└── server.js           # Servidor Express
```

### Frontend - React + TypeScript
```
src/
├── services/            # Capa de servicios API
│   ├── api.js          # Cliente HTTP base
│   ├── authService.js  # Servicios de autenticación
│   └── clienteService.js # Servicios de cliente
├── contexts/           # Contextos globales
│   └── AuthContext.jsx # Contexto de autenticación
├── hooks/             # Hooks personalizados
│   └── useCliente.js  # Hooks para datos de cliente
└── components/        # Componentes React
    ├── Login.jsx
    ├── DashboardCliente.jsx
    └── ui/           # Componentes UI (Shadcn)
```

## 🚀 Tecnologías Utilizadas

### Backend
- **Node.js** v18.19.1
- **Express** 4.18.2 - Framework web
- **PostgreSQL** - Base de datos relacional
- **JWT** (jsonwebtoken) - Autenticación
- **Bcrypt** - Encriptación de contraseñas
- **Jest** + **Supertest** - Testing
- **Docker** - Contenedor de PostgreSQL

### Frontend
- **React** 18.3.1
- **TypeScript** 5.6.3
- **Vite** 6.3.5 - Build tool
- **React Router** 7.9.3 - Navegación
- **Tailwind CSS** v4.1.3 - Estilos
- **Shadcn/ui** - Componentes UI
- **Radix UI** - Componentes accesibles

## 📦 Instalación

### Prerrequisitos
- Node.js v18+
- Docker
- PostgreSQL (via Docker)

### Backend
```bash
cd backend
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Iniciar base de datos
docker-compose up postgres -d

# Hashear password de prueba
node scripts/hashPassword.js

# Iniciar servidor
npm run dev         # Desarrollo con nodemon
npm start          # Producción
```

### Frontend
```bash
cd /
npm install
npm run dev        # Desarrollo
npm run build      # Producción
```

## 🧪 Testing

### Ejecutar Tests
```bash
cd backend

# Todos los tests
npm test

# Tests unitarios
npm test -- __tests__/unit/

# Tests de integración
npm test -- __tests__/integration/

# Con cobertura
npm run test:coverage

# Modo watch
npm run test:watch
```

### Resultados Actuales
✅ **32 tests pasando**
- 14 tests unitarios (modelos)
- 18 tests de integración (API endpoints)

Ver documentación completa en `backend/TESTING.md`

## 🔐 Autenticación

El sistema usa **JWT (JSON Web Tokens)** para autenticación:

1. Usuario hace login → recibe token JWT
2. Token se incluye en header: `Authorization: Bearer {token}`
3. Middleware valida token en rutas protegidas
4. Token expira en 24h (configurable)

### Usuario de Prueba
```
Email: mariaelena.gonzalez@hotmail.com
Password: password123
```

## 📡 API Endpoints

### Autenticación
```
POST   /api/auth/login        # Login
GET    /api/auth/perfil       # Obtener perfil (requiere auth)
POST   /api/auth/verificar    # Verificar token (requiere auth)
```

### Clientes
```
GET    /api/clientes/perfil      # Perfil del socio
GET    /api/clientes/cuentas     # Cuentas del socio
GET    /api/clientes/dashboard   # Dashboard con resúmenes
GET    /api/clientes/facturas    # Lista de facturas
GET    /api/clientes/facturas/:id # Detalle de factura
GET    /api/clientes/reclamos    # Lista de reclamos
GET    /api/clientes/reclamos/:id # Detalle de reclamo
POST   /api/clientes/reclamos    # Crear reclamo
```

### Salud del Sistema
```
GET    /api/salud             # Estado del servidor y DB
GET    /                      # Info de la API
```

## 🎨 Componentes del Frontend

### AuthContext
Provider global que maneja:
- Estado de autenticación
- Usuario actual
- Login/Logout
- Verificación de token

### Hooks Personalizados
- `usePerfil()` - Obtener perfil del cliente
- `useDashboard()` - Dashboard con resúmenes
- `useFacturas()` - Lista de facturas con filtros
- `useReclamos()` - Lista de reclamos con CRUD
- `useCuentas()` - Cuentas del socio

### Componentes
- `Login` - Formulario de inicio de sesión
- `DashboardCliente` - Dashboard principal del cliente
- `RutaProtegida` - HOC para rutas que requieren autenticación

## 🗄️ Base de Datos

### Imagen Docker
```
damian2k/cooperativa-ugarte-db:latest
```

### Tablas Principales
- `usuario` - Usuarios del sistema
- `socio` - Clientes de la cooperativa
- `empleado` - Empleados (operarios, administrativos)
- `rol` - Roles del sistema
- `cuenta` - Cuentas de servicios
- `factura` - Facturas de servicios
- `reclamo` - Reclamos de clientes
- `tipo_reclamo` - Tipos de reclamos
- `prioridad` - Prioridades

Ver esquema completo en `docs/DATABASE.md`

## 🔧 Configuración

### Variables de Entorno

#### Backend (.env)
```env
PORT=3001
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=cooperativa_ugarte
DB_USER=cooperativa_user
DB_PASSWORD=cooperativa_pass

JWT_SECRET=tu_clave_secreta_cambiar_en_produccion
JWT_EXPIRATION=24h
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001
```

## 📱 URLs del Sistema

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Docs**: http://localhost:3001/
- **Health Check**: http://localhost:3001/api/salud

## 🔄 Flujo de Trabajo

### 1. Desarrollo
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
npm run dev

# Terminal 3 - Tests (opcional)
cd backend && npm run test:watch
```

### 2. Testing
```bash
cd backend
npm test                    # Todos los tests
npm run test:coverage       # Con cobertura
```

### 3. Build para Producción
```bash
# Frontend
npm run build
npm run preview

# Backend
cd backend && npm start
```

## 📚 Documentación Adicional

- `backend/TESTING.md` - Documentación completa de testing
- `docs/DATABASE.md` - Esquema de base de datos
- `backend/routes/_backup/` - Rutas antiguas (respaldo)

## 🎯 Características Implementadas

### ✅ Backend
- [x] Arquitectura MVC completa
- [x] Autenticación JWT
- [x] Autorización por roles
- [x] Modelos con queries optimizadas
- [x] Controladores con lógica de negocio
- [x] Respuestas HTTP estandarizadas
- [x] Manejo de errores global
- [x] Testing completo (32 tests)
- [x] Documentación de API

### ✅ Frontend
- [x] Autenticación con Context API
- [x] Servicios API con interceptors
- [x] Hooks personalizados
- [x] Componentes con Shadcn/ui
- [x] Rutas protegidas
- [x] TypeScript configurado
- [x] Tailwind CSS configurado

## 🚧 Próximas Características

### Backend
- [ ] Controladores de Operarios
- [ ] Controladores de Administrativos
- [ ] Sistema de notificaciones
- [ ] Carga de archivos (facturas, imágenes)
- [ ] Rate limiting
- [ ] Logs estructurados
- [ ] Más tests (100% cobertura)

### Frontend
- [ ] Componente de lista de facturas
- [ ] Componente de crear reclamo
- [ ] Componente de perfil editable
- [ ] Dashboard de operario
- [ ] Dashboard de administrativo
- [ ] Notificaciones en tiempo real
- [ ] Tema oscuro/claro
- [ ] Responsive mejorado
- [ ] Tests con React Testing Library

## 🐛 Resolución de Problemas

### Backend no conecta a DB
```bash
# Verificar que Docker está corriendo
docker ps

# Reiniciar contenedor
docker-compose restart postgres
```

### Puerto 3001 en uso
```bash
# Matar proceso
pkill -f "node server.js"
```

### Tests fallan
```bash
# Verificar variables de entorno
cat backend/.env

# Verificar base de datos
docker exec cooperativa-db psql -U cooperativa_user -d cooperativa_ugarte -c "SELECT NOW();"
```

## 👥 Roles del Sistema

- **CLIENTE**: Socios de la cooperativa
- **OPERARIO**: Técnicos que resuelven reclamos
- **ADMINISTRATIVO**: Personal administrativo

## 📞 Contacto y Soporte

Para issues y preguntas:
- GitHub: https://github.com/damianclausi/PPIV
- Branch: integracion-base-datos

## 📄 Licencia

ISC

---

**Desarrollado con ❤️ para la Cooperativa Eléctrica Gobernador Ugarte**
