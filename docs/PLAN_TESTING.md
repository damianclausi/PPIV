# Plan de Testing - PPIV El Quinto Elemento

## 📋 Resumen Ejecutivo

Este documento describe el plan completo de testing para la aplicación PPIV, cubriendo tanto el backend (Express.js + PostgreSQL) como el frontend (React + TypeScript + Vite).

**Objetivos:**
- Asegurar la calidad y confiabilidad del código
- Detectar errores tempranamente
- Facilitar el mantenimiento y refactorización
- Documentar el comportamiento esperado del sistema

---

## 🎯 Estrategia de Testing

### Tipos de Tests

1. **Unitarios**: Prueban funciones/componentes aislados
2. **Integración**: Prueban la interacción entre módulos
3. **E2E (End-to-End)**: Prueban flujos completos de usuario (opcional)

### Cobertura Objetivo

- **Backend**: 80%+ de cobertura
- **Frontend**: 70%+ de cobertura (componentes críticos)
- **Servicios**: 90%+ de cobertura

---

## 🔧 Backend Testing

### Stack Tecnológico
- **Framework**: Jest 30.2.0
- **HTTP Testing**: Supertest 7.1.4
- **Base de datos**: PostgreSQL (con datos de prueba)

### Estructura de Tests

```
api/
├── __tests__/
│   ├── unit/                    # Tests unitarios
│   │   ├── controllers/         # Tests de controladores
│   │   ├── models/              # Tests de modelos
│   │   ├── middleware/          # Tests de middleware
│   │   └── utils/               # Tests de utilidades
│   ├── integration/             # Tests de integración
│   │   ├── auth.test.js         # Flujo completo de autenticación
│   │   ├── clientes.test.js    # Flujo completo de clientes
│   │   ├── operarios.test.js   # Flujo completo de operarios
│   │   └── administradores.test.js # Flujo completo de administradores
│   ├── setup/                   # Configuración de tests
│   │   ├── testDb.js            # Setup de base de datos de prueba
│   │   └── testHelpers.js       # Funciones auxiliares
│   └── fixtures/                # Datos de prueba
│       ├── usuarios.json
│       ├── reclamos.json
│       └── ...
└── jest.config.js               # Configuración de Jest
```

### Tests Unitarios - Controladores

#### 1. AuthController
- ✅ `login()` - Login exitoso
- ✅ `login()` - Email inválido
- ✅ `login()` - Password incorrecto
- ✅ `login()` - Usuario inactivo
- ✅ `login()` - Socio inactivo
- ✅ `perfil()` - Obtener perfil válido
- ✅ `perfil()` - Token inválido
- ✅ `verificar()` - Token válido
- ✅ `verificar()` - Token expirado

#### 2. ClienteController
- ✅ `obtenerPerfil()` - Perfil completo
- ✅ `obtenerCuentas()` - Lista de cuentas
- ✅ `obtenerDashboard()` - Estadísticas del dashboard
- ✅ `obtenerFacturas()` - Lista de facturas
- ✅ `obtenerReclamos()` - Lista de reclamos del cliente
- ✅ `crearReclamo()` - Crear reclamo válido
- ✅ `crearReclamo()` - Validaciones de campos

#### 3. OperarioController
- ✅ `obtenerPerfil()` - Perfil del operario
- ✅ `obtenerDashboard()` - Dashboard con estadísticas
- ✅ `obtenerReclamos()` - Reclamos asignados
- ✅ `actualizarEstadoReclamo()` - Cambio de estado válido
- ✅ `actualizarEstadoReclamo()` - Validaciones de estado

#### 4. AdministradorController
- ✅ `obtenerPerfil()` - Perfil del administrador
- ✅ `obtenerDashboard()` - Dashboard administrativo
- ✅ `obtenerSocios()` - Lista de socios
- ✅ `obtenerReclamos()` - Todos los reclamos
- ✅ `obtenerEmpleados()` - Lista de empleados
- ✅ `asignarReclamo()` - Asignación exitosa
- ✅ `asignarReclamo()` - Validaciones

