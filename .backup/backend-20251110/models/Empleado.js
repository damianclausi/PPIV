/**
 * Modelo de Empleado
 * Maneja las operaciones relacionadas con empleados (operarios y administrativos)
 */

import pool from '../db.js';

export default class Empleado {
  /**
   * Obtener perfil completo de un empleado por su ID
   */
  static async obtenerPerfil(empleadoId) {
    const query = `
      SELECT 
        e.*,
        u.email,
        u.ultimo_login,
        u.activo as usuario_activo
      FROM empleado e
      INNER JOIN usuario u ON e.empleado_id = u.empleado_id
      WHERE e.empleado_id = $1
    `;
    
    const result = await pool.query(query, [empleadoId]);
    return result.rows[0];
  }

  /**
   * Listar todos los empleados con filtros opcionales
   */
  static async listar({ activo = null, pagina = 1, limite = 10 } = {}) {
    let query = `
      SELECT 
        e.*,
        u.email,
        u.ultimo_login,
        u.activo as usuario_activo,
        COUNT(*) OVER() as total
      FROM empleado e
      INNER JOIN usuario u ON e.empleado_id = u.empleado_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (activo !== null) {
      query += ` AND e.activo = $${paramCount}`;
      params.push(activo);
      paramCount++;
    }
    
    const offset = (pagina - 1) * limite;
    query += ` ORDER BY e.apellido, e.nombre LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limite, offset);
    
    const result = await pool.query(query, params);
    
    return {
      empleados: result.rows,
      total: result.rows[0]?.total || 0,
      pagina,
      totalPaginas: Math.ceil((result.rows[0]?.total || 0) / limite)
    };
  }

  /**
   * Crear un nuevo empleado
   */
  static async crear(datosEmpleado) {
    const query = `
      INSERT INTO empleado (
        nombre, apellido, dni, telefono, direccion, 
        fecha_ingreso, cargo, activo
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const valores = [
      datosEmpleado.nombre,
      datosEmpleado.apellido,
      datosEmpleado.dni,
      datosEmpleado.telefono || null,
      datosEmpleado.direccion || null,
      datosEmpleado.fecha_ingreso || new Date(),
      datosEmpleado.cargo || 'Empleado',
      datosEmpleado.activo !== false
    ];
    
    const result = await pool.query(query, valores);
    return result.rows[0];
  }

  /**
   * Actualizar datos de un empleado
   */
  static async actualizar(empleadoId, datosEmpleado) {
    const campos = [];
    const valores = [];
    let paramCount = 1;
    
    if (datosEmpleado.nombre !== undefined) {
      campos.push(`nombre = $${paramCount}`);
      valores.push(datosEmpleado.nombre);
      paramCount++;
    }
    
    if (datosEmpleado.apellido !== undefined) {
      campos.push(`apellido = $${paramCount}`);
      valores.push(datosEmpleado.apellido);
      paramCount++;
    }
    
    if (datosEmpleado.telefono !== undefined) {
      campos.push(`telefono = $${paramCount}`);
      valores.push(datosEmpleado.telefono);
      paramCount++;
    }
    
    if (datosEmpleado.direccion !== undefined) {
      campos.push(`direccion = $${paramCount}`);
      valores.push(datosEmpleado.direccion);
      paramCount++;
    }
    
    if (datosEmpleado.cargo !== undefined) {
      campos.push(`cargo = $${paramCount}`);
      valores.push(datosEmpleado.cargo);
      paramCount++;
    }
    
    if (campos.length === 0) {
      return null;
    }
    
    valores.push(empleadoId);
    
    const query = `
      UPDATE empleado
      SET ${campos.join(', ')}
      WHERE empleado_id = $${paramCount}
      RETURNING *
    `;
    
    const result = await pool.query(query, valores);
    return result.rows[0];
  }

  /**
   * Cambiar estado activo de un empleado
   */
  static async cambiarEstado(empleadoId, activo) {
    const query = `
      UPDATE empleado
      SET activo = $1
      WHERE empleado_id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [activo, empleadoId]);
    return result.rows[0];
  }
}
