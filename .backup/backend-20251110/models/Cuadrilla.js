import pool from '../db.js';

class Cuadrilla {
  /**
   * Obtener todas las cuadrillas activas
   */
  static async obtenerCuadrillasActivas() {
    try {
      const result = await pool.query(`
        SELECT 
          c.cuadrilla_id,
          c.nombre,
          c.zona,
          c.activa,
          c.created_at,
          COUNT(ec.empleado_id) as miembros_count
        FROM cuadrilla c
        LEFT JOIN empleado_cuadrilla ec ON c.cuadrilla_id = ec.cuadrilla_id AND ec.activa = true
        WHERE c.activa = true
        GROUP BY c.cuadrilla_id, c.nombre, c.zona, c.activa, c.created_at
        ORDER BY c.nombre;
      `);
      return result.rows;
    } catch (error) {
      console.error('Error al obtener cuadrillas activas:', error);
      throw error;
    }
  }

  /**
   * Obtener cuadrilla por ID
   */
  static async obtenerPorId(cuadrilla_id) {
    try {
      const result = await pool.query(`
        SELECT 
          cuadrilla_id,
          nombre,
          zona,
          activa,
          created_at,
          updated_at
        FROM cuadrilla
        WHERE cuadrilla_id = $1;
      `, [cuadrilla_id]);
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error al obtener cuadrilla por ID:', error);
      throw error;
    }
  }

  /**
   * Obtener operarios de una cuadrilla específica
   * Solo operarios con asignación activa
   */
  static async obtenerOperariosDeCuadrilla(cuadrilla_id) {
    try {
      const result = await pool.query(`
        SELECT 
          e.empleado_id,
          e.nombre,
          e.apellido,
          e.nombre || ' ' || e.apellido as nombre_completo,
          e.legajo,
          e.rol_interno,
          ec.fecha_asignacion,
          ec.activa
        FROM empleado_cuadrilla ec
        INNER JOIN empleado e ON ec.empleado_id = e.empleado_id
        WHERE ec.cuadrilla_id = $1
          AND ec.activa = true
          AND e.activo = true
        ORDER BY e.apellido, e.nombre;
      `, [cuadrilla_id]);
      
      return result.rows;
    } catch (error) {
      console.error('Error al obtener operarios de cuadrilla:', error);
      throw error;
    }
  }

  /**
   * Obtener cuadrilla de un operario específico
   * Retorna la cuadrilla activa actual del operario
   */
  static async obtenerCuadrillaPorOperario(empleado_id) {
    try {
      const result = await pool.query(`
        SELECT 
          c.cuadrilla_id,
          c.nombre,
          c.zona,
          c.activa,
          ec.fecha_asignacion
        FROM empleado_cuadrilla ec
        INNER JOIN cuadrilla c ON ec.cuadrilla_id = c.cuadrilla_id
        WHERE ec.empleado_id = $1
          AND ec.activa = true
          AND c.activa = true
        LIMIT 1;
      `, [empleado_id]);
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error al obtener cuadrilla del operario:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los operarios técnicos disponibles
   * (empleados activos asignados a alguna cuadrilla)
   */
  static async obtenerOperariosDisponibles() {
    try {
      const result = await pool.query(`
        SELECT DISTINCT
          e.empleado_id,
          e.nombre,
          e.apellido,
          e.nombre || ' ' || e.apellido as nombre_completo,
          e.legajo,
          e.rol_interno,
          c.cuadrilla_id,
          c.nombre as cuadrilla,
          c.zona
        FROM empleado e
        INNER JOIN empleado_cuadrilla ec ON e.empleado_id = ec.empleado_id
        INNER JOIN cuadrilla c ON ec.cuadrilla_id = c.cuadrilla_id
        WHERE e.activo = true
          AND ec.activa = true
          AND c.activa = true
          AND e.rol_interno NOT LIKE '%ADMINISTRADOR%'
        ORDER BY e.apellido, e.nombre;
      `);
      
      return result.rows;
    } catch (error) {
      console.error('Error al obtener operarios disponibles:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de una cuadrilla
   */
  static async obtenerEstadisticas(cuadrilla_id) {
    try {
      const result = await pool.query(`
        SELECT 
          c.cuadrilla_id,
          c.nombre as cuadrilla,
          c.zona,
          COUNT(DISTINCT ec.empleado_id) as total_operarios,
          COUNT(DISTINCT ot.ot_id) FILTER (WHERE ot.estado = 'ASIGNADA') as ots_asignadas,
          COUNT(DISTINCT ot.ot_id) FILTER (WHERE ot.estado = 'EN_PROCESO') as ots_en_proceso,
          COUNT(DISTINCT ot.ot_id) FILTER (WHERE ot.estado = 'COMPLETADA') as ots_completadas
        FROM cuadrilla c
        LEFT JOIN empleado_cuadrilla ec ON c.cuadrilla_id = ec.cuadrilla_id AND ec.activa = true
        LEFT JOIN orden_trabajo ot ON ec.empleado_id = ot.empleado_id
        WHERE c.cuadrilla_id = $1
        GROUP BY c.cuadrilla_id, c.nombre, c.zona;
      `, [cuadrilla_id]);
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error al obtener estadísticas de cuadrilla:', error);
      throw error;
    }
  }
}

export default Cuadrilla;
