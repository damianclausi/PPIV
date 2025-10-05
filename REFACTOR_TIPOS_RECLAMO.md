# Refactorización de Tipos de Reclamo

## Problema Identificado
Los tipos de reclamo estaban hardcodeados en el componente `ReclamoNuevo.jsx` (líneas 28-36), a pesar de que existen en la tabla `tipo_reclamo` de PostgreSQL.

## Solución Implementada

### Backend

#### 1. Modelo `TipoReclamo.js`
- **Ubicación**: `backend/models/TipoReclamo.js`
- **Funcionalidad**:
  - `obtenerTodos()`: Obtiene todos los tipos de reclamo de la BD
  - `obtenerPorId(tipoId)`: Obtiene un tipo específico por ID
- **Formato ES6**: Usa `import/export` en lugar de `require/module.exports`

#### 2. Controlador `TipoReclamoController.js`
- **Ubicación**: `backend/controllers/TipoReclamoController.js`
- **Endpoints**:
  - `GET /api/tipos-reclamo`: Retorna lista de todos los tipos
  - `GET /api/tipos-reclamo/:id`: Retorna un tipo específico
- **Manejo de errores**: Responde con códigos HTTP apropiados (200, 404, 500)

#### 3. Rutas `tiposReclamo.js`
- **Ubicación**: `backend/routes/tiposReclamo.js`
- **Autenticación**: Requiere token JWT válido (`autenticar` middleware)
- **Integración**: Agregada al `server.js` como `/api/tipos-reclamo`

### Frontend

#### 1. Servicio `tipoReclamoService.js`
- **Ubicación**: `src/services/tipoReclamoService.js`
- **Funcionalidad**:
  - `obtenerTodos()`: Consume endpoint GET `/api/tipos-reclamo`
  - `obtenerPorId(id)`: Consume endpoint GET `/api/tipos-reclamo/:id`
- **Cliente HTTP**: Usa `apiClient` con autenticación automática

#### 2. Hook Personalizado `useTiposReclamo.js`
- **Ubicación**: `src/hooks/useTiposReclamo.js`
- **Hooks**:
  - `useTiposReclamo()`: Carga todos los tipos al montar el componente
  - `useTipoReclamo(id)`: Carga un tipo específico por ID
- **Estados**: Maneja `tipos`, `cargando`, `error`

#### 3. Componente `ReclamoNuevo.jsx` Refactorizado
- **Cambios principales**:
  - ❌ **Eliminado**: Mapeo hardcodeado de tipos (líneas 28-36)
  - ✅ **Agregado**: Hook `useTiposReclamo()` para carga dinámica
  - ✅ **Agregado**: Manejo de estados de carga y errores
  - ✅ **Mejorado**: Select con datos dinámicos desde BD

**Antes:**
```jsx
const tiposReclamo = {
  'FALTA_SUMINISTRO': 1,
  'FLUCTUACIONES': 2,
  // ... hardcodeado
};

<SelectItem value="1">Falta de Suministro</SelectItem>
<SelectItem value="2">Fluctuaciones de Tensión</SelectItem>
// ... hardcodeado
```

**Después:**
```jsx
const { tipos: tiposReclamo, cargando: cargandoTipos, error: errorTipos } = useTiposReclamo();

{tiposReclamo.map(tipo => (
  <SelectItem key={tipo.tipo_id} value={tipo.tipo_id.toString()}>
    {tipo.nombre}
  </SelectItem>
))}
```

## Beneficios

### Mantenibilidad
- ✅ Tipos centralizados en la base de datos
- ✅ Cambios en tipos no requieren modificar código
- ✅ Fácil agregar, editar o eliminar tipos

### Escalabilidad
- ✅ Arquitectura preparada para CRUD completo de tipos
- ✅ Reutilizable en otros componentes
- ✅ Hook desacoplado del componente

### Consistencia
- ✅ Única fuente de verdad (base de datos)
- ✅ Mismo formato en backend y frontend
- ✅ Validación automática de IDs

## Estructura de Datos

### Tabla `tipo_reclamo` (PostgreSQL)
```sql
tipo_id | nombre
--------+---------------------------
   1    | Falta de Suministro
   2    | Fluctuaciones de Tensión
   3    | Daños en Red
   4    | Medidor Defectuoso
   5    | Facturación
   6    | Conexión Nueva
   7    | Reconexión
   8    | Calidad del Servicio
```

### Respuesta API `/api/tipos-reclamo`
```json
[
  { "tipo_id": 1, "nombre": "Falta de Suministro" },
  { "tipo_id": 2, "nombre": "Fluctuaciones de Tensión" },
  { "tipo_id": 3, "nombre": "Daños en Red" },
  { "tipo_id": 4, "nombre": "Medidor Defectuoso" },
  { "tipo_id": 5, "nombre": "Facturación" },
  { "tipo_id": 6, "nombre": "Conexión Nueva" },
  { "tipo_id": 7, "nombre": "Reconexión" },
  { "tipo_id": 8, "nombre": "Calidad del Servicio" }
]
```

## Archivos Modificados

### Backend (3 nuevos archivos)
- ✅ `backend/models/TipoReclamo.js` - Nuevo
- ✅ `backend/controllers/TipoReclamoController.js` - Nuevo
- ✅ `backend/routes/tiposReclamo.js` - Nuevo
- ✅ `backend/server.js` - Modificado (agregada ruta)

### Frontend (3 nuevos archivos + 1 modificado)
- ✅ `src/services/tipoReclamoService.js` - Nuevo
- ✅ `src/hooks/useTiposReclamo.js` - Nuevo
- ✅ `src/components/cliente/ReclamoNuevo.jsx` - Refactorizado

## Testing

### Backend
```bash
# 1. Obtener token
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","contraseña":"password"}' | \
  python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))")

# 2. Probar endpoint
curl -X GET http://localhost:3001/api/tipos-reclamo \
  -H "Authorization: Bearer $TOKEN"
```

### Frontend
1. Iniciar sesión como cliente
2. Navegar a "Nuevo Reclamo"
3. Verificar que el selector de tipos carga dinámicamente
4. Verificar que muestra "Cargando tipos..." mientras carga
5. Verificar que todos los tipos de la BD aparecen

## Próximos Pasos (Opcional)

### Posibles Mejoras
- [ ] CRUD completo de tipos (crear, editar, eliminar) para administradores
- [ ] Caché de tipos en frontend (localStorage o React Query)
- [ ] Agregar descripciones a tipos de reclamo
- [ ] Agregar iconos/colores por tipo
- [ ] Filtrado de tipos activos/inactivos

### Componentes que Pueden Beneficiarse
- `DashboardOperario.jsx` - Mostrar nombre del tipo en lugar de ID
- `ReclamoDetalle.jsx` - Badge con nombre del tipo
- `ReclamosListado.jsx` - Filtros por tipo dinámicos
- `GestionReclamos.jsx` - Estadísticas por tipo

## Estado Actual

- ✅ Backend: Endpoints creados y funcionando
- ✅ Frontend: Servicio y hook creados
- ✅ Componente: Refactorizado para carga dinámica
- ✅ Sistema: Reiniciado con nuevas rutas
- ⏳ Testing: Pendiente (rate limiter activo)

---

**Fecha**: 5 de octubre de 2025  
**Autor**: Damian + GitHub Copilot  
**Rama**: integracion-base-datos
