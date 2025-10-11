# ARQUITECTURA DE ESTADOS: Cliente vs OTs

## Fecha
9 de octubre de 2025

## Filosofía de Diseño

### Principio Fundamental
**El cliente ve ESTADOS SIMPLES, el sistema interno maneja ESTADOS DETALLADOS.**

---

## ESTADOS PARA EL CLIENTE

El cliente **solo ve 3 estados** que reflejan el progreso de su reclamo:

```
┌──────────────────────────────────────────────────────┐
│                  VISTA DEL CLIENTE                   │
├──────────────────────────────────────────────────────┤
│                                                      │
│  1. PENDIENTE  → "Tu reclamo está en cola"          │
│                                                      │
│  2. EN_PROCESO → "Se está trabajando en tu reclamo" │
│                                                      │
│  3. RESUELTO   → "Tu reclamo ha sido resuelto"      │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Características:
-  **Simplicidad**: Solo 3 estados fáciles de entender
-  **Claridad**: Nombres autoexplicativos
-  **Consistencia**: Mismos estados para reclamos técnicos y administrativos
-  **UX**: Cliente no necesita conocer complejidad interna

---

## ESTADOS PARA ÓRDENES DE TRABAJO

Las OTs manejan **estados detallados** según el tipo:

### 1. OTs TÉCNICAS (con operario asignado)

```
┌─────────────────────────────────────────────────────┐
│              OTs TÉCNICAS (empleado_id)             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  PENDIENTE  → Creada, esperando asignación         │
│       ↓                                             │
│  ASIGNADA   → Operario asignado, no comenzó        │
│       ↓                                             │
│  EN_PROCESO → Operario trabajando activamente      │
│       ↓                                             │
│  COMPLETADA → Trabajo terminado, operario completó │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 2. OTs ADMINISTRATIVAS (empleado_id = NULL)

```
┌─────────────────────────────────────────────────────┐
│         OTs ADMINISTRATIVAS (empleado_id NULL)      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  PENDIENTE  → Creada, esperando atención           │
│       ↓                                             │
│  EN_PROCESO → Administrador procesando             │
│       ↓                                             │
│  CERRADO    → Administrador completó y cerró       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Diferencia clave**: 
- OTs técnicas NO usan `CERRADO` (usan `COMPLETADA`)
- OTs administrativas NO usan `ASIGNADA` ni `COMPLETADA` (usan `CERRADO`)

---

## MAPEO: Estados OT → Estados Cliente

### Tabla de Conversión

| Estado OT (Interno) | Estado Cliente (Vista) | Tipo OT |
|---------------------|------------------------|---------|
| `PENDIENTE` | `PENDIENTE` | Ambas |
| `ASIGNADA` | `EN_PROCESO` | Solo técnica |
| `EN_PROCESO` | `EN_PROCESO` | Ambas |
| `COMPLETADA` | `RESUELTO` | Solo técnica |
| `CERRADO` | `RESUELTO` | Solo administrativa |

### Lógica de Conversión (Backend)

```javascript
function mapearEstadoParaCliente(estadoOT, esAdministrativa) {
  switch (estadoOT) {
    case 'PENDIENTE':
      return 'PENDIENTE';
    
    case 'ASIGNADA':    // Solo técnicas
    case 'EN_PROCESO':  // Ambas
      return 'EN_PROCESO';
    
    case 'COMPLETADA':  // Solo técnicas
    case 'CERRADO':     // Solo administrativas
      return 'RESUELTO';
    
    default:
      return 'PENDIENTE';
  }
}
```

---

## FLUJOS DE ESTADOS

### Flujo 1: Reclamo TÉCNICO

```
CLIENTE VE:        PENDIENTE → EN_PROCESO → EN_PROCESO → RESUELTO
                      ↓            ↓            ↓           ↓
OT INTERNA:        PENDIENTE → ASIGNADA → EN_PROCESO → COMPLETADA
                      ↓            ↓            ↓           ↓
ACCIÓN:           Creación    Asignar     Empezar      Terminar
                              operario    trabajo      trabajo
```

**Ejemplo práctico:**
1. Cliente crea reclamo "Corte de luz" 
   - Cliente ve: `PENDIENTE`
   - OT: `PENDIENTE`

2. Administrador asigna operario
   - Cliente ve: `EN_PROCESO` (trabajando en ello)
   - OT: `ASIGNADA` (operario asignado)

3. Operario comienza trabajo
   - Cliente ve: `EN_PROCESO` (sigue trabajando)
   - OT: `EN_PROCESO` (trabajando activamente)

4. Operario termina
   - Cliente ve: `RESUELTO` (problema resuelto)
   - OT: `COMPLETADA` (trabajo completado)

---

### Flujo 2: Reclamo ADMINISTRATIVO

```
CLIENTE VE:        PENDIENTE → EN_PROCESO → RESUELTO
                      ↓            ↓           ↓
