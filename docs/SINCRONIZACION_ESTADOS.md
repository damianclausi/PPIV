# SINCRONIZACIÓN DE ESTADOS: RECLAMOS ↔ ÓRDENES DE TRABAJO

## Problema Identificado

Los operarios podían cambiar el estado de un reclamo desde el dashboard Kanban (arrastrando a "En Curso"), pero esto **NO sincronizaba** con la Orden de Trabajo asociada, generando inconsistencias.

---

## Solución Implementada

### Estados Equivalentes

| Estado en RECLAMO | Estado en ORDEN_TRABAJO | Vista del Usuario |
|-------------------|-------------------------|-------------------|
| PENDIENTE | PENDIENTE | Pendiente |
| **EN_PROCESO** | **EN_PROCESO** | **En Curso** |
| RESUELTO | COMPLETADA | Resuelto |

**Nota:** `EN_CURSO` en el frontend se normaliza a `EN_PROCESO` en el backend.

---

## Sincronización Automática

### 1. Cuando el Operario Arrastra a "En Curso"

**Frontend (`DashboardOperario.jsx`):**
```javascript
// El operario arrastra el reclamo a "En Curso"
handleDrop(e, 'en_curso')
  ↓
// Se normaliza a EN_PROCESO antes de enviar
operarioService.actualizarEstadoReclamo(id, 'EN_PROCESO')
```

**Backend (`Reclamo.actualizarEstado`):**
```javascript
// 1. Actualiza el estado del reclamo
UPDATE reclamo SET estado = 'EN_PROCESO' WHERE reclamo_id = $1

// 2. SINCRONIZA automáticamente con la OT
UPDATE orden_trabajo 
SET estado = 'EN_PROCESO' 
WHERE reclamo_id = $1 
  AND estado IN ('PENDIENTE', 'ASIGNADA')
```

**Resultado:**
- ✅ Reclamo → `EN_PROCESO`
- ✅ OT → `EN_PROCESO`
- ✅ Ambos sincronizados

---

### 2. Cuando el Operario Completa la OT

**Método:** `OrdenTrabajo.completarTrabajo()`

```javascript
// 1. Actualiza la OT
UPDATE orden_trabajo 
SET estado = 'COMPLETADA', fecha_cierre = NOW() 
WHERE ot_id = $1

// 2. Actualiza el reclamo asociado
UPDATE reclamo 
SET estado = 'RESUELTO', fecha_cierre = NOW() 
WHERE reclamo_id = (SELECT reclamo_id FROM orden_trabajo WHERE ot_id = $1)
```

**Resultado:**
- ✅ OT → `COMPLETADA`
- ✅ Reclamo → `RESUELTO`
- ✅ Ambos sincronizados

---

## Flujo Completo de Estados

### Caso 1: Reclamo Técnico (con OT)

```
┌─────────────┐
│  RECLAMO    │
│  PENDIENTE  │
└──────┬──────┘
       │ Admin asigna operario
       │ (crea OT con empleado_id)
       ▼
┌─────────────┐     ┌─────────────┐
│  RECLAMO    │     │     OT      │
│  PENDIENTE  │◄────┤  ASIGNADA   │
└──────┬──────┘     └──────┬──────┘
       │                   │
       │ Operario arrastra │
       │ a "En Curso"      │
       ▼                   ▼
┌─────────────┐     ┌─────────────┐
│  RECLAMO    │◄────┤     OT      │
│ EN_PROCESO  │────►│ EN_PROCESO  │ ← SINCRONIZADO
└──────┬──────┘     └──────┬──────┘
       │                   │
       │ Operario completa │
       │ la OT             │
       ▼                   ▼
┌─────────────┐     ┌─────────────┐
│  RECLAMO    │◄────┤     OT      │
│  RESUELTO   │────►│ COMPLETADA  │ ← SINCRONIZADO
└─────────────┘     └─────────────┘
```

### Caso 2: Itinerario de Cuadrillas

```
┌─────────────┐     ┌─────────────┐
│  RECLAMO    │     │     OT      │
│  PENDIENTE  │◄────┤  PENDIENTE  │
└─────────────┘     │ empleado_id │
                    │    NULL     │
                    └──────┬──────┘
                           │ Admin asigna a cuadrilla
                           ▼
                    ┌─────────────┐
                    │     OT      │
                    │  PENDIENTE  │
                    │ (itinerario)│
                    └──────┬──────┘
                           │ Operario "toma" OT
                           ▼
┌─────────────┐     ┌─────────────┐
│  RECLAMO    │     │     OT      │
│  PENDIENTE  │     │  ASIGNADA   │
└──────┬──────┘     │ empleado_id │
       │            │     = 10    │
       │            └──────┬──────┘
       │ Operario pone     │
       │ "En Curso"        │
       ▼                   ▼
┌─────────────┐     ┌─────────────┐
│  RECLAMO    │◄────┤     OT      │
│ EN_PROCESO  │────►│ EN_PROCESO  │ ← SINCRONIZADO
└──────┬──────┘     └──────┬──────┘
       │                   │
       │ Compañero de      │
       │ cuadrilla completa│
       ▼                   ▼
┌─────────────┐     ┌─────────────┐
│  RECLAMO    │◄────┤     OT      │
│  RESUELTO   │────►│ COMPLETADA  │ ← SINCRONIZADO
└─────────────┘     └─────────────┘
```