#### 5. Otros Controladores
- ✅ TipoReclamoController
- ✅ PrioridadController
- ✅ CuadrillasController
- ✅ ItinerarioController
- ✅ OTTecnicasController

### Tests Unitarios - Modelos

#### 1. Usuario
- ✅ `buscarPorEmail()` - Usuario encontrado
- ✅ `buscarPorEmail()` - Usuario no encontrado
- ✅ `obtenerRoles()` - Roles del usuario
- ✅ `actualizarUltimoLogin()` - Actualización exitosa

#### 2. Reclamo
- ✅ `crear()` - Crear reclamo
- ✅ `buscarPorId()` - Buscar por ID
- ✅ `buscarPorCliente()` - Reclamos del cliente
- ✅ `actualizarEstado()` - Cambio de estado
- ✅ `asignarOperario()` - Asignación

#### 3. Otros Modelos
- ✅ Socio
- ✅ Empleado
- ✅ OrdenTrabajo
- ✅ Cuadrilla

### Tests Unitarios - Middleware

#### 1. Auth Middleware
- ✅ `verificarToken()` - Token válido
- ✅ `verificarToken()` - Token ausente
- ✅ `verificarToken()` - Token inválido
- ✅ `verificarRol()` - Rol válido
- ✅ `verificarRol()` - Rol insuficiente

### Tests Unitarios - Utilidades

#### 1. JWT Utils
- ✅ `generarToken()` - Generación exitosa
- ✅ `verificarToken()` - Verificación exitosa
- ✅ `verificarToken()` - Token expirado

#### 2. Crypto Utils
- ✅ `hashPassword()` - Hash generado
- ✅ `compararPassword()` - Comparación exitosa
- ✅ `compararPassword()` - Password incorrecto

### Tests de Integración

#### 1. Flujo de Autenticación
- ✅ Login → Obtener perfil → Verificar token → Logout
- ✅ Login con diferentes roles (cliente, operario, admin)
- ✅ Protección de rutas según rol

#### 2. Flujo de Cliente
- ✅ Login → Dashboard → Ver reclamos → Crear reclamo → Ver facturas

#### 3. Flujo de Operario
- ✅ Login → Dashboard → Ver reclamos asignados → Actualizar estado

#### 4. Flujo de Administrador
- ✅ Login → Dashboard → Ver socios → Asignar reclamo → Ver empleados

#### 5. Flujo de Reclamos
- ✅ Cliente crea reclamo → Admin asigna → Operario actualiza → Cliente ve estado

---

## 🎨 Frontend Testing

### Stack Tecnológico
- **Framework**: Vitest (recomendado para Vite) o Jest
- **Component Testing**: React Testing Library
- **Mocking**: MSW (Mock Service Worker) para API mocking
- **E2E (Opcional)**: Playwright o Cypress

### Estructura de Tests

```
src/
├── __tests__/                   # Tests del frontend
│   ├── components/              # Tests de componentes
│   │   ├── cliente/             # Componentes de cliente
│   │   ├── operario/           # Componentes de operario
│   │   ├── admin/              # Componentes de admin
│   │   └── ui/                 # Componentes UI base
│   ├── services/               # Tests de servicios
│   ├── hooks/                  # Tests de hooks
│   ├── utils/                  # Tests de utilidades
│   └── setup/                  # Configuración
│       ├── testSetup.js        # Setup de tests
│       └── mocks/              # Mocks
│           ├── handlers.js     # MSW handlers
│           └── server.js       # MSW server
└── vitest.config.ts            # Configuración de Vitest
```

### Tests de Componentes - Cliente

#### 1. Login
- ✅ Renderizado correcto
- ✅ Validación de campos
- ✅ Login exitoso
- ✅ Manejo de errores
- ✅ Redirección según rol