OT INTERNA:        PENDIENTE → EN_PROCESO → CERRADO
                      ↓            ↓           ↓
ACCIÓN:           Creación    Admin      Admin
                              comienza   completa
```

**Ejemplo práctico:**
1. Cliente crea reclamo "Error en factura"
   - Cliente ve: `PENDIENTE`
   - OT: `PENDIENTE`

2. Admin comienza a procesar
   - Cliente ve: `EN_PROCESO`
   - OT: `EN_PROCESO`

3. Admin resuelve y cierra
   - Cliente ve: `RESUELTO`
   - OT: `CERRADO`

---

## NORMALIZACIÓN NECESARIA

### Problema Actual

En la base de datos existen estados inconsistentes:
-  `EN CURSO` (con espacio) - debería ser `EN_PROCESO`
-  `CERRADO` en reclamos - debería ser `RESUELTO`
-  Mapeo inconsistente OT ↔ Reclamo

### Estados a Normalizar

#### Tabla RECLAMO (Vista del cliente):
```sql
-- Estados permitidos:
'PENDIENTE'   -- Esperando atención
'EN_PROCESO'  -- Siendo procesado (interno: ASIGNADA, EN_PROCESO)
'RESUELTO'    -- Completado (interno: COMPLETADA, CERRADO)

-- Estados a eliminar:
'EN CURSO'    → Reemplazar por 'EN_PROCESO'
'CERRADO'     → Reemplazar por 'RESUELTO'
```

#### Tabla ORDEN_TRABAJO (Vista interna):
```sql
-- OTs TÉCNICAS (empleado_id NOT NULL):
'PENDIENTE'   -- Sin asignar
'ASIGNADA'    -- Operario asignado
'EN_PROCESO'  -- Operario trabajando
'COMPLETADA'  -- Trabajo terminado

-- OTs ADMINISTRATIVAS (empleado_id IS NULL):
'PENDIENTE'   -- Sin atender
'EN_PROCESO'  -- Admin procesando
'CERRADO'     -- Admin completó

-- Estados a eliminar:
'EN CURSO'    → Reemplazar por 'EN_PROCESO'
```

---

## IMPLEMENTACIÓN

### Paso 1: Script de Normalización

```sql
-- Normalizar estados en tabla RECLAMO
UPDATE reclamo 
SET estado = 'EN_PROCESO' 
WHERE estado = 'EN CURSO';

UPDATE reclamo 
SET estado = 'RESUELTO' 
WHERE estado = 'CERRADO';

-- Normalizar estados en tabla ORDEN_TRABAJO
UPDATE orden_trabajo 
SET estado = 'EN_PROCESO' 
WHERE estado = 'EN CURSO';
```

### Paso 2: Actualizar Lógica Backend

#### Archivo: `backend/models/Reclamo.js`

Agregar método para convertir estado OT → estado Cliente:

```javascript
static estadoParaCliente(estadoOT) {
  switch (estadoOT) {
    case 'PENDIENTE':
      return 'PENDIENTE';
    case 'ASIGNADA':
    case 'EN_PROCESO':
      return 'EN_PROCESO';
    case 'COMPLETADA':
    case 'CERRADO':
      return 'RESUELTO';
    default:
      return 'PENDIENTE';
  }
}
```

### Paso 3: Modificar Consultas para Cliente

Cuando el cliente consulta sus reclamos, devolver estado mapeado:

```javascript
// En obtenerPorSocio()
SELECT 
  r.reclamo_id,
  r.descripcion,
  ot.estado as estado_ot,
  CASE ot.estado
    WHEN 'PENDIENTE' THEN 'PENDIENTE'
    WHEN 'ASIGNADA' THEN 'EN_PROCESO'
    WHEN 'EN_PROCESO' THEN 'EN_PROCESO'
    WHEN 'COMPLETADA' THEN 'RESUELTO'
    WHEN 'CERRADO' THEN 'RESUELTO'
    ELSE 'PENDIENTE'
  END as estado
FROM reclamo r
LEFT JOIN orden_trabajo ot ON r.reclamo_id = ot.reclamo_id
WHERE ...
```

### Paso 4: Mantener Sincronización

Modificar métodos que cambian estado de OT para actualizar reclamo:

```javascript
// En marcarEnProcesoAdministrativa()
await client.query('BEGIN');

// Actualizar OT
UPDATE orden_trabajo SET estado = 'EN_PROCESO' ...

// Actualizar Reclamo con estado mapeado
UPDATE reclamo SET estado = 'EN_PROCESO' ...

