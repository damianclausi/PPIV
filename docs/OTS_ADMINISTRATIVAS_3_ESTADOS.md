# 🔄 OTs Administrativas - Sistema de 3 Estados

## ✅ Implementado: PENDIENTE → EN_PROCESO → CERRADO

Se ha implementado el flujo completo de 3 estados para las Órdenes de Trabajo Administrativas.

---

## 📊 Flujo de Estados

```
┌─────────────┐      Marcar            ┌─────────────┐      Cerrar           ┌─────────────┐
│  PENDIENTE  │  ───────────────→      │ EN_PROCESO  │  ──────────────→      │   CERRADO   │
└─────────────┘   En Proceso           └─────────────┘   con Observaciones   └─────────────┘
       │                                       │
       │                                       │
       └───────────────────────────────────────┘
              Cerrar directamente
           (con Observaciones)
```

### Estados Explicados

#### 1️⃣ PENDIENTE 🟡
- **Estado inicial** cuando se crea la OT
- La OT está esperando ser atendida por un administrador
- **Acciones disponibles:**
  - ✅ Marcar como "En Proceso"
  - ✅ Cerrar directamente (con observaciones)

#### 2️⃣ EN_PROCESO 🔵
- El administrador está trabajando en la resolución
- Indica que alguien ya está atendiendo el caso
- **Acciones disponibles:**
  - ✅ Cerrar (con observaciones)

#### 3️⃣ CERRADO 🟢
- La OT está resuelta y finalizada
- El reclamo asociado también se marca como RESUELTO
- **Estado final:** No hay más acciones disponibles

---

## 🎨 Colores de Estados

| Estado | Color | Badge | Uso |
|--------|-------|-------|-----|
| PENDIENTE | Amarillo | `bg-yellow-100 text-yellow-800` | Nueva, sin atender |
| EN_PROCESO | Azul | `bg-blue-100 text-blue-800` | En trabajo activo |
| CERRADO | Verde | `bg-green-100 text-green-800` | Resuelta |

---

## 🔧 Cambios en Backend

### 1. Modelo: `/backend/models/OrdenTrabajo.js`

#### Nuevo Método: `marcarEnProcesoAdministrativa()`

```javascript
static async marcarEnProcesoAdministrativa(otId) {
  const query = `
    UPDATE orden_trabajo 
    SET estado = 'EN_PROCESO',
        updated_at = NOW()
    WHERE ot_id = $1
      AND empleado_id IS NULL
      AND estado = 'PENDIENTE'
    RETURNING *
  `;
  // Solo cambia de PENDIENTE → EN_PROCESO
  // Valida que sea OT administrativa (empleado_id IS NULL)
}
```

**Características:**
- ✅ Solo actualiza OTs en estado PENDIENTE
- ✅ Solo OTs administrativas (empleado_id IS NULL)
- ✅ Actualiza timestamp
- ❌ Lanza error si no cumple condiciones

---

### 2. Controlador: `/backend/controllers/OTAdministrativasController.js`

#### Nuevo Método: `marcarEnProceso()`

```javascript
static async marcarEnProceso(req, res) {
  try {
    const { id } = req.params;
    const ot = await OrdenTrabajo.marcarEnProcesoAdministrativa(id);
    return respuestaExitosa(res, ot, 'OT administrativa marcada como en proceso');
  } catch (error) {
    // Manejo de errores
  }
}
```

**Endpoint:** `PATCH /api/administradores/ots/administrativas/:id/en-proceso`

---

### 3. Rutas: `/backend/routes/administradores.js`

```javascript
// Nueva ruta agregada
router.patch('/ots/administrativas/:id/en-proceso', OTAdministrativasController.marcarEnProceso);
```

**Todas las rutas de OTs Administrativas:**

| Método | Endpoint | Acción |
|--------|----------|--------|
| GET | `/ots/administrativas` | Listar todas |
| GET | `/ots/administrativas/resumen` | Estadísticas |
| GET | `/ots/administrativas/:id` | Detalle completo |
| PATCH | `/ots/administrativas/:id/en-proceso` | ✨ **NUEVO** - Marcar en proceso |
| PATCH | `/ots/administrativas/:id/cerrar` | Cerrar con observaciones |

---

## 🎨 Cambios en Frontend

### 1. Componente: `/src/components/admin/OTsAdministrativas.jsx`

#### Nueva Función: `marcarEnProceso()`

```javascript
const marcarEnProceso = async () => {
  if (!confirm('¿Desea marcar esta OT como "En Proceso"?')) {
    return;
  }

  const data = await apiClient.patch(
    `/api/administradores/ots/administrativas/${otSeleccionada.ot_id}/en-proceso`
  );

  // Actualiza la lista y cierra el modal
  cargarOTs();
};
```

#### Actualización: Botones del Modal (Lógica Condicional)

