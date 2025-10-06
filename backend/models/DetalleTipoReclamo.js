import pool from '../db.js';

/**
 * Modelo para gestionar los detalles de tipos de reclamo
 */
class DetalleTipoReclamo {
  /**
   * Obtener todos los detalles de tipos de reclamo con su tipo
   * @returns {Promise<Array>} Lista de detalles con detalle_id, nombre y tipo
   */
  static async obtenerTodos() {
    try {
      const query = `
        SELECT 
          d.detalle_id, 
          d.nombre, 
          d.tipo_id,
          t.nombre as tipo_nombre
        FROM detalle_tipo_reclamo d
        INNER JOIN tipo_reclamo t ON d.tipo_id = t.tipo_id
        WHERE d.activo = true
        ORDER BY t.nombre DESC, d.detalle_id
      `;
      const resultado = await pool.query(query);
      return resultado.rows;
    } catch (error) {
      console.error('Error al obtener detalles de tipos de reclamo:', error);
      throw error;
    }
  }

  /**
   * Obtener detalles por tipo de reclamo (TECNICO o ADMINISTRATIVO)
   * @param {number} tipoId - ID del tipo de reclamo
   * @returns {Promise<Array>} Lista de detalles del tipo especificado
   */
  static async obtenerPorTipo(tipoId) {
    try {
      const query = `
        SELECT 
          d.detalle_id, 
          d.nombre, 
          d.tipo_id
        FROM detalle_tipo_reclamo d
        WHERE d.tipo_id = $1 AND d.activo = true
        ORDER BY d.detalle_id
      `;
      const resultado = await pool.query(query, [tipoId]);
      return resultado.rows;
    } catch (error) {
      console.error('Error al obtener detalles por tipo:', error);
      throw error;
    }
  }

  /**
   * Obtener un detalle específico por ID
   * @param {number} detalleId - ID del detalle
   * @returns {Promise<Object>} Detalle de tipo de reclamo
   */
  static async obtenerPorId(detalleId) {
    try {
      const query = `
        SELECT 
          d.detalle_id, 
          d.nombre, 
          d.tipo_id,
          t.nombre as tipo_nombre
        FROM detalle_tipo_reclamo d
        INNER JOIN tipo_reclamo t ON d.tipo_id = t.tipo_id
        WHERE d.detalle_id = $1
      `;
      const resultado = await pool.query(query, [detalleId]);
      return resultado.rows[0];
    } catch (error) {
      console.error('Error al obtener detalle por ID:', error);
      throw error;
    }
  }
}

export default DetalleTipoReclamo;