await client.query('COMMIT');
```

---

## VENTAJAS DE ESTA ARQUITECTURA

### 1. Separación de Responsabilidades
- **Cliente**: Solo necesita saber "¿está resuelto mi problema?"
- **Operarios**: Necesitan saber estado detallado del trabajo
- **Administración**: Necesita métricas y seguimiento detallado

### 2. Flexibilidad Interna
El sistema puede agregar más estados internos sin afectar al cliente:
- `ASIGNADA_URGENTE`
- `EN_PROCESO_REVISION`
- `COMPLETADA_PENDIENTE_CIERRE`

Cliente siempre ve solo: PENDIENTE, EN_PROCESO, RESUELTO

### 3. Claridad en Comunicación
```
 MAL: "Tu reclamo está en estado ASIGNADA"
        → Cliente: "¿Qué significa ASIGNADA?"

 BIEN: "Tu reclamo está EN_PROCESO"
         → Cliente: "Ah, están trabajando en ello"
```

### 4. Independencia de Cambios
Si cambiamos workflow interno (ej: agregar estado "REVISIÓN"), no afecta frontend del cliente.

---

## RESTRICCIONES Y REGLAS

### Regla 1: Cliente NUNCA ve estados internos
```javascript
//  MAL
return { estado: ot.estado }; // Expone 'ASIGNADA'

//  BIEN
return { estado: mapearEstadoParaCliente(ot.estado) };
```

### Regla 2: Sincronización Automática
Cualquier cambio en OT debe reflejarse en reclamo:
```javascript
// Siempre usar transacciones
await client.query('BEGIN');
updateOT(...);
updateReclamo(...); // Estado mapeado
await client.query('COMMIT');
```

### Regla 3: Estados Permitidos por Tipo

```javascript
function validarEstadoOT(estado, esAdministrativa) {
  const estadosTecnicas = ['PENDIENTE', 'ASIGNADA', 'EN_PROCESO', 'COMPLETADA'];
  const estadosAdmin = ['PENDIENTE', 'EN_PROCESO', 'CERRADO'];
  
  if (esAdministrativa) {
    return estadosAdmin.includes(estado);
  } else {
    return estadosTecnicas.includes(estado);
  }
}
```

---

## EJEMPLOS DE USO

### Ejemplo 1: Dashboard del Cliente

```jsx
// Cliente ve solo 3 badges posibles
<Badge className={getBadgeColor(reclamo.estado)}>
  {reclamo.estado} {/* PENDIENTE, EN_PROCESO, o RESUELTO */}
</Badge>
```

### Ejemplo 2: Panel de Operario

```jsx
// Operario ve estados detallados
<Select value={ot.estado}>
  <SelectItem value="PENDIENTE">Pendiente</SelectItem>
  <SelectItem value="ASIGNADA">Asignada a mí</SelectItem>
  <SelectItem value="EN_PROCESO">Trabajando</SelectItem>
  <SelectItem value="COMPLETADA">Completada</SelectItem>
</Select>
```

### Ejemplo 3: Panel de Admin (OTs Administrativas)

```jsx
// Admin ve estados específicos
<Select value={ot.estado}>
  <SelectItem value="PENDIENTE">Pendiente</SelectItem>
  <SelectItem value="EN_PROCESO">Procesando</SelectItem>
  <SelectItem value="CERRADO">Cerrado</SelectItem>
</Select>
```

---

## MIGRACIÓN PASO A PASO

### Fase 1: Normalización de Datos 
1. Script de normalización de estados
2. Verificación de consistencia
3. Backup de datos

### Fase 2: Backend (Próximo) 
1. Agregar función `mapearEstadoParaCliente()`
2. Modificar consultas de cliente para usar mapeo
3. Mantener consultas admin/operario sin cambios
4. Actualizar sincronización OT ↔ Reclamo

### Fase 3: Frontend (Después) 
1. Verificar que cliente solo vea 3 estados
2. Actualizar badges y filtros
3. Actualizar mensajes según estado
4. Testing end-to-end

### Fase 4: Validación (Final) 
1. Constraints en BD para validar estados
2. Tests automáticos
3. Documentación de API
4. Guía para nuevos desarrolladores

---

## RESUMEN EJECUTIVO

| Aspecto | Cliente | OTs Internas |
|---------|---------|--------------|
| **Estados** | 3 simples | 4-5 detallados |
| **Nombres** | PENDIENTE, EN_PROCESO, RESUELTO | PENDIENTE, ASIGNADA, EN_PROCESO, COMPLETADA, CERRADO |
| **Propósito** | Comunicación clara | Workflow técnico |
| **Cambios** | Muy estable | Puede evolucionar |
| **Visibilidad** | Frontend cliente | Backend + Admin/Operario |

---

**Fecha**: 9 de octubre de 2025  
**Estado**:  DISEÑO COMPLETADO - PENDIENTE IMPLEMENTACIÓN  
**Próximo Paso**: Ejecutar script de normalización de estados
