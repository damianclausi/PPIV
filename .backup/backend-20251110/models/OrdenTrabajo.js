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
   * Permite que cualquier operario de la MISMA CUADRILLA cierre la OT
   */
  static async completarTrabajo(ot_id, empleado_id, observaciones) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Validar que las observaciones no estén vacías
      if (!observaciones || observaciones.trim() === '') {
        throw new Error('Las observaciones son requeridas para completar el trabajo');
      }

      // Obtener información de la OT y validar permisos de cuadrilla
      const validacion = await client.query(`
        SELECT 
          ot.ot_id,
          ot.empleado_id as operario_asignado,
          ot.observaciones,
          COALESCE(ec1.cuadrilla_id, i.cuadrilla_id) as cuadrilla_asignada,
          ec2.cuadrilla_id as cuadrilla_operario,
          e_asignado.nombre || ' ' || e_asignado.apellido as nombre_asignado,
          e_cierre.nombre || ' ' || e_cierre.apellido as nombre_cierre,
          ot.estado,
          CASE WHEN id.itinerario_id IS NOT NULL THEN true ELSE false END as es_itinerario
        FROM orden_trabajo ot
        -- Cuadrilla del operario asignado originalmente (si existe)
        LEFT JOIN empleado_cuadrilla ec1 
          ON ot.empleado_id = ec1.empleado_id 
          AND ec1.activa = true
        -- Información del itinerario (para obtener la cuadrilla si es OT de itinerario)
        LEFT JOIN itinerario_det id ON ot.ot_id = id.ot_id
        LEFT JOIN itinerario i ON id.itinerario_id = i.itinerario_id
        -- Cuadrilla del operario que quiere cerrar
        LEFT JOIN empleado_cuadrilla ec2 
          ON ec2.empleado_id = $2 
          AND ec2.activa = true
        LEFT JOIN empleado e_asignado ON ot.empleado_id = e_asignado.empleado_id
        LEFT JOIN empleado e_cierre ON $2 = e_cierre.empleado_id
        WHERE ot.ot_id = $1 
          AND ot.estado = 'EN_PROCESO'
      `, [ot_id, empleado_id]);

      if (validacion.rowCount === 0) {
        throw new Error('OT no encontrada o no está en estado EN_PROCESO');
      }

      const ot = validacion.rows[0];

      // Si la OT es de itinerario, validar que pertenezcan a la misma cuadrilla
      const esItinerario = ot.es_itinerario;
      
      if (esItinerario) {
        if (!ot.cuadrilla_asignada || !ot.cuadrilla_operario) {
          throw new Error('No perteneces a ninguna cuadrilla activa');
        }
        
        if (ot.cuadrilla_asignada !== ot.cuadrilla_operario) {
          throw new Error('Esta OT pertenece a otra cuadrilla. Solo los miembros de la cuadrilla asignada pueden cerrarla.');
        }
      } else {
        // Si NO es de itinerario, solo el asignado puede cerrar (comportamiento original)
        if (ot.operario_asignado !== empleado_id) {
          throw new Error('Solo el operario asignado puede cerrar esta OT');
        }
      }

      // Mensaje indicando quién tomó y quién cerró (si son diferentes)
      const mensajeCierre = ot.operario_asignado === empleado_id
        ? `\n[COMPLETADA POR: ${ot.nombre_cierre} - ${new Date().toLocaleString('es-AR')}]`
        : `\n[TOMADA POR: ${ot.nombre_asignado} | COMPLETADA POR: ${ot.nombre_cierre} - ${new Date().toLocaleString('es-AR')}]`;

      // Actualizar OT
      const updateOT = await client.query(`
        UPDATE orden_trabajo
        SET estado = 'COMPLETADA',
            fecha_cierre = CURRENT_TIMESTAMP,
            observaciones = COALESCE($2::TEXT, observaciones) || $3,
            updated_at = CURRENT_TIMESTAMP
        WHERE ot_id = $1
        RETURNING *;
      `, [ot_id, observaciones, mensajeCierre]);

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
      console.log(`✅ OT #${ot_id} completada por ${ot.nombre_cierre}${ot.operario_asignado !== empleado_id ? ` (originalmente asignada a ${ot.nombre_asignado})` : ''}`);
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
        dtr.nombre as detalle_tipo,
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

      // Verificar que la cuadrilla existe
      const cuadrillaInfo = await client.query(`
        SELECT cuadrilla_id, nombre FROM cuadrilla WHERE cuadrilla_id = $1
      `, [cuadrilla_id]);

      if (cuadrillaInfo.rowCount === 0) {
        throw new Error('Cuadrilla no encontrada');
      }

      // Verificar que la OT existe y está PENDIENTE
      const otInfo = await client.query(`
        SELECT * FROM orden_trabajo WHERE ot_id = $1 AND estado = 'PENDIENTE'
      `, [ot_id]);

      if (otInfo.rowCount === 0) {
        throw new Error('Orden de trabajo no encontrada o no está en estado PENDIENTE');
      }

      // Buscar o crear el itinerario para esta cuadrilla y fecha
      let itinerarioResult = await client.query(`
        SELECT itinerario_id FROM itinerario
        WHERE cuadrilla_id = $1 AND fecha = $2::DATE
      `, [cuadrilla_id, fecha_programada]);

      let itinerario_id;
      if (itinerarioResult.rowCount === 0) {
        // Crear nuevo itinerario
        const nuevoItinerario = await client.query(`
          INSERT INTO itinerario (cuadrilla_id, fecha, estado)
          VALUES ($1, $2::DATE, 'PLANIFICADO')
          RETURNING itinerario_id
        `, [cuadrilla_id, fecha_programada]);
        itinerario_id = nuevoItinerario.rows[0].itinerario_id;
      } else {
        itinerario_id = itinerarioResult.rows[0].itinerario_id;
      }

      // Verificar si la OT ya está en este itinerario
      const yaExiste = await client.query(`
        SELECT itdet_id FROM itinerario_det
        WHERE itinerario_id = $1 AND ot_id = $2
      `, [itinerario_id, ot_id]);

      if (yaExiste.rowCount === 0) {
        // Obtener el siguiente orden en este itinerario
        const ordenResult = await client.query(`
          SELECT COALESCE(MAX(orden), 0) + 1 as siguiente_orden
          FROM itinerario_det
          WHERE itinerario_id = $1
        `, [itinerario_id]);
        const orden = ordenResult.rows[0].siguiente_orden;

        // Insertar en itinerario_det
        await client.query(`
          INSERT INTO itinerario_det (itinerario_id, ot_id, orden)
          VALUES ($1, $2, $3)
        `, [itinerario_id, ot_id, orden]);
      }

      // Actualizar la OT: mantener empleado_id = NULL (disponible para la cuadrilla)
      const updateOT = await client.query(`
        UPDATE orden_trabajo
        SET estado = 'ASIGNADA',
            fecha_programada = $1::DATE,
            updated_at = CURRENT_TIMESTAMP
        WHERE ot_id = $2
        RETURNING *
      `, [fecha_programada, ot_id]);

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
        id.orden as orden_itinerario,
        CASE 
          WHEN ot.empleado_id IS NULL THEN 'disponible'
          ELSE 'tomada'
        END as estado_itinerario
      FROM itinerario i
      INNER JOIN itinerario_det id ON i.itinerario_id = id.itinerario_id
      INNER JOIN orden_trabajo ot ON id.ot_id = ot.ot_id
      INNER JOIN reclamo r ON ot.reclamo_id = r.reclamo_id
      INNER JOIN cuenta ct ON r.cuenta_id = ct.cuenta_id
      INNER JOIN socio s ON ct.socio_id = s.socio_id
      INNER JOIN detalle_tipo_reclamo dtr ON r.detalle_id = dtr.detalle_id
      INNER JOIN tipo_reclamo tr ON dtr.tipo_id = tr.tipo_id
      LEFT JOIN prioridad p ON r.prioridad_id = p.prioridad_id
      LEFT JOIN empleado e ON ot.empleado_id = e.empleado_id
      WHERE i.cuadrilla_id = $2
        AND i.fecha = $1
        AND tr.nombre = 'TECNICO'
        AND ot.estado IN ('PENDIENTE', 'ASIGNADA', 'EN CURSO')
      ORDER BY 
        id.orden ASC,
        CASE WHEN ot.empleado_id IS NULL THEN 0 ELSE 1 END,
        CASE p.nombre
          WHEN 'Alta' THEN 1
          WHEN 'Media' THEN 2
          WHEN 'Baja' THEN 3
          ELSE 4
        END
    `;

    const resultado = await pool.query(query, [fecha, cuadrilla_id]);
    return resultado.rows;
  }

  /**
   * Listar TODOS los itinerarios de una cuadrilla (todas las fechas)
   */
  static async listarTodosItinerariosCuadrilla(cuadrilla_id) {
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
        i.fecha as fecha_itinerario,
        id.orden as orden_itinerario,
        CASE 
          WHEN ot.empleado_id IS NULL THEN 'disponible'
          ELSE 'tomada'
        END as estado_itinerario
      FROM itinerario i
      INNER JOIN itinerario_det id ON i.itinerario_id = id.itinerario_id
      INNER JOIN orden_trabajo ot ON id.ot_id = ot.ot_id
      INNER JOIN reclamo r ON ot.reclamo_id = r.reclamo_id
      INNER JOIN cuenta ct ON r.cuenta_id = ct.cuenta_id
      INNER JOIN socio s ON ct.socio_id = s.socio_id
      INNER JOIN detalle_tipo_reclamo dtr ON r.detalle_id = dtr.detalle_id
      INNER JOIN tipo_reclamo tr ON dtr.tipo_id = tr.tipo_id
      LEFT JOIN prioridad p ON r.prioridad_id = p.prioridad_id
      LEFT JOIN empleado e ON ot.empleado_id = e.empleado_id
      WHERE i.cuadrilla_id = $1
        AND tr.nombre = 'TECNICO'
        AND ot.estado IN ('PENDIENTE', 'ASIGNADA', 'EN CURSO')
      ORDER BY 
        i.fecha ASC,
        id.orden ASC,
        CASE WHEN ot.empleado_id IS NULL THEN 0 ELSE 1 END
    `;

    const resultado = await pool.query(query, [cuadrilla_id]);
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

      // Validar que la OT está disponible (empleado_id = NULL) y pertenece al itinerario de la cuadrilla
      const checkOT = await client.query(`
        SELECT ot.*, 
               c.nombre as cuadrilla_nombre,
               i.fecha as fecha_itinerario
        FROM orden_trabajo ot
        INNER JOIN itinerario_det id ON ot.ot_id = id.ot_id
        INNER JOIN itinerario i ON id.itinerario_id = i.itinerario_id
        INNER JOIN cuadrilla c ON i.cuadrilla_id = c.cuadrilla_id
        WHERE ot.ot_id = $1
          AND c.cuadrilla_id = $2
          AND ot.empleado_id IS NULL
          AND ot.estado = 'PENDIENTE'
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
            observaciones = COALESCE(observaciones || E'\n', '') || 'Tomada por: ' || $2 || ' - ' || CURRENT_TIMESTAMP::TEXT,
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
        COALESCE(ot.direccion_intervencion, ct.direccion) as domicilio,
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
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verificar si la OT está en un itinerario
      const checkQuery = `
        SELECT ot.*, id.itinerario_id, id.orden
        FROM orden_trabajo ot
        INNER JOIN itinerario_det id ON ot.ot_id = id.ot_id
        WHERE ot.ot_id = $1
      `;
      const checkResult = await client.query(checkQuery, [ot_id]);

      if (checkResult.rowCount === 0) {
        throw new Error('La OT no está en ningún itinerario.');
      }

      const ot = checkResult.rows[0];

      // No permitir quitar si ya fue tomada por un operario
      if (ot.empleado_id !== null) {
        throw new Error('No se puede quitar del itinerario. OT ya fue tomada por un operario.');
      }

      // Eliminar la OT del itinerario_det
      await client.query(`
        DELETE FROM itinerario_det
        WHERE ot_id = $1
      `, [ot_id]);

      // Actualizar el estado de la OT a PENDIENTE
      const updateQuery = `
        UPDATE orden_trabajo
        SET estado = 'PENDIENTE',
            fecha_programada = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE ot_id = $1
        RETURNING *
      `;
      const resultado = await client.query(updateQuery, [ot_id]);

      await client.query('COMMIT');
      return resultado.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Obtener fechas con itinerarios disponibles para una cuadrilla
   * Devuelve fechas futuras (incluyendo hoy) con al menos 1 OT
   */
  static async obtenerFechasConItinerario(cuadrilla_id, empleado_id = null) {
    const query = `
      SELECT 
        i.fecha,
        COUNT(DISTINCT id.ot_id) as total_ots,
        COUNT(DISTINCT id.ot_id) FILTER (WHERE ot.empleado_id IS NULL) as ots_disponibles,
        COUNT(DISTINCT id.ot_id) FILTER (WHERE ot.empleado_id = $2) as ots_tomadas,
        json_agg(
          json_build_object(
            'prioridad', p.nombre,
            'descripcion', r.descripcion
          ) ORDER BY 
            CASE p.nombre
              WHEN 'Alta' THEN 1
              WHEN 'Media' THEN 2
              WHEN 'Baja' THEN 3
              ELSE 4
            END
        ) FILTER (WHERE ot.empleado_id IS NULL OR ot.empleado_id = $2) as resumen_ots
      FROM itinerario i
      INNER JOIN itinerario_det id ON i.itinerario_id = id.itinerario_id
      INNER JOIN orden_trabajo ot ON id.ot_id = ot.ot_id
      INNER JOIN reclamo r ON ot.reclamo_id = r.reclamo_id
      INNER JOIN detalle_tipo_reclamo dtr ON r.detalle_id = dtr.detalle_id
      INNER JOIN tipo_reclamo tr ON dtr.tipo_id = tr.tipo_id
      LEFT JOIN prioridad p ON r.prioridad_id = p.prioridad_id
      WHERE i.cuadrilla_id = $1
        AND i.fecha >= CURRENT_DATE
        AND tr.nombre = 'TECNICO'
        AND ot.estado IN ('PENDIENTE', 'ASIGNADA', 'EN CURSO')
      GROUP BY i.fecha, i.itinerario_id
      ORDER BY i.fecha ASC
      LIMIT 30
    `;

    const resultado = await pool.query(query, [cuadrilla_id, empleado_id]);
    return resultado.rows;
  }
}

export default OrdenTrabajo;
