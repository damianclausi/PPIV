import pool from '../db.js';

class Cuenta {
  /**
   * Generar número de cuenta único (último + 1)
   */
  static async generarNumeroCuenta() {
    const resultado = await pool.query(`
      SELECT COALESCE(MAX(CAST(numero_cuenta AS INTEGER)), 0) + 1 as siguiente
      FROM cuenta
      WHERE numero_cuenta ~ '^[0-9]+$'
    `);
    
    const siguiente = resultado.rows[0].siguiente;
    // Formatear con ceros a la izquierda (6 dígitos)
    return siguiente.toString().padStart(6, '0');
  }

  /**
   * Generar número de medidor único (último + 1)
   */
  static async generarNumeroMedidor() {
    const resultado = await pool.query(`
      SELECT COALESCE(MAX(CAST(numero_medidor AS INTEGER)), 0) + 1 as siguiente
      FROM medidor
      WHERE numero_medidor ~ '^[0-9]+$'
    `);
    
    const siguiente = resultado.rows[0].siguiente;
    // Formatear con ceros a la izquierda (6 dígitos)
    return siguiente.toString().padStart(6, '0');
  }

  /**
   * Crear nueva cuenta
   */
  static async crear(datos) {
    const { 
      socio_id,
      direccion,
      servicio_id,
      principal = false,
      activa = true
    } = datos;
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Generar número de cuenta automáticamente
      const numero_cuenta = await this.generarNumeroCuenta();
      
      // Generar número de medidor automáticamente
      const numero_medidor = await this.generarNumeroMedidor();
      
      // Localidad fija para todas las cuentas
      const localidad = 'Gobernador Ugarte';
      
      // Crear la cuenta
      const resultadoCuenta = await client.query(`
        INSERT INTO cuenta (
          socio_id,
          numero_cuenta, 
          direccion,
          localidad,
          servicio_id,
          principal,
          activa
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [socio_id, numero_cuenta, direccion, localidad, servicio_id, principal, activa]);
      
      const cuenta = resultadoCuenta.rows[0];
      
      // Crear el medidor asociado a la cuenta
      await client.query(`
        INSERT INTO medidor (
          numero_medidor,
          cuenta_id,
          activo
        )
        VALUES ($1, $2, $3)
      `, [numero_medidor, cuenta.cuenta_id, true]);
      
      await client.query('COMMIT');
      
      return cuenta;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Obtener cuenta por ID
   */
  static async obtenerPorId(cuentaId) {
    const resultado = await pool.query(`
      SELECT 
        c.*,
        s.nombre as servicio_nombre,
        s.descripcion as servicio_descripcion,
        so.nombre as socio_nombre,
        so.apellido as socio_apellido
      FROM cuenta c
      INNER JOIN servicio s ON c.servicio_id = s.servicio_id
      INNER JOIN socio so ON c.socio_id = so.socio_id
      WHERE c.cuenta_id = $1
    `, [cuentaId]);
    
    return resultado.rows[0];
  }

  /**
   * Actualizar cuenta
   */
  static async actualizar(cuentaId, datos) {
    const campos = [];
    const valores = [];
    let contador = 1;

    Object.keys(datos).forEach(key => {
      campos.push(`${key} = $${contador}`);
      valores.push(datos[key]);
      contador++;
    });

    valores.push(cuentaId);

    const resultado = await pool.query(`
      UPDATE cuenta 
      SET ${campos.join(', ')}
      WHERE cuenta_id = $${contador}
      RETURNING *
    `, valores);
    
    return resultado.rows[0];
  }

  /**
   * Eliminar cuenta (soft delete)
   */
  static async eliminar(cuentaId) {
    const resultado = await pool.query(`
      UPDATE cuenta 
      SET activa = false
      WHERE cuenta_id = $1
      RETURNING *
    `, [cuentaId]);
    
    return resultado.rows[0];
  }
}

export default Cuenta;
