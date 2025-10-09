import pool from '../db.js';

/**
 * Modelo para gestionar Órdenes de Trabajo
 * 
 * OTs TÉCNICAS: tienen empleado_id (operario asignado)
 * OTs ADMINISTRATIVAS: empleado_id = NULL (sin operario)
 */
class OrdenTrabajo {
  /**
   * Crear OT para reclamo
   * @param {Object} params
   * @param {number} params.reclamoId - ID del reclamo
   * @param {number|null} params.empleadoId - ID del empleado (NULL para reclamos administrativos)
   * @param {string} params.direccionIntervencion - Dirección donde se realizará el trabajo
   * @param {string} params.observaciones - Observaciones iniciales
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
      empleadoId, // NULL para reclamos administrativos
      direccionIntervencion,
      observaciones
    ]);
    
    return resultado.rows[0];
  }

  /**
   * Listar OTs ADMINISTRATIVAS (sin empleado asignado)
   * Solo para el panel de administrador
   */
  static async listarAdministrativas({ estado = null, limite = 50, offset = 0 }) {
    let query = `
      SELECT 
        ot.ot_id,
        ot.estado as estado_ot,
        ot.fecha_programada,
        ot.fecha_cierre,
        ot.observaciones as observaciones_ot,
        ot.created_at as fecha_creacion_ot,
        r.reclamo_id,
        r.descripcion,
        r.estado as estado_reclamo,
        r.fecha_alta,
        r.prioridad_id,
        r.adjunto_url,
        d.detalle_id,
        d.nombre as detalle_reclamo,
        t.tipo_id,
        t.nombre as tipo_reclamo,
        p.nombre as prioridad,
        c.cuenta_id,
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
   * Obtener detalle de OT administrativa por ID
   */
  static async obtenerAdministrativaPorId(otId) {
    const query = `
      SELECT 
        ot.*,
        r.reclamo_id,
        r.descripcion,
        r.estado as estado_reclamo,
        r.fecha_alta,
        r.fecha_cierre as fecha_cierre_reclamo,
        r.adjunto_url,
        r.observaciones_cierre,
        d.detalle_id,
        d.nombre as detalle_reclamo,
        t.tipo_id,
        t.nombre as tipo_reclamo,
        p.prioridad_id,
        p.nombre as prioridad,
        c.cuenta_id,
        c.numero_cuenta,
        c.direccion,
        c.localidad,
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
   * Cierra tanto la OT como el reclamo asociado
   */
  static async cerrarAdministrativa(otId, { observaciones }) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Validar que las observaciones existan y no estén vacías
      if (!observaciones || !observaciones.trim()) {
        throw new Error('Las observaciones son obligatorias para cerrar la OT');
      }
      
      // 1. Actualizar OT
      const queryOT = `
        UPDATE orden_trabajo 
        SET estado = 'CERRADO',
            fecha_cierre = NOW(),
            observaciones = $1,
            updated_at = NOW()
        WHERE ot_id = $2
          AND empleado_id IS NULL
        RETURNING *
      `;
      const resultadoOT = await client.query(queryOT, [observaciones.trim(), otId]);
      
      if (resultadoOT.rows.length === 0) {
        throw new Error('OT administrativa no encontrada');
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
   * Cambiar estado de OT administrativa a EN_PROCESO
   * Para indicar que el admin está trabajando en ella
   * TAMBIÉN actualiza el estado del reclamo asociado
   */
  static async marcarEnProcesoAdministrativa(otId, observaciones = null) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Si observaciones es string vacío, tratarlo como null
      const observacionesLimpias = (observaciones && observaciones.trim()) ? observaciones.trim() : null;
      
      // 1. Actualizar OT
      const queryOT = `
        UPDATE orden_trabajo 
        SET estado = 'EN_PROCESO',
            observaciones = COALESCE($2::TEXT, observaciones),
            updated_at = NOW()
        WHERE ot_id = $1
          AND empleado_id IS NULL
          AND estado = 'PENDIENTE'
        RETURNING *
      `;
      
      const resultadoOT = await client.query(queryOT, [otId, observacionesLimpias]);
      
      if (resultadoOT.rows.length === 0) {
        throw new Error('OT administrativa no encontrada o ya no está pendiente');
      }
      
      const ot = resultadoOT.rows[0];
      
      // 2. Actualizar estado del reclamo asociado a EN_PROCESO
      const queryReclamo = `
        UPDATE reclamo 
        SET estado = 'EN_PROCESO',
            updated_at = NOW()
        WHERE reclamo_id = $1
      `;
      await client.query(queryReclamo, [ot.reclamo_id]);
      
      await client.query('COMMIT');
      
      console.log(`✅ OT #${otId} y Reclamo #${ot.reclamo_id} marcados como EN_PROCESO`);
      
      return ot;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error al marcar OT/Reclamo en proceso:', error);
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
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE r.fecha_alta::date = CURRENT_DATE) as nuevas_hoy
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

  /**
   * Listar OTs TÉCNICAS (con empleado asignado)
   * Para itinerarios y asignación de cuadrillas
   */
  static async listarTecnicas({ empleadoId = null, estado = null, limite = 50, offset = 0 }) {
    let query = `
      SELECT 
        ot.*,
        r.reclamo_id,
        r.descripcion,
        r.estado as estado_reclamo,
        e.nombre as operario_nombre,
        e.apellido as operario_apellido
      FROM orden_trabajo ot
      INNER JOIN reclamo r ON ot.reclamo_id = r.reclamo_id
      INNER JOIN detalle_tipo_reclamo d ON r.detalle_id = d.detalle_id
      INNER JOIN tipo_reclamo t ON d.tipo_id = t.tipo_id
      LEFT JOIN empleado e ON ot.empleado_id = e.empleado_id
      WHERE ot.empleado_id IS NOT NULL
        AND t.nombre = 'TECNICO'
    `;

    const params = [];
    let paramCount = 1;

    if (empleadoId) {
      query += ` AND ot.empleado_id = $${paramCount}`;
      params.push(empleadoId);
      paramCount++;
    }

    if (estado) {
      query += ` AND ot.estado = $${paramCount}`;
      params.push(estado);
      paramCount++;
    }

    query += ` ORDER BY ot.fecha_programada DESC, ot.created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    params.push(limite, offset);

    const resultado = await pool.query(query, params);
    return resultado.rows;
  }
}

export default OrdenTrabajo;
