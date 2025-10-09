# Solución: Reclamos Administrativos (SIN MODIFICAR DB)

## ✅ Propuesta Acordada

**Reclamos Administrativos:**
- ✅ **SÍ tienen Orden de Trabajo** (OT)
- ❌ **NO se asigna empleado** (`empleado_id = NULL`)
- ❌ **NO van a itinerario**
- ✅ **Se cierran directamente desde la OT por el administrador**

## 🎯 Ventajas de esta Solución

1. **No modificamos la base de datos** - Reutilizamos estructura existente
2. **No rompemos flujo técnico** - Los técnicos siguen con su proceso normal
3. **Separación lógica clara** - A nivel de código distinguimos por `tipo_reclamo`
4. **Facilita reportes** - Todas las OTs en una sola tabla

## 🔍 Situación Actual

```sql
-- Actualmente los reclamos administrativos YA TIENEN OTs pero con empleado asignado:
reclamo_id | descripcion                              | tipo           | ot_id | empleado_id
-----------+------------------------------------------+----------------+-------+------------
5          | Consulta facturación agosto 2024         | ADMINISTRATIVO | 5     | 1 ❌
7          | Solicitud nueva conexión ampliación      | ADMINISTRATIVO | 7     | 2 ❌
```

**Problema:** Tienen `empleado_id` asignado, pero según la propuesta no deberían.

## 🛠️ Cambios Necesarios

### 1. Backend - Modelo de Orden de Trabajo

Crear archivo: `/backend/models/OrdenTrabajo.js`

