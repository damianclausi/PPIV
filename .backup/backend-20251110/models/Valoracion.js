import pool from '../db.js';

/**
 * Modelo para gestionar valoraciones de reclamos
 */
class Valoracion {
  /**
   * Crear nueva valoración para un reclamo
   * @param {Object} datos - Datos de la valoración
   * @param {number} datos.reclamoId - ID del reclamo
   * @param {number} datos.socioId - ID del socio que valora
   * @param {number} datos.calificacion - Calificación (1-5 estrellas)
   * @param {string} datos.comentario - Comentario opcional
   * @returns {Promise<Object>} Valoración creada
   */
  static async crear({ reclamoId, socioId, calificacion, comentario = null }) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // 1. Verificar que el reclamo existe y está RESUELTO o CERRADO
      const reclamo = await client.query(`
        SELECT r.reclamo_id, r.estado, c.socio_id
        FROM reclamo r
        INNER JOIN cuenta c ON r.cuenta_id = c.cuenta_id
        WHERE r.reclamo_id = $1
      `, [reclamoId]);

      if (reclamo.rows.length === 0) {
        throw new Error('Reclamo no encontrado');
      }

      const estadoReclamo = reclamo.rows[0].estado;
      const socioReclamo = reclamo.rows[0].socio_id;

      // 2. Validar que el reclamo esté resuelto o cerrado
      if (estadoReclamo !== 'RESUELTO' && estadoReclamo !== 'CERRADO') {
        throw new Error('Solo se pueden valorar reclamos resueltos o cerrados');
      }

      // 3. Validar que el socio sea dueño del reclamo
      if (socioReclamo !== socioId) {
        throw new Error('No tienes permiso para valorar este reclamo');
      }

      // 4. Validar calificación
      if (calificacion < 1 || calificacion > 5) {
        throw new Error('La calificación debe estar entre 1 y 5');
      }

      // 5. Verificar si ya existe una valoración
      const valoracionExistente = await client.query(`
        SELECT valoracion_id FROM valoracion WHERE reclamo_id = $1 AND socio_id = $2
      `, [reclamoId, socioId]);

      if (valoracionExistente.rows.length > 0) {
        throw new Error('Ya has valorado este reclamo');
      }

      // 6. Crear la valoración
      const resultado = await client.query(`
        INSERT INTO valoracion (reclamo_id, socio_id, calificacion, comentario, fecha_valoracion)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING *
      `, [reclamoId, socioId, calificacion, comentario]);

      await client.query('COMMIT');
      return resultado.rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error al crear valoración:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Obtener valoración de un reclamo
   * @param {number} reclamoId - ID del reclamo
   * @returns {Promise<Object|null>} Valoración o null si no existe
   */
  static async obtenerPorReclamo(reclamoId) {
    try {
      const resultado = await pool.query(`
        SELECT 
          v.*,
          s.nombre as socio_nombre,
          s.apellido as socio_apellido
        FROM valoracion v
        INNER JOIN socio s ON v.socio_id = s.socio_id
        WHERE v.reclamo_id = $1
      `, [reclamoId]);

      return resultado.rows.length > 0 ? resultado.rows[0] : null;
    } catch (error) {
      console.error('Error al obtener valoración por reclamo:', error);
      throw error;
    }
  }

  /**
   * Obtener todas las valoraciones de un socio
   * @param {number} socioId - ID del socio
   * @returns {Promise<Array>} Lista de valoraciones del socio
   */
  static async obtenerPorSocio(socioId) {
    try {
      const resultado = await pool.query(`
        SELECT 
          v.*,
          r.reclamo_id,
          r.descripcion as reclamo_descripcion,
          d.nombre as detalle_reclamo
        FROM valoracion v
        INNER JOIN reclamo r ON v.reclamo_id = r.reclamo_id
        INNER JOIN detalle_tipo_reclamo d ON r.detalle_id = d.detalle_id
        WHERE v.socio_id = $1
        ORDER BY v.fecha_valoracion DESC
      `, [socioId]);

      return resultado.rows;
    } catch (error) {
      console.error('Error al obtener valoraciones por socio:', error);
      throw error;
    }
  }