#### 2. DashboardCliente
- ✅ Renderizado con datos
- ✅ Estadísticas correctas
- ✅ Navegación a secciones

#### 3. ReclamosListado
- ✅ Lista de reclamos
- ✅ Filtros funcionando
- ✅ Búsqueda
- ✅ Estados visuales

#### 4. ReclamoNuevo
- ✅ Formulario completo
- ✅ Validaciones
- ✅ Envío exitoso
- ✅ Manejo de errores

#### 5. FacturasListado
- ✅ Lista de facturas
- ✅ Filtros por fecha
- ✅ Descarga de PDF

#### 6. PagoOnline
- ✅ Formulario de pago
- ✅ Validación de tarjeta
- ✅ Procesamiento

### Tests de Componentes - Operario

#### 1. DashboardOperario
- ✅ Estadísticas de trabajo
- ✅ Reclamos asignados
- ✅ Filtros por estado

#### 2. MisOTsOperario
- ✅ Lista de OTs
- ✅ Filtros
- ✅ Actualización de estado

#### 3. ItinerarioOperario
- ✅ Vista de itinerario
- ✅ Toma de OT
- ✅ Actualización de estado

#### 4. CargarInsumos
- ✅ Formulario de insumos
- ✅ Validaciones
- ✅ Envío

### Tests de Componentes - Administrador

#### 1. DashboardAdministrador
- ✅ Métricas generales
- ✅ Navegación entre pestañas
- ✅ Gráficos renderizados

#### 2. GestionSocios
- ✅ Lista de socios
- ✅ Crear socio
- ✅ Editar socio
- ✅ Eliminar socio

#### 3. GestionReclamos
- ✅ Lista completa
- ✅ Asignar reclamo
- ✅ Filtros avanzados

#### 4. GestionEmpleados
- ✅ Lista de empleados
- ✅ CRUD completo

#### 5. ItinerarioCuadrillas
- ✅ Vista de cuadrillas
- ✅ Asignación de OTs
- ✅ Gestión de itinerarios

### Tests de Servicios

#### 1. authService
- ✅ `login()` - Llamada exitosa
- ✅ `login()` - Manejo de errores
- ✅ `logout()` - Limpieza de token
- ✅ `obtenerPerfil()` - Obtener datos
- ✅ `verificarToken()` - Verificación

#### 2. clienteService
- ✅ Todos los métodos del servicio
- ✅ Manejo de errores
- ✅ Transformación de datos

#### 3. operarioService
- ✅ Todos los métodos
- ✅ Actualización de estados

#### 4. administradorService
- ✅ CRUD completo
- ✅ Asignaciones

### Tests de Hooks

#### 1. useCliente
- ✅ Estado inicial
- ✅ Carga de datos
- ✅ Actualización de estado
- ✅ Manejo de errores

#### 2. useOperario
- ✅ Funcionalidad completa
- ✅ Filtros

#### 3. useAdministrador
- ✅ CRUD operations
- ✅ Estados

#### 4. Otros Hooks
- ✅ useItinerario
- ✅ useOTsTecnicas
- ✅ useCuadrillas

### Tests de Utilidades

- ✅ Formateo de fechas
- ✅ Validaciones
- ✅ Transformaciones de datos
- ✅ Helpers

---

## 📊 Matriz de Cobertura

### Backend

| Módulo | Cobertura Objetivo | Prioridad |
|--------|-------------------|-----------|
| AuthController | 90% | Alta |
| ClienteController | 85% | Alta |
| OperarioController | 85% | Alta |
| AdministradorController | 85% | Alta |
| Middleware Auth | 95% | Alta |
| Modelos | 80% | Media |
| Utilidades | 90% | Media |
| Otros Controladores | 70% | Baja |

### Frontend

