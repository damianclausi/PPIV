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

  // ========================================================================
  // MÉTODOS PARA OTs TÉCNICAS
  // ========================================================================

  /**
   * Listar OTs TÉCNICAS (con empleado asignado)
   * Incluye información de cuadrilla
   */
  static async listarTecnicas({ estado = null, empleadoId = null, cuadrillaId = null, limite = 50, offset = 0 }) {
    let query = `
      SELECT 
        ot.ot_id,
        ot.estado,
        ot.empleado_id,
        ot.fecha_programada as fecha_asignacion,
        ot.fecha_cierre,
        ot.observaciones,
        ot.direccion_intervencion,
        ot.created_at,
        ot.updated_at,
        e.nombre || ' ' || e.apellido as operario,
        e.rol_interno,
        c.cuadrilla_id,
        c.nombre as cuadrilla,
        c.zona,
        r.reclamo_id,
        r.descripcion,
        r.estado as estado_reclamo,
        s.nombre as socio_nombre,
        s.apellido as socio_apellido,
        s.telefono as socio_telefono,
        ct.numero_cuenta,
        tr.nombre as tipo_reclamo,
        p.nombre as prioridad
      FROM orden_trabajo ot
      INNER JOIN reclamo r ON ot.reclamo_id = r.reclamo_id
      LEFT JOIN empleado e ON ot.empleado_id = e.empleado_id
      LEFT JOIN empleado_cuadrilla ec ON e.empleado_id = ec.empleado_id AND ec.activa = true
      LEFT JOIN cuadrilla c ON ec.cuadrilla_id = c.cuadrilla_id
      INNER JOIN cuenta ct ON r.cuenta_id = ct.cuenta_id
      INNER JOIN socio s ON ct.socio_id = s.socio_id
      INNER JOIN detalle_tipo_reclamo dtr ON r.detalle_id = dtr.detalle_id
      INNER JOIN tipo_reclamo tr ON dtr.tipo_id = tr.tipo_id
      LEFT JOIN prioridad p ON r.prioridad_id = p.prioridad_id
      WHERE ot.empleado_id IS NOT NULL
        AND tr.nombre = 'TECNICO'
    `;

    const params = [];
    let paramCount = 1;

    if (estado) {
      query += ` AND ot.estado = $${paramCount}`;
      params.push(estado);
      paramCount++;
    }

    if (empleadoId) {
      query += ` AND ot.empleado_id = $${paramCount}`;
      params.push(empleadoId);
      paramCount++;
    }

    if (cuadrillaId) {
      query += ` AND c.cuadrilla_id = $${paramCount}`;
      params.push(cuadrillaId);
      paramCount++;
    }

    query += ` ORDER BY 
        CASE ot.estado
          WHEN 'PENDIENTE' THEN 1
          WHEN 'ASIGNADA' THEN 2
          WHEN 'EN_PROCESO' THEN 3
          WHEN 'COMPLETADA' THEN 4
          ELSE 5
        END,
        ot.created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    params.push(limite, offset);

    const resultado = await pool.query(query, params);
    return resultado.rows;
  }

  /**
   * Asignar operario a OT técnica PENDIENTE
   * Usa solo campos existentes: empleado_id, estado, fecha_programada
   */
  static async asignarOperario(ot_id, empleado_id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Validar que el empleado existe y está activo
      const empleadoCheck = await client.query(`
        SELECT empleado_id, nombre, apellido, activo
        FROM empleado
        WHERE empleado_id = $1 AND activo = true;
      `, [empleado_id]);

      if (empleadoCheck.rowCount === 0) {
        throw new Error('Empleado no encontrado o inactivo');
      }

      // Actualizar OT - usar fecha_programada como fecha de asignación
      const updateOT = await client.query(`
        UPDATE orden_trabajo
        SET empleado_id = $1,
            estado = 'ASIGNADA',
            fecha_programada = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE ot_id = $2
          AND estado = 'PENDIENTE'
        RETURNING *;
      `, [empleado_id, ot_id]);

      if (updateOT.rowCount === 0) {
        throw new Error('OT no encontrada o no está en estado PENDIENTE');
      }

      // Actualizar Reclamo a EN_PROCESO
      await client.query(`
        UPDATE reclamo
        SET estado = 'EN_PROCESO',
            updated_at = CURRENT_TIMESTAMP
        WHERE reclamo_id = (
          SELECT reclamo_id FROM orden_trabajo WHERE ot_id = $1
        );
      `, [ot_id]);

      await client.query('COMMIT');
      return updateOT.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error al asignar operario:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Operario inicia trabajo (ASIGNADA → EN_PROCESO)
   * Usa updated_at para tracking de inicio
   */
  static async iniciarTrabajo(ot_id, empleado_id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const updateOT = await client.query(`
        UPDATE orden_trabajo
        SET estado = 'EN_PROCESO',
            updated_at = CURRENT_TIMESTAMP
        WHERE ot_id = $1
          AND empleado_id = $2
          AND estado = 'ASIGNADA'
        RETURNING *;
      `, [ot_id, empleado_id]);

      if (updateOT.rowCount === 0) {
        throw new Error('OT no encontrada, no asignada a este operario, o no está en estado ASIGNADA');
      }

      await client.query('COMMIT');
      return updateOT.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error al iniciar trabajo:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Operario completa trabajo (EN_PROCESO → COMPLETADA)
   * Actualiza Reclamo a RESUELTO
   */
  static async completarTrabajo(ot_id, empleado_id, observaciones) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Validar que las observaciones no estén vacías
      if (!observaciones || observaciones.trim() === '') {
        throw new Error('Las observaciones son requeridas para completar el trabajo');
      }

      // Actualizar OT
      const updateOT = await client.query(`
        UPDATE orden_trabajo
        SET estado = 'COMPLETADA',
            fecha_cierre = CURRENT_TIMESTAMP,
            observaciones = COALESCE($3::TEXT, observaciones),
            updated_at = CURRENT_TIMESTAMP
        WHERE ot_id = $1
          AND empleado_id = $2
          AND estado = 'EN_PROCESO'
        RETURNING *;
      `, [ot_id, empleado_id, observaciones]);

      if (updateOT.rowCount === 0) {
        throw new Error('OT no encontrada, no asignada a este operario, o no está en estado EN_PROCESO');
      }

      // Actualizar Reclamo a RESUELTO
      await client.query(`
        UPDATE reclamo
        SET estado = 'RESUELTO',
            fecha_cierre = CURRENT_TIMESTAMP,
            observaciones_cierre = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE reclamo_id = (
          SELECT reclamo_id FROM orden_trabajo WHERE ot_id = $1
        );
      `, [ot_id, observaciones]);

      await client.query('COMMIT');
      return updateOT.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error al completar trabajo:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Obtener detalle completo de OT técnica
   */
  static async obtenerDetalleTecnica(ot_id) {
    const query = `
      SELECT 
        ot.ot_id,
        ot.estado,
        ot.empleado_id,
        ot.fecha_programada as fecha_asignacion,
        ot.fecha_cierre,
        ot.observaciones,
        ot.direccion_intervencion,
        ot.created_at,
        ot.updated_at,
        e.nombre || ' ' || e.apellido as operario,
        e.legajo as operario_legajo,
        e.rol_interno as operario_rol,
        c.cuadrilla_id,
        c.nombre as cuadrilla,
        c.zona as cuadrilla_zona,
        r.reclamo_id,
        r.descripcion as reclamo_descripcion,
        r.estado as estado_reclamo,
        r.fecha_alta as reclamo_fecha,
        s.socio_id,
        s.nombre as socio_nombre,
        s.apellido as socio_apellido,
        s.telefono as socio_telefono,
        s.email as socio_email,
        ct.cuenta_id,
        ct.numero_cuenta,
        ct.direccion as cuenta_direccion,
        tr.nombre as tipo_reclamo,
        dtr.descripcion as detalle_tipo,
        p.descripcion as prioridad
      FROM orden_trabajo ot
      INNER JOIN reclamo r ON ot.reclamo_id = r.reclamo_id
      LEFT JOIN empleado e ON ot.empleado_id = e.empleado_id
      LEFT JOIN empleado_cuadrilla ec ON e.empleado_id = ec.empleado_id AND ec.activa = true
      LEFT JOIN cuadrilla c ON ec.cuadrilla_id = c.cuadrilla_id
      INNER JOIN cuenta ct ON r.cuenta_id = ct.cuenta_id
      INNER JOIN socio s ON ct.socio_id = s.socio_id
      INNER JOIN detalle_tipo_reclamo dtr ON r.detalle_id = dtr.detalle_id
      INNER JOIN tipo_reclamo tr ON dtr.tipo_id = tr.tipo_id
      LEFT JOIN prioridad p ON r.prioridad_id = p.prioridad_id
      WHERE ot.ot_id = $1;
    `;

    const resultado = await pool.query(query, [ot_id]);
    return resultado.rows[0] || null;
  }

  /**
   * Cancelar OT técnica (solo si está PENDIENTE o ASIGNADA)
   */
  static async cancelarTecnica(ot_id, motivo) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const updateOT = await client.query(`
        UPDATE orden_trabajo
        SET estado = 'CANCELADA',
            observaciones = COALESCE(observaciones || E'\n\n', '') || 'CANCELADA: ' || $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE ot_id = $1
          AND estado IN ('PENDIENTE', 'ASIGNADA')
        RETURNING reclamo_id;
      `, [ot_id, motivo]);

      if (updateOT.rowCount === 0) {
        throw new Error('OT no encontrada o no puede ser cancelada (solo PENDIENTE o ASIGNADA)');
      }

      // Volver reclamo a PENDIENTE
      await client.query(`
        UPDATE reclamo
        SET estado = 'PENDIENTE',
            updated_at = CURRENT_TIMESTAMP
        WHERE reclamo_id = $1;
      `, [updateOT.rows[0].reclamo_id]);

      await client.query('COMMIT');
      return { success: true, message: 'OT cancelada correctamente' };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error al cancelar OT:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // ========================================================================
  // MÉTODOS PARA ITINERARIO DE CUADRILLAS
  // ========================================================================

  /**
   * Asignar OT a una cuadrilla (empleado_id = NULL)
   * La OT queda disponible para que cualquier operario de la cuadrilla la tome
   */
  static async asignarACuadrilla(ot_id, cuadrilla_id, fecha_programada) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Obtener nombre de la cuadrilla para las observaciones
      const cuadrillaInfo = await client.query(`
        SELECT nombre FROM cuadrilla WHERE cuadrilla_id = $1
      `, [cuadrilla_id]);

      if (cuadrillaInfo.rowCount === 0) {
        throw new Error('Cuadrilla no encontrada');
      }

      const cuadrillaNombre = cuadrillaInfo.rows[0].nombre;

      // Actualizar OT: empleado_id = NULL indica que está asignada a cuadrilla
      const updateOT = await client.query(`
        UPDATE orden_trabajo
        SET empleado_id = NULL,
            estado = 'PENDIENTE',
            fecha_programada = $1::DATE,
            observaciones = COALESCE(observaciones, '') || 
              E'\n[ITINERARIO] Asignada a cuadrilla: ' || $2 || ' - Fecha: ' || $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE ot_id = $3
        RETURNING *
      `, [fecha_programada, cuadrillaNombre, ot_id]);

      if (updateOT.rowCount === 0) {
        throw new Error('Orden de trabajo no encontrada');
      }

      await client.query('COMMIT');
      return updateOT.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Listar itinerario de una cuadrilla para una fecha específica
   * Devuelve OTs con empleado_id = NULL (asignadas a cuadrilla)
   * y OTs ya tomadas por operarios de esa cuadrilla
   */
  static async listarItinerarioCuadrilla(cuadrilla_id, fecha) {
    const query = `
      SELECT 
        ot.ot_id as id,
        ot.estado,
        ot.empleado_id,
        ot.fecha_programada,
        ot.observaciones,
        ot.direccion_intervencion,
        ot.created_at,
        r.reclamo_id,
        r.descripcion,
        r.estado as estado_reclamo,
        s.socio_id,
        s.nombre as socio_nombre,
        s.apellido as socio_apellido,
        ct.direccion as domicilio,
        s.telefono as socio_telefono,
        s.email as socio_email,
        ct.numero_cuenta,
        tr.nombre as tipo_reclamo,
        p.nombre as prioridad,
        dtr.nombre as detalle_reclamo,
        e.nombre as operario_nombre,
        e.apellido as operario_apellido,
        CASE 
          WHEN ot.empleado_id IS NULL THEN 'disponible'
          ELSE 'tomada'
        END as estado_itinerario
      FROM orden_trabajo ot
      INNER JOIN reclamo r ON ot.reclamo_id = r.reclamo_id
      INNER JOIN cuenta ct ON r.cuenta_id = ct.cuenta_id
      INNER JOIN socio s ON ct.socio_id = s.socio_id
      INNER JOIN detalle_tipo_reclamo dtr ON r.detalle_id = dtr.detalle_id
      INNER JOIN tipo_reclamo tr ON dtr.tipo_id = tr.tipo_id
      LEFT JOIN prioridad p ON r.prioridad_id = p.prioridad_id
      LEFT JOIN empleado e ON ot.empleado_id = e.empleado_id
      WHERE DATE(ot.fecha_programada) = $1
        AND tr.nombre = 'TECNICO'
        AND ot.observaciones LIKE '%[ITINERARIO]%'
        AND ot.observaciones LIKE '%cuadrilla: ' || (SELECT nombre FROM cuadrilla WHERE cuadrilla_id = $2) || '%'
        AND ot.estado IN ('PENDIENTE', 'ASIGNADA', 'EN_PROCESO')
      ORDER BY 
        CASE WHEN ot.empleado_id IS NULL THEN 0 ELSE 1 END,
        CASE p.nombre
          WHEN 'ALTA' THEN 1
          WHEN 'MEDIA' THEN 2
          WHEN 'BAJA' THEN 3
          ELSE 4
        END,
        ot.created_at ASC
    `;

    const resultado = await pool.query(query, [fecha, cuadrilla_id]);
    return resultado.rows;
  }

  /**
   * Operario "toma" una OT del itinerario
   * Cambia de empleado_id = NULL a empleado_id = operario_id
   */
  static async tomarOTDeItinerario(ot_id, empleado_id, cuadrilla_id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Validar que la OT está disponible (empleado_id = NULL)
      const checkOT = await client.query(`
        SELECT ot.*, 
               c.nombre as cuadrilla_nombre
        FROM orden_trabajo ot
        CROSS JOIN cuadrilla c
        WHERE ot.ot_id = $1
          AND c.cuadrilla_id = $2
          AND ot.empleado_id IS NULL
          AND ot.estado = 'PENDIENTE'
          AND ot.observaciones LIKE '%cuadrilla: ' || c.nombre || '%'
      `, [ot_id, cuadrilla_id]);

      if (checkOT.rowCount === 0) {
        throw new Error('OT no disponible, ya fue tomada por otro operario o no pertenece a tu cuadrilla');
      }

      // Obtener info del empleado
      const empleadoInfo = await client.query(`
        SELECT nombre, apellido FROM empleado WHERE empleado_id = $1
      `, [empleado_id]);

      const empleadoNombre = `${empleadoInfo.rows[0].nombre} ${empleadoInfo.rows[0].apellido}`;

      // Asignar OT al operario
      const updateOT = await client.query(`
        UPDATE orden_trabajo
        SET empleado_id = $1,
            estado = 'ASIGNADA',
            observaciones = observaciones || E'\n[ITINERARIO] Tomada por: ' || $2 || ' - ' || CURRENT_TIMESTAMP::TEXT,
            updated_at = CURRENT_TIMESTAMP
        WHERE ot_id = $3
        RETURNING *
      `, [empleado_id, empleadoNombre, ot_id]);

      await client.query('COMMIT');
      return updateOT.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Listar OTs pendientes sin asignar (para agregar a itinerario)
   */
  static async listarPendientesSinAsignar(tipo_reclamo = 'TECNICO') {
    console.log('📋 Buscando OTs pendientes sin asignar, tipo:', tipo_reclamo);
    
    const query = `
      SELECT 
        ot.ot_id as id,
        ot.estado,
        ot.created_at as fecha_creacion,
        ot.direccion_intervencion as domicilio,
        r.reclamo_id,
        r.descripcion,
        s.socio_id as nro_socio,
        s.nombre as socio_nombre,
        s.apellido as socio_apellido,
        s.telefono as socio_telefono,
        ct.numero_cuenta as cuenta_nro,
        tr.nombre as tipo_reclamo,
        p.nombre as prioridad,
        dtr.nombre as detalle_reclamo
      FROM orden_trabajo ot
      INNER JOIN reclamo r ON ot.reclamo_id = r.reclamo_id
      INNER JOIN cuenta ct ON r.cuenta_id = ct.cuenta_id
      INNER JOIN socio s ON ct.socio_id = s.socio_id
      INNER JOIN detalle_tipo_reclamo dtr ON r.detalle_id = dtr.detalle_id
      INNER JOIN tipo_reclamo tr ON dtr.tipo_id = tr.tipo_id
      LEFT JOIN prioridad p ON r.prioridad_id = p.prioridad_id
      WHERE ot.empleado_id IS NULL
        AND ot.estado = 'PENDIENTE'
        AND tr.nombre = $1
        AND (ot.observaciones NOT LIKE '%[ITINERARIO]%' OR ot.observaciones IS NULL)
      ORDER BY 
        CASE p.nombre
          WHEN 'ALTA' THEN 1
          WHEN 'MEDIA' THEN 2
          WHEN 'BAJA' THEN 3
          ELSE 4
        END,
        ot.created_at DESC
      LIMIT 100
    `;

    try {
      const resultado = await pool.query(query, [tipo_reclamo]);
      console.log(`✅ Encontradas ${resultado.rows.length} OTs pendientes`);
      return resultado.rows;
    } catch (error) {
      console.error('❌ Error en listarPendientesSinAsignar:', error.message);
      throw error;
    }
  }

  /**
   * Quitar OT del itinerario (vuelve a PENDIENTE sin cuadrilla)
   */
  static async quitarDeItinerario(ot_id) {
    const query = `
      UPDATE orden_trabajo
      SET empleado_id = NULL,
          estado = 'PENDIENTE',
          fecha_programada = NULL,
          observaciones = REGEXP_REPLACE(
            COALESCE(observaciones, ''), 
            '\\[ITINERARIO\\].*?\\n', 
            '', 
            'g'
          ),
          updated_at = CURRENT_TIMESTAMP
      WHERE ot_id = $1
        AND empleado_id IS NULL
        AND estado = 'PENDIENTE'
      RETURNING *
    `;

    const resultado = await pool.query(query, [ot_id]);
    
    if (resultado.rowCount === 0) {
      throw new Error('No se puede quitar del itinerario. OT ya fue tomada por un operario.');
    }

    return resultado.rows[0];
  }
}

export default OrdenTrabajo;
