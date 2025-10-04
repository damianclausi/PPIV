import pool from '../db.js';

class Factura {
  /**
   * Obtener facturas por socio
   */
  static async obtenerPorSocio(socioId, { estado = null, limite = 10, offset = 0 }) {
    let query = `
      SELECT 
        f.factura_id,
        f.cuenta_id,
        f.periodo,
        f.importe,
        f.vencimiento,
        f.estado,
        f.numero_externo,
        c.numero_cuenta,
        c.direccion,
        s.nombre as servicio_nombre
      FROM factura f
      INNER JOIN cuenta c ON f.cuenta_id = c.cuenta_id
      INNER JOIN servicio s ON c.servicio_id = s.servicio_id
      WHERE c.socio_id = $1
    `;

    const params = [socioId];

    if (estado) {
      query += ` AND f.estado = $${params.length + 1}`;
      params.push(estado);
    }

    query += ` ORDER BY f.periodo DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limite, offset);

    const resultado = await pool.query(query, params);
    return resultado.rows;
  }

  /**
   * Obtener factura por ID
   */
  static async obtenerPorId(facturaId) {
    const resultado = await pool.query(`
      SELECT 
        f.*,
        c.numero_cuenta,
        c.direccion,
        c.localidad,
        s.nombre as servicio_nombre,
        so.nombre as socio_nombre,
        so.apellido as socio_apellido
      FROM factura f
      INNER JOIN cuenta c ON f.cuenta_id = c.cuenta_id
      INNER JOIN servicio s ON c.servicio_id = s.servicio_id
      INNER JOIN socio so ON c.socio_id = so.socio_id
      WHERE f.factura_id = $1
    `, [facturaId]);
    return resultado.rows[0];
  }

  /**
   * Obtener resumen de facturas por socio
   */
  static async obtenerResumen(socioId) {
    const resultado = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE estado = 'PENDIENTE') as pendientes,
        COUNT(*) FILTER (WHERE estado = 'PAGADA') as pagadas,
        COUNT(*) FILTER (WHERE estado = 'VENCIDA') as vencidas,
        SUM(importe) FILTER (WHERE estado = 'PENDIENTE') as monto_pendiente,
        SUM(importe) FILTER (WHERE estado = 'PAGADA') as monto_pagado
      FROM factura f
      INNER JOIN cuenta c ON f.cuenta_id = c.cuenta_id
      WHERE c.socio_id = $1
    `, [socioId]);
    return resultado.rows[0];
  }

  /**
   * Actualizar estado de factura
   */
  static async actualizarEstado(facturaId, estado) {
    const resultado = await pool.query(
      'UPDATE factura SET estado = $1, updated_at = NOW() WHERE factura_id = $2 RETURNING *',
      [estado, facturaId]
    );
    return resultado.rows[0];
  }

  /**
   * Registrar pago de factura
   */
  static async registrarPago(facturaId, { montoPagado, metodoPago, comprobante = null }) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Insertar pago (usando nombres correctos de columnas: monto, medio, fecha, external_ref)
      const pago = await client.query(`
        INSERT INTO pago (factura_id, monto, medio, external_ref, estado, fecha)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING *
      `, [facturaId, montoPagado, metodoPago, comprobante, 'APROBADO']);

      // Actualizar estado de factura
      const factura = await client.query(
        'UPDATE factura SET estado = $1 WHERE factura_id = $2 RETURNING *',
        ['PAGADA', facturaId]
      );

      await client.query('COMMIT');

      return {
        pago: pago.rows[0],
        factura: factura.rows[0]
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Crear nueva factura
   */
  static async crear({ cuentaId, periodo, importe, vencimiento, numeroExterno = null }) {
    const resultado = await pool.query(`
      INSERT INTO factura (cuenta_id, periodo, importe, vencimiento, numero_externo)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [cuentaId, periodo, importe, vencimiento, numeroExterno]);
    return resultado.rows[0];
  }

  /**
   * Obtener estadísticas de facturación para el admin
   */
  static async obtenerEstadisticas() {
    const resultado = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE estado = 'PENDIENTE') as pendientes,
        COUNT(*) FILTER (WHERE estado = 'PAGADA') as pagadas,
        COUNT(*) FILTER (WHERE estado = 'VENCIDA') as vencidas,
        SUM(importe) FILTER (WHERE estado = 'PENDIENTE') as monto_pendiente,
        SUM(importe) FILTER (WHERE estado = 'PAGADA') as monto_pagado,
        SUM(importe) FILTER (WHERE estado = 'PAGADA' AND DATE(updated_at) >= CURRENT_DATE - INTERVAL '30 days') as recaudado_ultimo_mes
      FROM factura
    `);
    return resultado.rows[0];
  }
}

export default Factura;
