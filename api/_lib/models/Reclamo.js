import pool from '../db.js';
import Cuadrilla from './Cuadrilla.js';

class Reclamo {
  /**
   * Obtener reclamos por socio
   */
  static async obtenerPorSocio(socioId, { estado = null, limite = 20, offset = 0 }) {
    let query = `
      SELECT 
        r.reclamo_id,
        r.cuenta_id,
        r.detalle_id,
        r.descripcion,
        r.estado,
        r.prioridad_id,
        r.fecha_alta,
        r.fecha_cierre,
        r.canal,
        d.nombre as detalle_reclamo,
        t.nombre as tipo_reclamo,
        p.nombre as prioridad,
        c.numero_cuenta,
        c.direccion
      FROM reclamo r
      INNER JOIN detalle_tipo_reclamo d ON r.detalle_id = d.detalle_id
      INNER JOIN tipo_reclamo t ON d.tipo_id = t.tipo_id
      INNER JOIN prioridad p ON r.prioridad_id = p.prioridad_id
      INNER JOIN cuenta c ON r.cuenta_id = c.cuenta_id
      WHERE c.socio_id = $1
    `;

    const params = [socioId];

    if (estado) {
      query += ` AND r.estado = $${params.length + 1}`;
      params.push(estado);
    }

    query += ` ORDER BY r.fecha_alta DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limite, offset);

    const resultado = await pool.query(query, params);
    return resultado.rows;
  }

  /**
   * Obtener reclamo por ID
   */
  static async obtenerPorId(reclamoId) {
  const resultado = await pool.query(`
      SELECT 
        r.*,
        d.nombre as detalle_reclamo,
        t.nombre as tipo_reclamo,
        t.descripcion as tipo_descripcion,
        p.nombre as prioridad,
        c.numero_cuenta,
        c.direccion,
        c.localidad,
        s.nombre as socio_nombre,
        s.apellido as socio_apellido,
        s.telefono as socio_telefono,
        ot.empleado_id as operario_asignado_id
      FROM reclamo r
      INNER JOIN detalle_tipo_reclamo d ON r.detalle_id = d.detalle_id
      INNER JOIN tipo_reclamo t ON d.tipo_id = t.tipo_id
      INNER JOIN prioridad p ON r.prioridad_id = p.prioridad_id
      INNER JOIN cuenta c ON r.cuenta_id = c.cuenta_id
      LEFT JOIN socio s ON c.socio_id = s.socio_id
      LEFT JOIN orden_trabajo ot ON r.reclamo_id = ot.reclamo_id
      WHERE r.reclamo_id = $1
    `, [reclamoId]);
  return resultado.rows[0];
  }

  /**
   * Crear nuevo reclamo
   * Crea automáticamente la OT sin empleado asignado para reclamos técnicos y administrativos
   */
  static async crear({ cuentaId, detalleId, descripcion, prioridadId = 2, canal = 'WEB' }) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 1. Crear el reclamo
      const resultadoReclamo = await client.query(`
        INSERT INTO reclamo (cuenta_id, detalle_id, descripcion, prioridad_id, canal, estado, fecha_alta)
        VALUES ($1, $2, $3, $4, $5, 'PENDIENTE', NOW())
        RETURNING *
      `, [cuentaId, detalleId, descripcion, prioridadId, canal]);
      
      const reclamo = resultadoReclamo.rows[0];
      
      // 2. Obtener información del tipo de reclamo
      const tipoReclamo = await client.query(`
        SELECT t.nombre as tipo, d.nombre as detalle, c.direccion
        FROM detalle_tipo_reclamo d
        INNER JOIN tipo_reclamo t ON d.tipo_id = t.tipo_id
        INNER JOIN cuenta c ON c.cuenta_id = $2
        WHERE d.detalle_id = $1
      `, [detalleId, cuentaId]);
      
      // 3. Crear OT automáticamente para todos los reclamos
      if (tipoReclamo.rows[0]) {
        await client.query(`
          INSERT INTO orden_trabajo (
            reclamo_id,
            empleado_id,
            direccion_intervencion,
            observaciones,
            estado,
            created_at,
            updated_at
          )
          VALUES ($1, NULL, $2, $3, 'PENDIENTE', NOW(), NOW())
        `, [
          reclamo.reclamo_id,
          tipoReclamo.rows[0].direccion,
          `OT creada automáticamente para: ${tipoReclamo.rows[0].detalle}`
        ]);
        
        console.log(`✅ OT ${tipoReclamo.rows[0].tipo.toLowerCase()} creada automáticamente para reclamo #${reclamo.reclamo_id}`);
      }
      