---

## Normalización Frontend ↔ Backend

### Frontend (Vista del Usuario)

**Estados en UI:**
- "Pendiente"
- "En Curso" ← Término amigable
- "Resuelto"

**Filtros en Dashboard:**
```javascript
const reclamosEnCurso = reclamos.filter(r => 
  r.estado === 'EN_CURSO' || 
  r.estado === 'EN_PROCESO'  // Acepta ambos
);
```

### Backend (Base de Datos)

**Estados en tablas:**
- `PENDIENTE`
- `EN_PROCESO` ← Término técnico unificado
- `RESUELTO`

**Normalización automática:**
```javascript
// En operarioService.js
const estadoNormalizado = estado === 'en_curso' || estado === 'EN_CURSO' 
  ? 'EN_PROCESO' 
  : estado.toUpperCase();
```

---

## Validaciones y Edge Cases

### ⚠️ Caso 1: OT ya está EN_PROCESO

Si el reclamo se pone EN_PROCESO pero la OT ya estaba EN_PROCESO:
```sql
UPDATE orden_trabajo ... WHERE estado IN ('PENDIENTE', 'ASIGNADA')
-- No se actualiza (0 rows affected)
-- Log: "No se encontró OT PENDIENTE/ASIGNADA (puede ya estar EN_PROCESO)"
```

**Resultado:** No hay error, simplemente no actualiza (ya está sincronizado).

### ⚠️ Caso 2: OT ya está COMPLETADA

Si el reclamo se intenta poner EN_PROCESO pero la OT ya está COMPLETADA:
```sql
UPDATE orden_trabajo ... WHERE estado IN ('PENDIENTE', 'ASIGNADA')
-- No se actualiza (0 rows affected)
```

**Resultado:** No hay error, la OT mantiene su estado final.

### ⚠️ Caso 3: Reclamo sin OT (Administrativo)

Los reclamos administrativos se manejan distinto:
- **OT con `empleado_id = NULL`** (Admin los resuelve directamente)
- No se sincronizan desde el dashboard de operario
- El admin los gestiona desde `/dashboard/admin/reclamos-comerciales`

---

## Logs de Auditoría

### Log de Sincronización Exitosa
```
✅ OT #123 sincronizada a EN_PROCESO (desde reclamo #456)
```

### Log de OT ya Sincronizada
```
⚠️ No se encontró OT PENDIENTE/ASIGNADA para reclamo #456 
   (puede ya estar EN_PROCESO o COMPLETADA)
```

### Log de Cierre por Cuadrilla
```
✅ OT #123 completada por María González 
   (originalmente asignada a Juan Pérez)
```

---

## Testing Recomendado

### Test 1: Arrastrar a "En Curso"
1. Login como operario
2. Dashboard → Ver reclamo PENDIENTE
3. Arrastrar a columna "En Curso"
4. Verificar en BD:
   ```sql
   SELECT r.estado as estado_reclamo, ot.estado as estado_ot
   FROM reclamo r
   INNER JOIN orden_trabajo ot ON r.reclamo_id = ot.reclamo_id
   WHERE r.reclamo_id = 456;
   ```
   **Resultado esperado:**
   - `estado_reclamo = 'EN_PROCESO'`
   - `estado_ot = 'EN_PROCESO'`

### Test 2: Completar OT
1. Dashboard operario → "Mis OTs"
2. Seleccionar OT EN_PROCESO
3. Completar con observaciones
4. Verificar ambos estados:
   - `estado_reclamo = 'RESUELTO'`
   - `estado_ot = 'COMPLETADA'`

### Test 3: Reintentar sincronización
1. Poner reclamo EN_PROCESO (sincroniza OT)
2. Volver a poner reclamo EN_PROCESO
3. Verificar que no genera error
4. Verificar log: "No se encontró OT PENDIENTE/ASIGNADA..."

---

## Archivos Modificados

### Backend
1. **`backend/models/Reclamo.js`**
   - Método `actualizarEstado()` con transacción
   - Sincronización automática con OT

### Frontend
2. **`src/services/operarioService.js`**
   - Normalización `EN_CURSO` → `EN_PROCESO`

3. **`src/components/DashboardOperario.jsx`**
   - Filtros actualizados para aceptar `EN_PROCESO`
   - Badge actualizado para mostrar "En Curso"

---

## Conclusión

La sincronización automática garantiza que:
- ✅ El estado del reclamo y su OT siempre estén alineados
- ✅ Los operarios puedan gestionar desde el dashboard Kanban
- ✅ Las OTs reflejen el estado real del trabajo
- ✅ No haya inconsistencias en métricas y reportes

---

**Institución:** IFTS 29 (Instituto de Formación Técnica Superior Número 29)  
**Carrera:** Tecnicatura Superior en Desarrollo de Software a Distancia  
**Proyecto:** Sistema de Gestión de Cooperativa Eléctrica - PPIV