```javascript
import pool from '../db.js';

class OrdenTrabajo {
  /**
   * Crear OT para reclamo (técnico o administrativo)
   * Para reclamos administrativos: empleadoId = null
   */
  static async crear({ reclamoId, empleadoId = null, direccionIntervencion = null, observaciones = null }) {
    const query = `
      INSERT INTO orden_trabajo (
        reclamo_id, 
        empleado_id, 
        direccion_intervencion, 
        observaciones,
        estado
      )
      VALUES ($1, $2, $3, $4, 'PENDIENTE')
      RETURNING *
    `;
    
    const resultado = await pool.query(query, [
      reclamoId,
      empleadoId, // Será NULL para reclamos administrativos
      direccionIntervencion,
      observaciones
    ]);
    
    return resultado.rows[0];
  }

  /**
   * Listar OTs administrativas (sin empleado asignado)
   */
  static async listarAdministrativas({ estado = null, limite = 50, offset = 0 }) {
    let query = `
      SELECT 
        ot.ot_id,
        ot.estado as estado_ot,
        ot.fecha_programada,
        ot.observaciones as observaciones_ot,
        r.reclamo_id,
        r.descripcion,
        r.estado as estado_reclamo,
        r.fecha_alta,
        r.prioridad_id,
        d.nombre as detalle_reclamo,
        t.nombre as tipo_reclamo,
        p.nombre as prioridad,
        c.numero_cuenta,
        c.direccion,
        s.socio_id,
        s.nombre as socio_nombre,
        s.apellido as socio_apellido,
        s.telefono as socio_telefono,
        s.email as socio_email
      FROM orden_trabajo ot
      INNER JOIN reclamo r ON ot.reclamo_id = r.reclamo_id
      INNER JOIN detalle_tipo_reclamo d ON r.detalle_id = d.detalle_id
      INNER JOIN tipo_reclamo t ON d.tipo_id = t.tipo_id
      INNER JOIN prioridad p ON r.prioridad_id = p.prioridad_id
      INNER JOIN cuenta c ON r.cuenta_id = c.cuenta_id
      INNER JOIN socio s ON c.socio_id = s.socio_id
      WHERE ot.empleado_id IS NULL
        AND t.nombre = 'ADMINISTRATIVO'
    `;

    const params = [];
    let paramCount = 1;

    if (estado) {
      query += ` AND ot.estado = $${paramCount}`;
      params.push(estado);
      paramCount++;
    }

    query += ` ORDER BY 
      CASE WHEN r.prioridad_id = 1 THEN 1 
           WHEN r.prioridad_id = 2 THEN 2 
           ELSE 3 END,
      r.fecha_alta DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    params.push(limite, offset);

    const resultado = await pool.query(query, params);
    return resultado.rows;
  }

  /**
   * Obtener detalle de OT administrativa
   */
  static async obtenerAdministrativaPorId(otId) {
    const query = `
      SELECT 
        ot.*,
        r.reclamo_id,
        r.descripcion,
        r.estado as estado_reclamo,
        r.fecha_alta,
        r.adjunto_url,
        d.nombre as detalle_reclamo,
        t.nombre as tipo_reclamo,
        p.nombre as prioridad,
        c.numero_cuenta,
        c.direccion,
        s.socio_id,
        s.nombre as socio_nombre,
        s.apellido as socio_apellido,
        s.dni as socio_dni,
        s.telefono as socio_telefono,
        s.email as socio_email
      FROM orden_trabajo ot
      INNER JOIN reclamo r ON ot.reclamo_id = r.reclamo_id
      INNER JOIN detalle_tipo_reclamo d ON r.detalle_id = d.detalle_id
      INNER JOIN tipo_reclamo t ON d.tipo_id = t.tipo_id
      INNER JOIN prioridad p ON r.prioridad_id = p.prioridad_id
      INNER JOIN cuenta c ON r.cuenta_id = c.cuenta_id
      INNER JOIN socio s ON c.socio_id = s.socio_id
      WHERE ot.ot_id = $1
        AND ot.empleado_id IS NULL
        AND t.nombre = 'ADMINISTRATIVO'
    `;
    
    const resultado = await pool.query(query, [otId]);
    return resultado.rows[0];
  }

  /**
   * Cerrar OT administrativa con resolución
   */
  static async cerrarAdministrativa(otId, { observaciones, empleadoId }) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 1. Actualizar OT
      const queryOT = `
        UPDATE orden_trabajo 
        SET estado = 'CERRADO',
            fecha_cierre = NOW(),
            observaciones = COALESCE($1, observaciones),
            updated_at = NOW()
        WHERE ot_id = $2
        RETURNING *
      `;
      const resultadoOT = await client.query(queryOT, [observaciones, otId]);
      
      if (resultadoOT.rows.length === 0) {
        throw new Error('OT no encontrada');
      }
      
      const ot = resultadoOT.rows[0];
      
      // 2. Cerrar reclamo asociado
      const queryReclamo = `
        UPDATE reclamo 
        SET estado = 'RESUELTO',
            fecha_cierre = NOW(),
            observaciones_cierre = $1,
            updated_at = NOW()
        WHERE reclamo_id = $2
        RETURNING *
      `;
      await client.query(queryReclamo, [observaciones, ot.reclamo_id]);
      
      await client.query('COMMIT');
      
      return resultadoOT.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Contar OTs administrativas por estado
   */
  static async contarAdministrativas() {
    const query = `
      SELECT 
        COUNT(*) FILTER (WHERE ot.estado = 'PENDIENTE') as pendientes,
        COUNT(*) FILTER (WHERE ot.estado = 'EN_PROCESO') as en_proceso,
        COUNT(*) FILTER (WHERE ot.estado = 'CERRADO') as cerradas,
        COUNT(*) as total
      FROM orden_trabajo ot
      INNER JOIN reclamo r ON ot.reclamo_id = r.reclamo_id
      INNER JOIN detalle_tipo_reclamo d ON r.detalle_id = d.detalle_id
      INNER JOIN tipo_reclamo t ON d.tipo_id = t.tipo_id
      WHERE ot.empleado_id IS NULL
        AND t.nombre = 'ADMINISTRATIVO'
    `;
    
    const resultado = await pool.query(query);
    return resultado.rows[0];
  }
}

export default OrdenTrabajo;
```

### 2. Backend - Controlador

Crear archivo: `/backend/controllers/OTAdministrativasController.js`

```javascript
import OrdenTrabajo from '../models/OrdenTrabajo.js';
import { respuestaExitosa, respuestaError, respuestaNoEncontrado } from '../utils/respuestas.js';