      await client.query('COMMIT');
      return reclamo;
      
      await client.query('COMMIT');
      return reclamo;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Actualizar estado del reclamo
   * SINCRONIZA automáticamente con la OT asociada:
   * - EN_CURSO (reclamo) → EN_PROCESO (OT)
   * - RESUELTO (reclamo) → Ya manejado en completarTrabajo de OT
   */
  static async actualizarEstado(reclamoId, estado, observaciones = null) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const campos = ['estado = $1', 'updated_at = NOW()'];
      const params = [estado];
      
      if (estado === 'RESUELTO' || estado === 'CERRADO') {
        campos.push('fecha_cierre = NOW()');
        if (observaciones) {
          campos.push(`observaciones_cierre = $${params.length + 1}`);
          params.push(observaciones);
        }
      }

      params.push(reclamoId);

      const resultado = await client.query(`
        UPDATE reclamo 
        SET ${campos.join(', ')}
        WHERE reclamo_id = $${params.length}
        RETURNING *
      `, params);

      if (resultado.rowCount === 0) {
        throw new Error('Reclamo no encontrado');
      }

      const reclamo = resultado.rows[0];

      // SINCRONIZAR con OT si el reclamo pasa a EN_PROCESO o EN_CURSO
      if (estado === 'EN_PROCESO' || estado === 'EN_CURSO') {
        const otActualizada = await client.query(`
          UPDATE orden_trabajo
          SET estado = 'EN_PROCESO',
              updated_at = NOW()
          WHERE reclamo_id = $1
            AND estado IN ('PENDIENTE', 'ASIGNADA')
          RETURNING ot_id, estado
        `, [reclamoId]);

        if (otActualizada.rowCount > 0) {
          console.log(`✅ OT #${otActualizada.rows[0].ot_id} sincronizada a EN_PROCESO (desde reclamo #${reclamoId})`);
        } else {
          console.log(`⚠️ No se encontró OT PENDIENTE/ASIGNADA para reclamo #${reclamoId} (puede ya estar EN_PROCESO o COMPLETADA)`);
        }
      }

