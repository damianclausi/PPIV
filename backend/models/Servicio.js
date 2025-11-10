import pool from '../db.js';

class Servicio {
  /**
   * Listar todos los servicios
   */
  static async listar() {
    const resultado = await pool.query(`
      SELECT 
        servicio_id,
        nombre,
        descripcion,
        activo
      FROM servicio
      WHERE activo = true
      ORDER BY nombre
    `);
    
    return resultado.rows;
  }

  /**
   * Obtener servicio por ID
   */
  static async obtenerPorId(servicioId) {
    const resultado = await pool.query(`
      SELECT *
      FROM servicio
      WHERE servicio_id = $1
    `, [servicioId]);
    
    return resultado.rows[0];
  }
}

export default Servicio;