class OTAdministrativasController {
  /**
   * Listar OTs administrativas
   */
  static async listar(req, res) {
    try {
      const { estado, pagina = 1, limite = 20 } = req.query;
      
      const offset = (parseInt(pagina) - 1) * parseInt(limite);
      const ots = await OrdenTrabajo.listarAdministrativas({
        estado,
        limite: parseInt(limite),
        offset
      });
      
      const contadores = await OrdenTrabajo.contarAdministrativas();
      
      return respuestaExitosa(res, {
        ots,
        contadores,
        pagina: parseInt(pagina),
        limite: parseInt(limite)
      }, 'OTs administrativas obtenidas exitosamente');
    } catch (error) {
      console.error('Error al listar OTs administrativas:', error);
      return respuestaError(res, 'Error al listar OTs administrativas');
    }
  }

  /**
   * Obtener detalle de OT administrativa
   */
  static async obtenerDetalle(req, res) {
    try {
      const { id } = req.params;
      
      const ot = await OrdenTrabajo.obtenerAdministrativaPorId(id);
      
      if (!ot) {
        return respuestaNoEncontrado(res, 'OT administrativa no encontrada');
      }
      
      return respuestaExitosa(res, ot, 'OT administrativa obtenida exitosamente');
    } catch (error) {
      console.error('Error al obtener OT administrativa:', error);
      return respuestaError(res, 'Error al obtener OT administrativa');
    }
  }

  /**
   * Cerrar OT administrativa con resolución
   */
  static async cerrar(req, res) {
    try {
      const { id } = req.params;
      const { observaciones } = req.body;
      const empleadoId = req.usuario.empleado_id;
      
      if (!observaciones || observaciones.trim() === '') {
        return respuestaError(res, 'Las observaciones de resolución son obligatorias', 400);
      }
      
      const ot = await OrdenTrabajo.cerrarAdministrativa(id, {
        observaciones,
        empleadoId
      });
      
      return respuestaExitosa(res, ot, 'OT administrativa cerrada exitosamente');
    } catch (error) {
      console.error('Error al cerrar OT administrativa:', error);
      return respuestaError(res, error.message || 'Error al cerrar OT administrativa');
    }
  }
}

export default OTAdministrativasController;
```

### 3. Backend - Rutas

Agregar a `/backend/routes/administradores.js`:

```javascript
import OTAdministrativasController from '../controllers/OTAdministrativasController.js';

// ... rutas existentes ...

// Rutas para OTs Administrativas
router.get('/ots/administrativas', OTAdministrativasController.listar);
router.get('/ots/administrativas/:id', OTAdministrativasController.obtenerDetalle);
router.patch('/ots/administrativas/:id/cerrar', OTAdministrativasController.cerrar);
```

### 4. Script de Corrección

Archivo: `/backend/scripts/corregir_ots_administrativas.js`

```javascript
import pool from '../db.js';

/**
 * Script para corregir OTs administrativas existentes
 * Quita el empleado_id de las OTs de reclamos administrativos
 */
