/**
 * Modelo de Lectura
 * Representa las lecturas del medidor de electricidad
 */

import pool from '../db.js';

class Lectura {
  /**
   * Listar lecturas por cuenta (historial de consumo eléctrico)
   */
  static async listarPorCuenta(cuentaId) {
    const resultado = await pool.query(`
      SELECT 
        l.lectura_id,
        l.fecha,
        l.estado_anterior,
        l.estado_actual,
        l.consumo,
        l.ruta,
        l.observaciones,
        l.created_at,
        m.numero_medidor,
        f.factura_id,
        f.importe as monto_factura,
        f.estado as estado_factura,
        f.vencimiento as fecha_vencimiento_factura
      FROM lectura l
      INNER JOIN medidor m ON l.medidor_id = m.medidor_id
      LEFT JOIN factura f ON m.cuenta_id = f.cuenta_id 
        AND DATE_TRUNC('month', l.fecha) = DATE_TRUNC('month', f.periodo)
      WHERE m.cuenta_id = $1
      ORDER BY l.fecha DESC
      LIMIT 50
    `, [cuentaId]);
    return resultado.rows;
  }

  /**
   * Obtener lectura por ID
   */
  static async obtenerPorId(lecturaId) {
    const resultado = await pool.query(`
      SELECT 
        l.lectura_id,
        l.cuenta_id,
        l.fecha_lectura,
        l.lectura_anterior,
        l.lectura_actual,
        (l.lectura_actual - l.lectura_anterior) as consumo_kwh,
        l.periodo,
        l.observaciones,
        l.created_at,
        c.numero_cuenta,
        c.direccion
      FROM lectura l
      INNER JOIN cuenta c ON l.cuenta_id = c.cuenta_id
      WHERE l.lectura_id = $1
    `, [lecturaId]);
    return resultado.rows[0];
  }

  /**
   * Crear nueva lectura
   */
  static async crear({ cuentaId, fechaLectura, lecturaAnterior, lecturaActual, periodo, observaciones }) {
    const resultado = await pool.query(`
      INSERT INTO lectura (
        cuenta_id,
        fecha_lectura,
        lectura_anterior,
        lectura_actual,
        periodo,
        observaciones
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [cuentaId, fechaLectura, lecturaAnterior, lecturaActual, periodo, observaciones]);
    return resultado.rows[0];
  }

  /**
   * Obtener estadísticas de consumo por cuenta
   */
  static async obtenerEstadisticasPorCuenta(cuentaId) {
    const resultado = await pool.query(`
      SELECT 
        COUNT(*) as total_lecturas,
        AVG(lectura_actual - lectura_anterior) as consumo_promedio,
        MAX(lectura_actual - lectura_anterior) as consumo_maximo,
        MIN(lectura_actual - lectura_anterior) as consumo_minimo,
        SUM(lectura_actual - lectura_anterior) as consumo_total
      FROM lectura
      WHERE cuenta_id = $1
    `, [cuentaId]);
    return resultado.rows[0];
  }
}

export default Lectura;
