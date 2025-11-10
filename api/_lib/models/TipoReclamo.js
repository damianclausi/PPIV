import pool from '../db.js';

/**
 * Modelo para gestionar los tipos principales de reclamo (TECNICO / ADMINISTRATIVO)
 */
class TipoReclamo {
  /**
   * Obtener todos los tipos de reclamo (TECNICO / ADMINISTRATIVO)
   * @returns {Promise<Array>} Lista de tipos con tipo_id, nombre y descripcion
   */
  static async obtenerTodos() {
    try {
      const query = 'SELECT tipo_id, nombre, descripcion FROM tipo_reclamo WHERE activo = true ORDER BY tipo_id';
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
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
      const query = 'SELECT tipo_id, nombre, descripcion FROM tipo_reclamo WHERE tipo_id = $1';
      const result = await pool.query(query, [tipoId]);
      
      if (result.rows.length === 0) {
        throw new Error('Tipo de reclamo no encontrado');
      }
      
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener un tipo por nombre (TECNICO o ADMINISTRATIVO)
   * @param {string} nombre - Nombre del tipo
   * @returns {Promise<Object>} Tipo de reclamo
   */
  static async obtenerPorNombre(nombre) {
    try {
      const query = 'SELECT tipo_id, nombre, descripcion FROM tipo_reclamo WHERE UPPER(nombre) = UPPER($1)';
      const result = await pool.query(query, [nombre]);
      
      if (result.rows.length === 0) {
        throw new Error('Tipo de reclamo no encontrado');
      }
      
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
}

export default TipoReclamo;