| Módulo | Cobertura Objetivo | Prioridad |
|--------|-------------------|-----------|
| Login | 90% | Alta |
| Dashboards | 80% | Alta |
| Formularios Críticos | 85% | Alta |
| Servicios | 90% | Alta |
| Hooks | 80% | Media |
| Componentes UI | 60% | Baja |

---

## 🚀 Plan de Implementación

### Fase 1: Configuración (Día 1)
1. ✅ Configurar Jest en backend
2. ✅ Configurar Vitest en frontend
3. ✅ Setup de base de datos de prueba
4. ✅ Configurar MSW para frontend
5. ✅ Crear estructura de carpetas

### Fase 2: Backend - Tests Unitarios (Días 2-4)
1. ✅ Tests de Utilidades (JWT, Crypto)
2. ✅ Tests de Middleware
3. ✅ Tests de Modelos
4. ✅ Tests de Controladores (Auth, Cliente, Operario, Admin)

### Fase 3: Backend - Tests de Integración (Día 5)
1. ✅ Flujos completos de autenticación
2. ✅ Flujos completos por rol
3. ✅ Flujos de reclamos end-to-end

### Fase 4: Frontend - Tests de Servicios y Hooks (Día 6)
1. ✅ Tests de todos los servicios
2. ✅ Tests de hooks personalizados

### Fase 5: Frontend - Tests de Componentes (Días 7-9)
1. ✅ Componentes de Cliente
2. ✅ Componentes de Operario
3. ✅ Componentes de Administrador
4. ✅ Componentes UI críticos

### Fase 6: Integración y Documentación (Día 10)
1. ✅ Scripts de ejecución
2. ✅ CI/CD integration
3. ✅ Documentación de tests
4. ✅ Coverage reports

---

## 📝 Scripts de Testing

### Backend
```bash
# Ejecutar todos los tests
cd api && npm test

# Tests en modo watch
npm run test:watch

# Tests con cobertura
npm run test:coverage

# Tests unitarios solamente
npm test -- __tests__/unit/

# Tests de integración solamente
npm test -- __tests__/integration/
```

### Frontend
```bash
# Ejecutar todos los tests
npm test

# Tests en modo watch
npm run test:watch

# Tests con cobertura
npm run test:coverage

# Tests de componentes solamente
npm test -- components/

# Tests de servicios solamente
npm test -- services/
```

---

## ✅ Checklist de Implementación

### Backend
- [ ] Configuración de Jest
- [ ] Setup de base de datos de prueba
- [ ] Tests de utilidades (JWT, Crypto)
- [ ] Tests de middleware
- [ ] Tests de modelos
- [ ] Tests de AuthController
- [ ] Tests de ClienteController
- [ ] Tests de OperarioController
- [ ] Tests de AdministradorController
- [ ] Tests de otros controladores
- [ ] Tests de integración - Auth
- [ ] Tests de integración - Cliente
- [ ] Tests de integración - Operario
- [ ] Tests de integración - Admin
- [ ] Scripts de ejecución
- [ ] Coverage reports

### Frontend
- [ ] Configuración de Vitest
- [ ] Setup de MSW
- [ ] Tests de servicios
- [ ] Tests de hooks
- [ ] Tests de Login
- [ ] Tests de DashboardCliente
- [ ] Tests de DashboardOperario
- [ ] Tests de DashboardAdministrador
- [ ] Tests de componentes de Cliente
- [ ] Tests de componentes de Operario
- [ ] Tests de componentes de Admin
- [ ] Tests de utilidades
- [ ] Scripts de ejecución
- [ ] Coverage reports

---

## 📚 Recursos y Referencias

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [MSW Documentation](https://mswjs.io/)

---

## 🎯 Métricas de Éxito

- ✅ 80%+ cobertura en backend
- ✅ 70%+ cobertura en frontend
- ✅ Todos los tests pasando en CI/CD
- ✅ Tests ejecutándose en < 30 segundos
- ✅ Documentación completa de tests

---

**Última actualización**: 2024
**Versión del Plan**: 1.0

