import pool from '../db.js';

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
        s.telefono as socio_telefono
      FROM reclamo r
      INNER JOIN detalle_tipo_reclamo d ON r.detalle_id = d.detalle_id
      INNER JOIN tipo_reclamo t ON d.tipo_id = t.tipo_id
      INNER JOIN prioridad p ON r.prioridad_id = p.prioridad_id
      INNER JOIN cuenta c ON r.cuenta_id = c.cuenta_id
      INNER JOIN socio s ON c.socio_id = s.socio_id
      WHERE r.reclamo_id = $1
    `, [reclamoId]);
    return resultado.rows[0];
  }

  /**
   * Crear nuevo reclamo
   */
  static async crear({ cuentaId, detalleId, descripcion, prioridadId = 2, canal = 'WEB' }) {
    const resultado = await pool.query(`
      INSERT INTO reclamo (cuenta_id, detalle_id, descripcion, prioridad_id, canal, estado, fecha_alta)
      VALUES ($1, $2, $3, $4, $5, 'PENDIENTE', NOW())
      RETURNING *
    `, [cuentaId, detalleId, descripcion, prioridadId, canal]);
    return resultado.rows[0];
  }

  /**
   * Actualizar estado del reclamo
   */
  static async actualizarEstado(reclamoId, estado, observaciones = null) {
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

    const resultado = await pool.query(`
      UPDATE reclamo 
      SET ${campos.join(', ')}
      WHERE reclamo_id = $${params.length}
      RETURNING *
    `, params);

    return resultado.rows[0];
  }

  /**
   * Obtener resumen de reclamos por socio
   */
  static async obtenerResumen(socioId) {
    const resultado = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE estado = 'PENDIENTE') as pendientes,
        COUNT(*) FILTER (WHERE estado = 'EN_PROCESO') as en_proceso,
        COUNT(*) FILTER (WHERE estado = 'RESUELTO') as resueltos,
        COUNT(*) FILTER (WHERE estado = 'CERRADO') as cerrados
      FROM reclamo r
      INNER JOIN cuenta c ON r.cuenta_id = c.cuenta_id
      WHERE c.socio_id = $1
    `, [socioId]);
    return resultado.rows[0];
  }

  /**
   * Listar todos los reclamos (para administrativos)
   */
  static async listarTodos({ estado = null, prioridadId = null, limite = 50, offset = 0 }) {
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

    if (estado) {
      query += ` AND r.estado = $${params.length + 1}`;
      params.push(estado);
    }

    if (prioridadId) {
      query += ` AND r.prioridad_id = $${params.length + 1}`;
      params.push(prioridadId);
    }

    query += ` ORDER BY r.fecha_alta DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limite, offset);

    const resultado = await pool.query(query, params);
    return resultado.rows;
  }

  /**
   * Obtener reclamos asignados a un operario
   */
  static async obtenerPorOperario(operarioId, { estado = null, pagina = 1, limite = 10 } = {}) {
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
        ot.estado as estado_orden,
        COUNT(*) OVER() as total
      FROM reclamo r
      INNER JOIN orden_trabajo ot ON r.reclamo_id = ot.reclamo_id
      INNER JOIN detalle_tipo_reclamo d ON r.detalle_id = d.detalle_id
      INNER JOIN tipo_reclamo t ON d.tipo_id = t.tipo_id
      INNER JOIN prioridad p ON r.prioridad_id = p.prioridad_id
      INNER JOIN cuenta c ON r.cuenta_id = c.cuenta_id
      INNER JOIN socio s ON c.socio_id = s.socio_id
      WHERE ot.empleado_id = $1
        AND t.tipo_id = 1
    `;

    const params = [operarioId];
    let paramCount = 2;

    if (estado) {
      query += ` AND r.estado = $${paramCount}`;
      params.push(estado);
      paramCount++;
    }

    const offset = (pagina - 1) * limite;
    query += ` ORDER BY r.fecha_alta DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
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
   */
  static async obtenerResumenPorOperario(operarioId) {
    const resultado = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE r.estado = 'PENDIENTE') as pendientes,
        COUNT(*) FILTER (WHERE r.estado = 'EN_PROCESO') as en_proceso,
        COUNT(*) FILTER (WHERE r.estado = 'RESUELTO' AND DATE(r.fecha_cierre) = CURRENT_DATE) as resueltos_hoy,
        COUNT(*) as total
      FROM reclamo r
      INNER JOIN orden_trabajo ot ON r.reclamo_id = ot.reclamo_id
      INNER JOIN detalle_tipo_reclamo d ON r.detalle_id = d.detalle_id
      INNER JOIN tipo_reclamo t ON d.tipo_id = t.tipo_id
      WHERE ot.empleado_id = $1
        AND t.tipo_id = 1
    `, [operarioId]);
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