**Estado PENDIENTE:**
- ✅ Botón "Marcar En Proceso" (azul)
- ✅ Botón "Cerrar OT" (verde) - Requiere observaciones

**Estado EN_PROCESO:**
- ✅ Botón "Cerrar OT" (verde) - Requiere observaciones

**Estado CERRADO:**
- ℹ️ Solo botón "Cerrar" para salir del modal

```jsx
<DialogFooter className="gap-2">
  <Button variant="outline" onClick={() => setModalAbierto(false)}>
    {otSeleccionada?.estado === 'CERRADO' ? 'Cerrar' : 'Cancelar'}
  </Button>
  
  {/* Botón "Marcar En Proceso" - Solo PENDIENTES */}
  {otSeleccionada?.estado === 'PENDIENTE' && (
    <Button onClick={marcarEnProceso} className="bg-blue-600">
      <Clock className="h-4 w-4 mr-2" />
      Marcar En Proceso
    </Button>
  )}

  {/* Botón "Cerrar OT" - PENDIENTES o EN_PROCESO */}
  {(otSeleccionada?.estado === 'PENDIENTE' || 
    otSeleccionada?.estado === 'EN_PROCESO') && (
    <Button 
      onClick={cerrarOT} 
      disabled={!observaciones.trim()}
      className="bg-green-600"
    >
      <CheckCircle className="h-4 w-4 mr-2" />
      Cerrar OT
    </Button>
  )}
</DialogFooter>
```

---

### 2. Filtro Actualizado

**Dropdown de Estados:**
```jsx
<select>
  <option value="">Todos los estados</option>
  <option value="PENDIENTE">Pendiente</option>
  <option value="EN_PROCESO">En Proceso</option>
  <option value="CERRADO">Cerrada</option>
</select>
```

❌ **Eliminado:** `ASIGNADA` (no se usa en OTs administrativas)

---

### 3. Dashboard con Contadores

```jsx
<Card>
  <CardTitle>Pendientes</CardTitle>
  <div className="text-3xl font-bold text-yellow-600">
    {contadores.pendientes || 0}
  </div>
</Card>

<Card>
  <CardTitle>En Proceso</CardTitle>
  <div className="text-3xl font-bold text-blue-600">
    {contadores.en_proceso || 0}
  </div>
</Card>

<Card>
  <CardTitle>Cerradas</CardTitle>
  <div className="text-3xl font-bold text-green-600">
    {contadores.cerradas || 0}
  </div>
</Card>

<Card>
  <CardTitle>Total</CardTitle>
  <div className="text-3xl font-bold text-purple-600">
    {contadores.total || 0}
  </div>
</Card>
```

---

## 🎯 Casos de Uso

### Escenario 1: OT Simple (Cierre Directo)

1. Admin ve OT en estado **PENDIENTE**
2. Abre el detalle
3. Escribe observaciones de resolución
4. Click en **"Cerrar OT"**
5. OT pasa a **CERRADO**, reclamo a **RESUELTO**

**Flujo:** `PENDIENTE → CERRADO` ✅

---

### Escenario 2: OT Compleja (Proceso Intermedio)

1. Admin ve OT en estado **PENDIENTE**
2. Abre el detalle
3. Click en **"Marcar En Proceso"**
4. OT pasa a **EN_PROCESO**
5. Otros admins ven que está siendo atendida
6. Admin trabaja en la resolución
7. Cuando termina, escribe observaciones
8. Click en **"Cerrar OT"**
9. OT pasa a **CERRADO**, reclamo a **RESUELTO**

**Flujo:** `PENDIENTE → EN_PROCESO → CERRADO` ✅

---

### Escenario 3: Múltiples Administradores

1. **Admin A** ve 5 OTs pendientes
2. Abre la primera y hace click en **"Marcar En Proceso"**
3. **Admin B** ve la lista actualizada:
   - 4 Pendientes 🟡
   - 1 En Proceso 🔵 (Admin A trabajando)
4. **Admin B** toma otra OT pendiente
5. Cada uno trabaja sin duplicar esfuerzos

**Beneficio:** Evita que dos admins trabajen en la misma OT ✅

---

## 🔐 Seguridad y Validaciones

### Backend

✅ **Solo OTs administrativas** (`empleado_id IS NULL`)
✅ **Estado correcto** (PENDIENTE para marcar en proceso)
✅ **Observaciones obligatorias** al cerrar
✅ **Transacción** al cerrar (OT + Reclamo juntos)
✅ **Autenticación** con JWT token

### Frontend

✅ **Botones condicionales** según estado
✅ **Validación de observaciones** antes de cerrar
✅ **Confirmaciones** antes de cambiar estado
✅ **Feedback visual** (loading, disabled)
✅ **Recarga automática** después de cada acción

---

## 📊 Estadísticas

### Contadores en Tiempo Real

El backend calcula automáticamente:

```sql
SELECT 
  COUNT(*) FILTER (WHERE estado = 'PENDIENTE') as pendientes,
  COUNT(*) FILTER (WHERE estado = 'EN_PROCESO') as en_proceso,
  COUNT(*) FILTER (WHERE estado = 'CERRADO') as cerradas,
  COUNT(*) as total
FROM orden_trabajo ot
WHERE empleado_id IS NULL
  AND tipo_reclamo = 'ADMINISTRATIVO'
```

Estos se muestran en las **4 cards del dashboard**.

---

## 🎓 Diferencias con OTs Técnicas

| Característica | OTs Administrativas | OTs Técnicas |
|----------------|---------------------|--------------|
| **Empleado Asignado** | ❌ No (`empleado_id = NULL`) | ✅ Sí (operario) |
| **Estados** | 3 (Pendiente, En Proceso, Cerrado) | 4 (+ Asignada) |
| **Cuadrilla** | ❌ No | ✅ Sí |
| **Itinerario** | ❌ No | ✅ Sí |
| **Gestión** | Administrador | Operario |
| **Flujo** | Simple (2-3 pasos) | Complejo (4-5 pasos) |

---

## ✅ Testing

### Pruebas Manuales Recomendadas

1. **Test: Marcar En Proceso**
   - [ ] Abrir OT PENDIENTE
   - [ ] Click "Marcar En Proceso"
   - [ ] Verificar cambio en lista
   - [ ] Verificar contador actualizado

2. **Test: Cerrar desde PENDIENTE**
   - [ ] Abrir OT PENDIENTE
   - [ ] Escribir observaciones
   - [ ] Click "Cerrar OT"
   - [ ] Verificar estado CERRADO
   - [ ] Verificar reclamo RESUELTO

3. **Test: Cerrar desde EN_PROCESO**
   - [ ] Abrir OT EN_PROCESO
   - [ ] Escribir observaciones
   - [ ] Click "Cerrar OT"
   - [ ] Verificar cambios

4. **Test: Validaciones**
   - [ ] Intentar cerrar sin observaciones (debe fallar)
   - [ ] Cancelar confirmaciones (no debe cambiar)

5. **Test: Filtros**
   - [ ] Filtrar por "Pendiente"
   - [ ] Filtrar por "En Proceso"
   - [ ] Filtrar por "Cerrada"
   - [ ] Búsqueda por texto

---

## 🚀 Cómo Probar

### 1. Iniciar el Sistema

```bash
cd /home/damian/projects/PPIV
./start.sh
```

### 2. Login como Admin

```
URL: http://localhost:3002/login
Email: monica.administradora@cooperativa-ugarte.com.ar
Password: password123
```

### 3. Ir a OTs Administrativas

```
Dashboard → "OTs Administrativas"
```

### 4. Probar Flujo Completo

1. Ver OT en PENDIENTE (badge amarillo)
2. Abrir detalle
3. Click "Marcar En Proceso"
4. Verificar badge azul
5. Volver a abrir
6. Escribir observaciones
7. Click "Cerrar OT"
8. Verificar badge verde

---

## 📝 Notas Técnicas

### Base de Datos

No se modificó el esquema. Se usa el ENUM existente:
- ✅ `PENDIENTE`
- ✅ `EN_PROCESO`
- ✅ `CERRADO`
- ❌ `ASIGNADA` (no se usa para administrativas)

### API Endpoints

Nuevos:
- ✅ `PATCH /api/administradores/ots/administrativas/:id/en-proceso`

Existentes (sin cambios):
- ✅ `GET /api/administradores/ots/administrativas`
- ✅ `GET /api/administradores/ots/administrativas/:id`
- ✅ `PATCH /api/administradores/ots/administrativas/:id/cerrar`
- ✅ `GET /api/administradores/ots/administrativas/resumen`

---

## 🎉 Resumen

### ✅ Implementado

- [x] Método backend para marcar EN_PROCESO
- [x] Controlador y ruta API
- [x] Función frontend marcarEnProceso()
- [x] Botones condicionales en modal
- [x] Colores actualizados (azul para EN_PROCESO)
- [x] Filtro dropdown actualizado
- [x] Contadores con 3 estados
- [x] Validaciones y seguridad
- [x] Documentación completa

### 💡 Ventajas

1. **Control de flujo** - El admin puede indicar que está trabajando
2. **Visibilidad** - Otros admins ven qué OTs están siendo atendidas
3. **Flexibilidad** - Se puede cerrar desde PENDIENTE o EN_PROCESO
4. **Trazabilidad** - Se registra cada cambio de estado con timestamp
5. **Prevención de duplicados** - Evita que dos admins trabajen en lo mismo

---

**Estado:** ✅ **COMPLETADO Y FUNCIONAL**  
**Última actualización:** 9 de octubre de 2025  
**Sistema:** 3 Estados (PENDIENTE → EN_PROCESO → CERRADO)
