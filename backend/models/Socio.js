import pool from '../db.js';

class Socio {
  /**
   * Obtener perfil completo del socio
   */
  static async obtenerPerfil(socioId) {
    const resultado = await pool.query(`
      SELECT 
        s.socio_id,
        s.nombre,
        s.apellido,
        s.dni,
        s.email,
        s.telefono,
        s.activo,
        s.fecha_alta
      FROM socio s
      WHERE s.socio_id = $1
    `, [socioId]);
    return resultado.rows[0];
  }

  /**
   * Obtener cuentas del socio
   */
  static async obtenerCuentas(socioId) {
    const resultado = await pool.query(`
      SELECT 
        c.cuenta_id,
        c.numero_cuenta,
        c.direccion,
        c.localidad,
        c.principal,
        c.activa,
        s.nombre as servicio_nombre,
        s.descripcion as servicio_descripcion
      FROM cuenta c
      INNER JOIN servicio s ON c.servicio_id = s.servicio_id
      WHERE c.socio_id = $1
      ORDER BY c.principal DESC, c.cuenta_id
    `, [socioId]);
    return resultado.rows;
  }

  /**
   * Crear nuevo socio
   */
  static async crear(datos) {
    const { 
      nombre, 
      apellido, 
      dni, 
      email, 
      telefono, 
      direccion, 
      fecha_nacimiento, 
      activo = true 
    } = datos;
    
    const resultado = await pool.query(`
      INSERT INTO socio (
        nombre, 
        apellido, 
        dni, 
        email, 
        telefono, 
        direccion, 
        fecha_nacimiento, 
        activo
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [nombre, apellido, dni, email, telefono, direccion, fecha_nacimiento, activo]);
    
    return resultado.rows[0];
  }

  /**
   * Actualizar socio
   */
  static async actualizar(socioId, datos) {
    const campos = [];
    const valores = [];
    let contador = 1;

    Object.keys(datos).forEach(key => {
      campos.push(`${key} = $${contador}`);
      valores.push(datos[key]);
      contador++;
    });

    valores.push(socioId);

    const resultado = await pool.query(`
      UPDATE socio 
      SET ${campos.join(', ')}, updated_at = NOW()
      WHERE socio_id = $${contador}
      RETURNING *
    `, valores);

    return resultado.rows[0];
  }

  /**
   * Cambiar estado del socio
   */
  static async cambiarEstado(socioId, activo) {
    const resultado = await pool.query(
      'UPDATE socio SET activo = $1, updated_at = NOW() WHERE socio_id = $2 RETURNING *',
      [activo, socioId]
    );
    return resultado.rows[0];
  }

  /**
   * Listar todos los socios con paginación
   */
  static async listar({ limite = 50, offset = 0, activo = null, busqueda = null }) {
    let query = `
      SELECT 
        s.socio_id,
        s.nombre,
        s.apellido,
        s.dni,
        s.email,
        s.telefono,
        s.activo,
        s.fecha_alta,
        COUNT(c.cuenta_id) as cantidad_cuentas
      FROM socio s
      LEFT JOIN cuenta c ON s.socio_id = c.socio_id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (activo !== null) {
      query += ` AND s.activo = $${paramCount}`;
      params.push(activo);
      paramCount++;
    }

    if (busqueda) {
      query += ` AND (
        s.nombre ILIKE $${paramCount} OR 
        s.apellido ILIKE $${paramCount} OR 
        s.dni ILIKE $${paramCount} OR
        s.email ILIKE $${paramCount}
      )`;
      params.push(`%${busqueda}%`);
      paramCount++;
    }

    query += ` GROUP BY s.socio_id ORDER BY s.fecha_alta DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limite, offset);

    const resultado = await pool.query(query, params);
    return resultado.rows;
  }

  /**
   * Eliminar un socio
   */
  static async eliminar(socioId) {
    const resultado = await pool.query(
      'DELETE FROM socio WHERE socio_id = $1 RETURNING socio_id',
      [socioId]
    );
    return resultado.rows[0];
  }

  /**
   * Obtener estadísticas de socios para el admin
   */
  static async obtenerEstadisticas() {
    const resultado = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE activo = true) as activos,
        COUNT(*) FILTER (WHERE activo = false) as inactivos,
        COUNT(*) FILTER (WHERE DATE(fecha_alta) >= CURRENT_DATE - INTERVAL '30 days') as nuevos_ultimo_mes
      FROM socio
    `);
    return resultado.rows[0];
  }
}

export default Socio;