async function corregirOTsAdministrativas() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Iniciando corrección de OTs administrativas...');
    
    // Actualizar OTs de reclamos administrativos para que NO tengan empleado
    const query = `
      UPDATE orden_trabajo ot
      SET empleado_id = NULL,
          updated_at = NOW()
      FROM reclamo r
      INNER JOIN detalle_tipo_reclamo d ON r.detalle_id = d.detalle_id
      INNER JOIN tipo_reclamo t ON d.tipo_id = t.tipo_id
      WHERE ot.reclamo_id = r.reclamo_id
        AND t.nombre = 'ADMINISTRATIVO'
        AND ot.empleado_id IS NOT NULL
      RETURNING ot.ot_id, r.reclamo_id, r.descripcion
    `;
    
    const resultado = await client.query(query);
    
    console.log(`✅ Se corrigieron ${resultado.rows.length} OTs administrativas:`);
    resultado.rows.forEach(row => {
      console.log(`  - OT #${row.ot_id} | Reclamo #${row.reclamo_id}: ${row.descripcion}`);
    });
    
    console.log('✅ Corrección completada');
  } catch (error) {
    console.error('❌ Error al corregir OTs:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  corregirOTsAdministrativas()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default corregirOTsAdministrativas;
```

### 5. Frontend - Vista Administrador

Ruta: `/admin/ots-administrativas`

```typescript
// Vista simplificada - estructura similar a la ya creada
// Ver archivo: /public/ots_administrativas.html
```

## 📋 Flujo de Trabajo Completo

### Crear Reclamo Administrativo (Cliente)
1. Cliente crea reclamo tipo "Facturación" o "Conexión Nueva"
2. Estado inicial: `PENDIENTE`
3. **Sistema crea OT automáticamente con `empleado_id = NULL`**

### Ver y Gestionar (Administrador)
1. Accede a `/admin/ots-administrativas`
2. Ve lista de OTs sin empleado asignado
3. Filtra por estado: PENDIENTE, EN_PROCESO, CERRADO
4. Abre detalle de OT:
   - Datos del socio y cuenta
   - Descripción del reclamo
   - Documentos adjuntos
   - Formulario de resolución

### Cerrar OT (Administrador)
1. Escribe resolución/observaciones
2. Click en "Cerrar OT"
3. Sistema:
   - Actualiza OT a `CERRADO`
   - Actualiza reclamo a `RESUELTO`
   - Registra fecha de cierre
   - Guarda observaciones

## ✅ Validaciones Importantes

### En Itinerarios
```javascript
// Al crear itinerario, EXCLUIR OTs sin empleado
WHERE ot.empleado_id IS NOT NULL
```

### En Asignaciones
```javascript
// No permitir asignar operario a reclamos administrativos
if (tipoReclamo === 'ADMINISTRATIVO') {
  throw new Error('Los reclamos administrativos no se asignan a operarios');
}
```

### En Reportes de Operarios
```javascript
// Solo contar OTs técnicas (con empleado asignado)
WHERE ot.empleado_id = $1
```

## 🚀 Plan de Implementación

### ✅ Paso 1: Corrección de Datos (AHORA)
```bash
node backend/scripts/corregir_ots_administrativas.js
```

### ✅ Paso 2: Backend (30 min)
- Crear modelo OrdenTrabajo.js
- Crear controlador OTAdministrativasController.js
- Agregar rutas a administradores.js

### ✅ Paso 3: Frontend (Ya existe)
- Adaptar `/public/ots_administrativas.html` a rutas reales
- Integrar en navegación de administrador

### ✅ Paso 4: Validaciones
- Modificar lógica de itinerarios
- Validar asignaciones
- Ajustar reportes

## 📊 Consultas SQL Útiles

```sql
-- Ver OTs administrativas actuales
SELECT 
  ot.ot_id,
  ot.estado,
  ot.empleado_id,
  r.reclamo_id,
  r.descripcion,
  t.nombre as tipo
FROM orden_trabajo ot
JOIN reclamo r ON ot.reclamo_id = r.reclamo_id
JOIN detalle_tipo_reclamo d ON r.detalle_id = d.detalle_id
JOIN tipo_reclamo t ON d.tipo_id = t.tipo_id
WHERE t.nombre = 'ADMINISTRATIVO';

-- Verificar OTs sin empleado (después de corrección)
SELECT COUNT(*) 
FROM orden_trabajo 
WHERE empleado_id IS NULL;
```

---

## 🎯 Resumen

Esta solución:
- ✅ **NO modifica la estructura de la BD**
- ✅ **Reutiliza toda la lógica existente de OTs**
- ✅ **Separa claramente reclamos técnicos y administrativos**
- ✅ **El administrador gestiona OTs sin asignar operario**
- ✅ **No interfiere con itinerarios ni cuadrillas**
- ✅ **Permite reporting unificado**

**Próximo paso:** ¿Ejecutamos el script de corrección y creamos los archivos del backend?
