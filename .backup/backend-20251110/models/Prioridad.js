import pool from '../db.js';

class Prioridad {
  /**
   * Obtener todas las prioridades activas
   * @returns {Promise<Array>} Lista de prioridades con id, nombre, orden, color
   */
  static async obtenerTodas() {
    try {
      const query = `
        SELECT prioridad_id, nombre, orden, color, activo
        FROM prioridad
        WHERE activo = true
        ORDER BY orden ASC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error al obtener prioridades:', error);
      throw new Error('Error al obtener prioridades');
    }
  }

  /**
   * Obtener una prioridad por ID
   * @param {number} prioridadId - ID de la prioridad
   * @returns {Promise<Object>} Prioridad
   */
  static async obtenerPorId(prioridadId) {
    try {
      const query = `
        SELECT prioridad_id, nombre, orden, color, activo
        FROM prioridad
        WHERE prioridad_id = $1
      `;
      const result = await pool.query(query, [prioridadId]);
      
      if (result.rows.length === 0) {
        throw new Error('Prioridad no encontrada');
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error al obtener prioridad:', error);
      throw error;
    }
  }

  /**
   * Obtener prioridad por nombre
   * @param {string} nombre - Nombre de la prioridad (Alta, Media, Baja)
   * @returns {Promise<Object>} Prioridad
   */
  static async obtenerPorNombre(nombre) {
    try {
      const query = `
        SELECT prioridad_id, nombre, orden, color, activo
        FROM prioridad
        WHERE LOWER(nombre) = LOWER($1)
      `;
      const result = await pool.query(query, [nombre]);
      
      if (result.rows.length === 0) {
        throw new Error('Prioridad no encontrada');
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error al obtener prioridad por nombre:', error);
      throw error;
    }
  }
}

export default Prioridad;
