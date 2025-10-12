import pool from '../db.js';

class Usuario {
  /**
   * Buscar usuario por email
   */
  static async buscarPorEmail(email) {
    try {
      console.log('🔍 Usuario.buscarPorEmail:', email);
      const resultado = await pool.query(
        'SELECT * FROM usuario WHERE email = $1',
        [email]
      );
      console.log('✅ Query ejecutada, rows:', resultado.rows.length);
      return resultado.rows[0];
    } catch (error) {
      console.error('❌ Error en buscarPorEmail:', error);
      throw error;
    }
  }

  /**
   * Buscar usuario por ID con información completa
   */
  static async buscarPorId(usuarioId) {
    const resultado = await pool.query(`
      SELECT 
        u.usuario_id,
        u.email,
        u.socio_id,
        u.empleado_id,
        u.activo,
        u.ultimo_login,
        s.nombre as socio_nombre,
        s.apellido as socio_apellido,
        s.dni as socio_dni,
        e.nombre as empleado_nombre,
        e.apellido as empleado_apellido,
        e.legajo as empleado_legajo
      FROM usuario u
      LEFT JOIN socio s ON u.socio_id = s.socio_id
      LEFT JOIN empleado e ON u.empleado_id = e.empleado_id
      WHERE u.usuario_id = $1
    `, [usuarioId]);
    return resultado.rows[0];
  }

  /**
   * Obtener roles del usuario
   */
  static async obtenerRoles(usuarioId) {
    const resultado = await pool.query(`
      SELECT r.rol_id, r.nombre, r.descripcion
      FROM usuario_rol ur
      INNER JOIN rol r ON ur.rol_id = r.rol_id
      WHERE ur.usuario_id = $1
    `, [usuarioId]);
    return resultado.rows;
  }

  /**
   * Actualizar último login
   */
  static async actualizarUltimoLogin(usuarioId) {
    await pool.query(
      'UPDATE usuario SET ultimo_login = NOW() WHERE usuario_id = $1',
      [usuarioId]
    );
  }

  /**
   * Crear nuevo usuario
   */
  static async crear({ email, hashPass, socioId = null, empleadoId = null }) {
    const resultado = await pool.query(`
      INSERT INTO usuario (email, hash_pass, socio_id, empleado_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [email, hashPass, socioId, empleadoId]);
    return resultado.rows[0];
  }

  /**
   * Verificar si el usuario tiene un rol específico
   */
  static async tieneRol(usuarioId, nombreRol) {
    const resultado = await pool.query(`
      SELECT EXISTS(
        SELECT 1
        FROM usuario_rol ur
        INNER JOIN rol r ON ur.rol_id = r.rol_id
        WHERE ur.usuario_id = $1 AND r.nombre = $2
      ) as tiene_rol
    `, [usuarioId, nombreRol]);
    return resultado.rows[0].tiene_rol;
  }
}

export default Usuario;