      await client.query('COMMIT');
      return reclamo;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error al actualizar estado del reclamo:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Obtener resumen de reclamos por socio
   */
  static async obtenerResumen(socioId) {
    const resultado = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE estado = 'PENDIENTE') as pendientes,
        COUNT(*) FILTER (WHERE estado = 'EN CURSO') as en_proceso,
        COUNT(*) FILTER (WHERE estado = 'RESUELTO') as resueltos
      FROM reclamo r
      INNER JOIN cuenta c ON r.cuenta_id = c.cuenta_id
      WHERE c.socio_id = $1
    `, [socioId]);
    return resultado.rows[0];
  }

  /**
   * Listar todos los reclamos (para administrativos)
   */
  static async listarTodos({ estado = null, prioridadId = null, tipo = null, busqueda = null, limite = 50, offset = 0 }) {
  let query = `
      SELECT 
        r.reclamo_id,
        r.descripcion,
        r.estado,
        r.fecha_alta,
        r.fecha_cierre,
        d.nombre as detalle_reclamo,
        t.nombre as tipo_reclamo,
        p.nombre as prioridad,
        c.numero_cuenta,
        c.direccion,
        s.nombre as socio_nombre,
        s.apellido as socio_apellido
      FROM reclamo r
      INNER JOIN detalle_tipo_reclamo d ON r.detalle_id = d.detalle_id
      INNER JOIN tipo_reclamo t ON d.tipo_id = t.tipo_id
      INNER JOIN prioridad p ON r.prioridad_id = p.prioridad_id
      INNER JOIN cuenta c ON r.cuenta_id = c.cuenta_id
      INNER JOIN socio s ON c.socio_id = s.socio_id
      WHERE 1=1
    `;

  const params = [];
  let paramCount = 1;

    if (estado) {
      query += ` AND r.estado = $${paramCount}`;
      params.push(estado);
      paramCount++;
    }
    if (prioridadId) {
      query += ` AND r.prioridad_id = $${paramCount}`;
      params.push(prioridadId);
      paramCount++;
    }
    if (typeof tipo !== 'undefined' && tipo && tipo.toLowerCase() !== 'todos') {
      query += ` AND UPPER(t.nombre) = $${paramCount}`;
      params.push(tipo.toUpperCase());
      paramCount++;
    }
    if (busqueda) {
      query += ` AND (CAST(r.reclamo_id AS TEXT) ILIKE $${paramCount} OR s.nombre ILIKE $${paramCount} OR s.apellido ILIKE $${paramCount} OR c.direccion ILIKE $${paramCount})`;
      params.push(`%${busqueda}%`);
      paramCount++;
    }
    query += ` ORDER BY r.fecha_alta DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limite, offset);

    const resultado = await pool.query(query, params);
    return resultado.rows;
  }

  /**
   * Contar reclamos con filtros
   */
  static async contarTodos({ estado = null, prioridadId = null, tipo = null, busqueda = null }) {
    let query = `
      SELECT COUNT(*) as total
      FROM reclamo r
      INNER JOIN detalle_tipo_reclamo d ON r.detalle_id = d.detalle_id
      INNER JOIN tipo_reclamo t ON d.tipo_id = t.tipo_id
      INNER JOIN prioridad p ON r.prioridad_id = p.prioridad_id
      INNER JOIN cuenta c ON r.cuenta_id = c.cuenta_id
      INNER JOIN socio s ON c.socio_id = s.socio_id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (estado) {
      query += ` AND r.estado = $${paramCount}`;
      params.push(estado);
      paramCount++;
    }
    if (prioridadId) {
      query += ` AND r.prioridad_id = $${paramCount}`;
      params.push(prioridadId);
      paramCount++;
    }
    if (typeof tipo !== 'undefined' && tipo && tipo.toLowerCase() !== 'todos') {
      query += ` AND UPPER(t.nombre) = $${paramCount}`;
      params.push(tipo.toUpperCase());
      paramCount++;
    }
    if (busqueda) {
      query += ` AND (CAST(r.reclamo_id AS TEXT) ILIKE $${paramCount} OR s.nombre ILIKE $${paramCount} OR s.apellido ILIKE $${paramCount} OR c.direccion ILIKE $${paramCount})`;
      params.push(`%${busqueda}%`);
      paramCount++;
    }

    const resultado = await pool.query(query, params);
    return parseInt(resultado.rows[0].total);
  }

  /**
   * Obtener reclamos asignados a un operario
   * Incluye tanto OTs asignadas directamente al operario como OTs del itinerario de su cuadrilla
   */
  static async obtenerPorOperario(operarioId, { estado = null, pagina = 1, limite = 10 } = {}) {
    // Obtener la cuadrilla del operario
    const cuadrilla = await Cuadrilla.obtenerCuadrillaPorOperario(operarioId);
    const cuadrillaId = cuadrilla?.cuadrilla_id;

    let query = `
      SELECT 
        r.reclamo_id,
        r.descripcion,
        r.estado,
        r.fecha_alta,
        r.fecha_cierre,
        d.nombre as detalle_reclamo,
        t.nombre as tipo_reclamo,
        p.nombre as prioridad,
        c.numero_cuenta,
        c.direccion,
        s.nombre as socio_nombre,
        s.apellido as socio_apellido,
        s.telefono as socio_telefono,
        ot.ot_id,
        ot.estado as estado_orden,
        ot.fecha_programada,
        CASE 
          WHEN id.itdet_id IS NOT NULL THEN true
          ELSE false
        END as es_itinerario,
        COUNT(*) OVER() as total
      FROM reclamo r
      INNER JOIN orden_trabajo ot ON r.reclamo_id = ot.reclamo_id
      INNER JOIN detalle_tipo_reclamo d ON r.detalle_id = d.detalle_id
      INNER JOIN tipo_reclamo t ON d.tipo_id = t.tipo_id
      INNER JOIN prioridad p ON r.prioridad_id = p.prioridad_id
      INNER JOIN cuenta c ON r.cuenta_id = c.cuenta_id
      INNER JOIN socio s ON c.socio_id = s.socio_id
      LEFT JOIN itinerario_det id ON ot.ot_id = id.ot_id
      LEFT JOIN itinerario i ON id.itinerario_id = i.itinerario_id AND i.cuadrilla_id = ${cuadrillaId ? '$2' : 'NULL'}
      WHERE t.tipo_id = 1
        AND (
          ot.empleado_id = $1
          ${cuadrillaId ? 'OR i.cuadrilla_id = $2' : ''}
        )
    `;

    const params = [operarioId];
    if (cuadrillaId) {
      params.push(cuadrillaId);
    }
    let paramCount = params.length + 1;

    if (estado) {
      query += ` AND r.estado = $${paramCount}`;
      params.push(estado);
      paramCount++;
    }

    const offset = (pagina - 1) * limite;
    query += ` ORDER BY 
      CASE WHEN id.itdet_id IS NOT NULL THEN 0 ELSE 1 END,
      ot.fecha_programada ASC NULLS LAST,
      r.fecha_alta DESC 
      LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limite, offset);

    const resultado = await pool.query(query, params);
    
    return {
      reclamos: resultado.rows,
      total: resultado.rows[0]?.total || 0,
      pagina,
      totalPaginas: Math.ceil((resultado.rows[0]?.total || 0) / limite)
    };
  }

  /**
   * Obtener resumen de reclamos para un operario
   * Incluye tanto reclamos regulares como OTs del itinerario de su cuadrilla
   */
  static async obtenerResumenPorOperario(operarioId) {
    // Obtener la cuadrilla del operario
    const cuadrilla = await Cuadrilla.obtenerCuadrillaPorOperario(operarioId);
    const cuadrillaId = cuadrilla?.cuadrilla_id;

    let query = `
      SELECT 
        COUNT(*) FILTER (WHERE r.estado IN ('PENDIENTE', 'ASIGNADA')) as pendientes,
        COUNT(*) FILTER (WHERE r.estado = 'EN_PROCESO') as en_proceso,
        COUNT(*) FILTER (WHERE r.estado = 'RESUELTO' AND DATE(r.fecha_cierre) = CURRENT_DATE) as resueltos_hoy,
        COUNT(*) as total
      FROM reclamo r
      INNER JOIN orden_trabajo ot ON r.reclamo_id = ot.reclamo_id
      INNER JOIN detalle_tipo_reclamo d ON r.detalle_id = d.detalle_id
      INNER JOIN tipo_reclamo t ON d.tipo_id = t.tipo_id
      LEFT JOIN itinerario_det id ON ot.ot_id = id.ot_id
      LEFT JOIN itinerario i ON id.itinerario_id = i.itinerario_id ${cuadrillaId ? 'AND i.cuadrilla_id = $2' : ''}
      WHERE t.tipo_id = 1
        AND (
          ot.empleado_id = $1
          ${cuadrillaId ? 'OR i.cuadrilla_id = $2' : ''}
        )
    `;

    const params = [operarioId];
    if (cuadrillaId) {
      params.push(cuadrillaId);
    }

    const resultado = await pool.query(query, params);
    return resultado.rows[0];
  }

  /**
   * Obtener resumen general de reclamos (para admin)
   */
  static async obtenerResumenGeneral() {
    const resultado = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE estado = 'PENDIENTE') as pendientes,
        COUNT(*) FILTER (WHERE estado = 'EN_PROCESO') as en_proceso,
        COUNT(*) FILTER (WHERE estado = 'RESUELTO') as resueltos,
        COUNT(*) FILTER (WHERE estado = 'CERRADO') as cerrados,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE DATE(fecha_alta) = CURRENT_DATE) as nuevos_hoy,
        COUNT(*) FILTER (WHERE DATE(fecha_cierre) = CURRENT_DATE) as resueltos_hoy
      FROM reclamo
    `);
    return resultado.rows[0];
  }

  /**
   * Asignar operario a un reclamo
   */
  static async asignarOperario(reclamoId, operarioId) {
    const resultado = await pool.query(`
      UPDATE reclamo 
      SET operario_asignado_id = $1, 
          estado = CASE WHEN estado = 'PENDIENTE' THEN 'EN_PROCESO' ELSE estado END,
          updated_at = NOW()
      WHERE reclamo_id = $2
      RETURNING *
    `, [operarioId, reclamoId]);
    return resultado.rows[0];
  }
}

export default Reclamo;
