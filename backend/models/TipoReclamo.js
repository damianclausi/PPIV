import pool from '../db.js';

class TipoReclamo {
  /**
   * Obtener todos los tipos de reclamo
   * @returns {Promise<Array>} Lista de tipos de reclamo con tipo_id y nombre
   */
  static async obtenerTodos() {
    try {
      const query = 'SELECT tipo_id, nombre FROM tipo_reclamo ORDER BY tipo_id';
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error al obtener tipos de reclamo:', error);
      throw new Error('Error al obtener tipos de reclamo');
    }
  }

  /**
   * Obtener un tipo de reclamo por ID
   * @param {number} tipoId - ID del tipo de reclamo
   * @returns {Promise<Object>} Tipo de reclamo
   */
  static async obtenerPorId(tipoId) {
    try {
      const query = 'SELECT tipo_id, nombre FROM tipo_reclamo WHERE tipo_id = $1';
      const result = await pool.query(query, [tipoId]);
      
      if (result.rows.length === 0) {
        throw new Error('Tipo de reclamo no encontrado');
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error al obtener tipo de reclamo:', error);
      throw error;
    }
  }
}

export default TipoReclamo;
