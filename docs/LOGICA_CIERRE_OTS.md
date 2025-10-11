# LÓGICA DE CIERRE DE ÓRDENES DE TRABAJO

## Sistema de Permisos de Cierre

### Tipos de OTs

#### 1. OTs de Itinerario (Cuadrillas)
**Identificación:** Contienen `[ITINERARIO]` en observaciones

**Flujo:**
```
Admin → Asigna a CUADRILLA → empleado_id = NULL
↓
Operario de cuadrilla → TOMA la OT → empleado_id = operario_id
↓
Cualquier operario de la MISMA CUADRILLA → Puede CERRAR
```

**Permisos de Cierre:**
- ✅ Cualquier operario de la misma cuadrilla puede cerrar
- ❌ Operarios de otras cuadrillas NO pueden cerrar
- ✅ Se registra quién tomó y quién cerró

**Validación:**
```sql
-- Verificar que pertenezcan a la misma cuadrilla
ec1.cuadrilla_id = ec2.cuadrilla_id
WHERE ec1.empleado_id = ot.empleado_id    -- Operario asignado
  AND ec2.empleado_id = $operario_cierre  -- Operario que cierra
  AND ec1.activa = true 
  AND ec2.activa = true
```

#### 2. OTs Directas (Sin Itinerario)
**Identificación:** NO contienen `[ITINERARIO]` en observaciones

**Flujo:**
```
Admin/Sistema → Asigna directamente → empleado_id = operario_id
↓
Solo ese operario → Puede CERRAR
```

**Permisos de Cierre:**
- ✅ Solo el operario asignado puede cerrar
- ❌ Otros operarios NO pueden cerrar (aunque sean de la misma cuadrilla)

---

## Trazabilidad

### Registro en Observaciones

**Caso 1: Mismo operario toma y cierra**
```
[COMPLETADA POR: Juan Pérez - 11/10/2025 14:30:00]
```

**Caso 2: Un operario toma, otro cierra (mismo equipo)**
```
[TOMADA POR: Juan Pérez | COMPLETADA POR: María González - 11/10/2025 14:30:00]
```

### Campos Actualizados

**En `orden_trabajo`:**
```sql
estado = 'COMPLETADA'
fecha_cierre = CURRENT_TIMESTAMP
observaciones = observaciones_operario + mensaje_cierre
updated_at = CURRENT_TIMESTAMP
```

**En `reclamo`:**
```sql
estado = 'RESUELTO'
fecha_cierre = CURRENT_TIMESTAMP
observaciones_cierre = observaciones_operario
updated_at = CURRENT_TIMESTAMP
```

---

## Casos de Uso

### ✅ Caso 1: Operario completa su propia OT
```
Juan toma OT #123 → empleado_id = 10
Juan completa OT #123 → ✅ Permitido
Resultado: "[COMPLETADA POR: Juan Pérez]"
```

### ✅ Caso 2: Compañero de cuadrilla ayuda a terminar
```
Juan (Cuadrilla A) toma OT #123 → empleado_id = 10
María (Cuadrilla A) completa OT #123 → ✅ Permitido
Resultado: "[TOMADA POR: Juan Pérez | COMPLETADA POR: María González]"
```

### ❌ Caso 3: Operario de otra cuadrilla intenta cerrar
```
Juan (Cuadrilla A) toma OT #123 → empleado_id = 10
Pedro (Cuadrilla B) intenta completar OT #123 → ❌ BLOQUEADO
Error: "Esta OT pertenece a otra cuadrilla. Solo los miembros de la cuadrilla asignada pueden cerrarla."
```

### ❌ Caso 4: OT directa (sin itinerario) - otro intenta cerrar
```
Admin asigna OT #456 a Juan → empleado_id = 10 (SIN [ITINERARIO])
María (misma cuadrilla) intenta completar OT #456 → ❌ BLOQUEADO
Error: "Solo el operario asignado puede cerrar esta OT"
```

---

## Ventajas del Sistema

### 1. Flexibilidad en Campo
- Operarios pueden ayudarse entre sí
- Si uno se enferma, otro puede terminar
- Trabajo en equipo más eficiente

### 2. Control de Seguridad
- Solo cuadrilla asignada puede cerrar
- OTs directas mantienen responsabilidad individual
- No hay cierres accidentales de otras cuadrillas

### 3. Trazabilidad Completa
- Se registra quién tomó originalmente
- Se registra quién cerró finalmente
- Fecha y hora de cierre
- Observaciones del operario

### 4. Auditoría
- Fácil identificar si hubo cambios de operario
- Útil para métricas de colaboración
- Control de desempeño por operario

---

## Implementación Técnica

### Método Principal
**Archivo:** `backend/models/OrdenTrabajo.js`  
**Método:** `completarTrabajo(ot_id, empleado_id, observaciones)`

### Validaciones
1. ✅ Observaciones no vacías
2. ✅ OT existe y está EN_PROCESO
3. ✅ Operario pertenece a cuadrilla activa
4. ✅ Si es itinerario: misma cuadrilla
5. ✅ Si no es itinerario: mismo operario

### Endpoint
**Ruta:** `PUT /api/ot-tecnicas/:id/completar`  
**Auth:** Requiere operario autenticado  
**Body:**
```json
{
  "observaciones": "Se reemplazó el medidor y se verificó conexión..."
}
```

**Response Éxito:**
```json
{
  "success": true,
  "message": "Trabajo completado correctamente",
  "data": { ...ot_completada }
}
```

**Response Error:**
```json
{
  "success": false,
  "message": "Esta OT pertenece a otra cuadrilla..."
}
```

---

## Escenarios Edge Case

### ¿Qué pasa si un operario sale de la cuadrilla?
- Si la OT ya está asignada (empleado_id != NULL), puede completarla
- Si intenta tomar nuevas OTs, se valida cuadrilla activa actual
- No puede tomar/cerrar OTs de cuadrilla anterior

### ¿Qué pasa si se desactiva una cuadrilla?
- OTs en curso (EN_PROCESO) pueden cerrarse
- No se pueden tomar nuevas OTs de esa cuadrilla
- Al listar itinerario, se filtra por cuadrilla activa

### ¿Puede un supervisor cerrar cualquier OT?
- No implementado actualmente
- Se puede agregar validación adicional por rol
- Requeriría modificar lógica de permisos

---

## Testing

### Test Cases Recomendados

1. **Test: Operario cierra su propia OT**
   - Estado inicial: EN_PROCESO, empleado_id = 10
   - Acción: Operario 10 cierra
   - Resultado: ✅ COMPLETADA

2. **Test: Compañero de cuadrilla cierra OT**
   - Estado inicial: EN_PROCESO, empleado_id = 10 (Cuadrilla A)
   - Acción: Operario 11 (Cuadrilla A) cierra
   - Resultado: ✅ COMPLETADA con trazabilidad

3. **Test: Operario de otra cuadrilla intenta cerrar**
   - Estado inicial: EN_PROCESO, empleado_id = 10 (Cuadrilla A)
   - Acción: Operario 20 (Cuadrilla B) intenta cerrar
   - Resultado: ❌ Error bloqueado

4. **Test: OT directa - otro operario intenta cerrar**
   - Estado inicial: EN_PROCESO, empleado_id = 10 (sin [ITINERARIO])
   - Acción: Operario 11 intenta cerrar
   - Resultado: ❌ Error bloqueado

---

**Institución:** IFTS 29 (Instituto de Formación Técnica Superior Número 29)  
**Carrera:** Tecnicatura Superior en Desarrollo de Software a Distancia  
**Proyecto:** Sistema de Gestión de Cooperativa Eléctrica - PPIV
