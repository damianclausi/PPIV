# 🎭 Usuarios de Prueba - Sistema Completo

## 📝 Todos los usuarios tienen la misma contraseña: `password123`

---

## 👥 CLIENTES (6 usuarios)

### 1. Juan Carlos Pérez
- **Email:** `juancarlos.perez@gmail.com`
- **Password:** `password123`
- **Rol:** CLIENTE
- **Dashboard:** /dashboard (auto-redirect según rol)

### 2. María Elena González ⭐
- **Email:** `mariaelena.gonzalez@hotmail.com`
- **Password:** `password123`
- **Rol:** CLIENTE
- **Notas:** Usuario con datos de prueba completos

### 3. Roberto Daniel Martínez
- **Email:** `roberto.martinez@outlook.com`
- **Password:** `password123`
- **Rol:** CLIENTE

### 4. Ana Sofía Rodríguez
- **Email:** `ana.rodriguez@yahoo.com`
- **Password:** `password123`
- **Rol:** CLIENTE

### 5. Carlos Alberto Fernández
- **Email:** `carlos.fernandez@gmail.com`
- **Password:** `password123`
- **Rol:** CLIENTE

### 6. Laura Beatriz López
- **Email:** `laura.lopez@gmail.com`
- **Password:** `password123`
- **Rol:** CLIENTE

---

## 🔧 OPERARIOS (3 usuarios)

### 1. Pedro Ramón García
- **Email:** `pedro.electricista@cooperativa-ugarte.com.ar`
- **Password:** `password123`
- **Rol:** OPERARIO
- **Cargo:** Técnico Electricista
- **Dashboard:** Muestra reclamos asignados y estadísticas

### 2. Ana María Fernández
- **Email:** `ana.supervisora@cooperativa-ugarte.com.ar`
- **Password:** `password123`
- **Rol:** OPERARIO
- **Cargo:** Supervisora
- **Dashboard:** Gestión de reclamos asignados

### 3. Daniel Ricardo Castro
- **Email:** `daniel.emergencias@cooperativa-ugarte.com.ar`
- **Password:** `password123`
- **Rol:** OPERARIO
- **Cargo:** Técnico de Emergencias
- **Dashboard:** Reclamos de emergencia y alta prioridad

---

## 👔 ADMINISTRADORES (2 usuarios)

### 1. Carmen Alicia López
- **Email:** `carmen.atencion@cooperativa-ugarte.com.ar`
- **Password:** `password123`
- **Rol:** ADMIN
- **Cargo:** Jefa de Atención al Cliente
- **Dashboard:** Vista completa del sistema con estadísticas generales

### 2. Mónica Estela Díaz ⭐
- **Email:** `monica.administradora@cooperativa-ugarte.com.ar`
- **Password:** `password123`
- **Rol:** ADMIN
- **Cargo:** Administradora General
- **Dashboard:** Control total del sistema

---

## 🎯 Funcionalidades por Rol

### CLIENTE
✅ Ver perfil personal
✅ Ver cuentas asociadas
✅ Ver facturas (pendientes/pagadas)
✅ Ver reclamos propios
✅ Crear nuevos reclamos
✅ Dashboard con resumen personal

### OPERARIO
✅ Ver perfil de empleado
✅ Ver reclamos asignados
✅ Filtrar reclamos por estado
✅ Actualizar estado de reclamos
✅ Agregar observaciones
✅ Dashboard con estadísticas de trabajo
✅ Ver reclamos pendientes, en proceso y resueltos hoy

### ADMINISTRADOR
✅ Ver perfil de administrador
✅ Dashboard con estadísticas generales del sistema
✅ Ver todos los socios
✅ Ver todos los reclamos
✅ Asignar operarios a reclamos
✅ Ver estadísticas de:
  - Socios (total, activos, nuevos)
  - Reclamos (total, por estado)
  - Facturación (montos, pendientes, pagadas)
✅ Listar empleados

---

## 🚀 Cómo Probar

### 1. Iniciar el sistema completo
```bash
# Opción A: Script automático
./scripts/start.sh

# Opción B: Manual
# Terminal 1 - Base de datos
docker-compose up postgres -d

# Terminal 2 - Backend
cd backend && npm run dev

# Terminal 3 - Frontend
npm run dev
```

### 2. Acceder al sistema
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/api/salud

### 3. Probar diferentes roles
1. Ir a http://localhost:3000/login
2. Ingresar con cualquier usuario de la lista
3. El sistema redirige automáticamente al dashboard correcto según el rol
4. Explorar las funcionalidades específicas de cada rol

---

## 📊 Endpoints API por Rol

### Autenticación (Todos)
```
POST   /api/auth/login
GET    /api/auth/perfil
POST   /api/auth/verificar
```

### Clientes (CLIENTE)
```
GET    /api/clientes/perfil
GET    /api/clientes/cuentas
GET    /api/clientes/dashboard
GET    /api/clientes/facturas
GET    /api/clientes/facturas/:id
GET    /api/clientes/reclamos
GET    /api/clientes/reclamos/:id
POST   /api/clientes/reclamos
```

### Operarios (OPERARIO)
```
GET    /api/operarios/perfil
GET    /api/operarios/dashboard
GET    /api/operarios/reclamos
GET    /api/operarios/reclamos/:id
PATCH  /api/operarios/reclamos/:id/estado
```

### Administradores (ADMIN)
```
GET    /api/administradores/perfil
GET    /api/administradores/dashboard
GET    /api/administradores/socios
GET    /api/administradores/socios/:id
PUT    /api/administradores/socios/:id
GET    /api/administradores/reclamos
GET    /api/administradores/reclamos/:id
PATCH  /api/administradores/reclamos/:id/asignar
GET    /api/administradores/empleados
```

---

## 🧪 Testing

### Ejecutar todos los tests
```bash
cd backend
npm test

# Con cobertura
npm run test:coverage

# Modo watch
npm run test:watch
```

### Tests Actuales
- ✅ 32 tests pasando
- ✅ Tests unitarios de modelos
- ✅ Tests de integración de APIs
- ✅ Cobertura completa de endpoints de clientes

---

## 💡 Recomendaciones

1. **Probar primero con CLIENTE** (mariaelena.gonzalez@hotmail.com) para ver datos de prueba completos
2. **Luego probar ADMIN** (monica.administradora@cooperativa-ugarte.com.ar) para ver el sistema completo
3. **Finalmente OPERARIO** para ver la gestión de reclamos

---

## 🔐 Seguridad

- ✅ Todas las contraseñas están hasheadas con bcrypt (10 rounds)
- ✅ Autenticación JWT con expiración configurable
- ✅ Middleware de autorización por roles
- ✅ Validación de tokens en cada request protegido
- ✅ Variables sensibles en .env

---

**Última actualización:** 2025-10-01
**Sistema:** Cooperativa Eléctrica "Gobernador Ugarte"
**Estado:** ✅ Totalmente funcional