  /**
   * Actualizar valoración existente
   * @param {number} valoracionId - ID de la valoración
   * @param {number} socioId - ID del socio (para validar permisos)
   * @param {Object} datos - Datos a actualizar
   * @param {number} datos.calificacion - Nueva calificación
   * @param {string} datos.comentario - Nuevo comentario
   * @returns {Promise<Object>} Valoración actualizada
   */
  static async actualizar(valoracionId, socioId, { calificacion, comentario }) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // 1. Verificar que la valoración existe y pertenece al socio
      const valoracion = await client.query(`
        SELECT valoracion_id, socio_id FROM valoracion WHERE valoracion_id = $1
      `, [valoracionId]);

      if (valoracion.rows.length === 0) {
        throw new Error('Valoración no encontrada');
      }

      if (valoracion.rows[0].socio_id !== socioId) {
        throw new Error('No tienes permiso para modificar esta valoración');
      }

      // 2. Validar calificación
      if (calificacion < 1 || calificacion > 5) {
        throw new Error('La calificación debe estar entre 1 y 5');
      }

      // 3. Actualizar valoración
      const resultado = await client.query(`
        UPDATE valoracion 
        SET calificacion = $1, 
            comentario = $2,
            fecha_valoracion = NOW()
        WHERE valoracion_id = $3
        RETURNING *
      `, [calificacion, comentario, valoracionId]);

      await client.query('COMMIT');
      return resultado.rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error al actualizar valoración:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Eliminar valoración (por si el socio se arrepiente)
   * @param {number} valoracionId - ID de la valoración
   * @param {number} socioId - ID del socio (para validar permisos)
   * @returns {Promise<boolean>} true si se eliminó correctamente
   */
  static async eliminar(valoracionId, socioId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Verificar que la valoración existe y pertenece al socio
      const valoracion = await client.query(`
        SELECT valoracion_id, socio_id FROM valoracion WHERE valoracion_id = $1
      `, [valoracionId]);

      if (valoracion.rows.length === 0) {
        throw new Error('Valoración no encontrada');
      }

      if (valoracion.rows[0].socio_id !== socioId) {
        throw new Error('No tienes permiso para eliminar esta valoración');
      }

      // Eliminar valoración
      await client.query(`DELETE FROM valoracion WHERE valoracion_id = $1`, [valoracionId]);

      await client.query('COMMIT');
      return true;

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error al eliminar valoración:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Obtener estadísticas de valoraciones
   * @returns {Promise<Object>} Estadísticas generales
   */
  static async obtenerEstadisticas() {
    try {
      const resultado = await pool.query(`
        SELECT 
          COUNT(*) as total_valoraciones,
          ROUND(AVG(calificacion), 2) as promedio_calificacion,
          COUNT(*) FILTER (WHERE calificacion = 5) as cinco_estrellas,
          COUNT(*) FILTER (WHERE calificacion = 4) as cuatro_estrellas,
          COUNT(*) FILTER (WHERE calificacion = 3) as tres_estrellas,
          COUNT(*) FILTER (WHERE calificacion = 2) as dos_estrellas,
          COUNT(*) FILTER (WHERE calificacion = 1) as una_estrella,
          COUNT(*) FILTER (WHERE comentario IS NOT NULL AND comentario != '') as con_comentario
        FROM valoracion
      `);

      return resultado.rows[0];
    } catch (error) {
      console.error('Error al obtener estadísticas de valoraciones:', error);
      throw error;
    }
  }

  /**
   * Obtener valoraciones recientes
   * @param {number} limite - Cantidad de valoraciones a obtener
   * @returns {Promise<Array>} Lista de valoraciones recientes
   */
  static async obtenerRecientes(limite = 10) {
    try {
      const resultado = await pool.query(`
        SELECT 
          v.*,
          r.reclamo_id,
          r.descripcion as reclamo_descripcion,
          d.nombre as detalle_reclamo,
          s.nombre as socio_nombre,
          s.apellido as socio_apellido
        FROM valoracion v
        INNER JOIN reclamo r ON v.reclamo_id = r.reclamo_id
        INNER JOIN detalle_tipo_reclamo d ON r.detalle_id = d.detalle_id
        INNER JOIN socio s ON v.socio_id = s.socio_id
        ORDER BY v.fecha_valoracion DESC
        LIMIT $1
      `, [limite]);

      return resultado.rows;
    } catch (error) {
      console.error('Error al obtener valoraciones recientes:', error);
      throw error;
    }
  }
}

export default Valoracion;
