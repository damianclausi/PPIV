import pool from '../db.js';

/**
 * Modelo para gestionar el uso de materiales en órdenes de trabajo
 * 
 * NOTA: La tabla uso_material actual solo tiene estos campos:
 * - uso_id, ot_id, material_id, cantidad, created_at
 * 
 * Para habilitar observaciones e imágenes, ejecutar:
 * backend/migrations/add_campos_uso_material.sql
 */
class UsoMaterial {
  /**
   * Registrar uso de materiales para una orden de trabajo
   * @param {number} otId - ID de la orden de trabajo
   * @param {number} empleadoId - ID del empleado que registra
   * @param {Array} materiales - Array de objetos {material_id, cantidad}
   * NOTA: observaciones e imagenes se guardarán cuando se agreguen las columnas
   */
  static async registrarMateriales(otId, empleadoId, materiales) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Verificar que la OT existe
      const otCheck = await client.query(
        'SELECT ot_id, reclamo_id, empleado_id FROM orden_trabajo WHERE ot_id = $1',
        [otId]
      );
      
      if (otCheck.rows.length === 0) {
        throw new Error('Orden de trabajo no encontrada');
      }
      
      // Permitir solo si la OT está asignada al empleado o si no tiene empleado asignado
      const otEmpleadoId = otCheck.rows[0].empleado_id;
      if (otEmpleadoId && otEmpleadoId !== empleadoId) {
        throw new Error(`Orden de trabajo asignada a otro empleado (OT empleado: ${otEmpleadoId}, Usuario: ${empleadoId})`);
      }
      
      const reclamoId = otCheck.rows[0].reclamo_id;
      
      // Insertar cada material usado
      const resultados = [];
      for (const mat of materiales) {
        // Verificar stock disponible antes de usar
        const stockCheck = await client.query(
          'SELECT stock_actual FROM material WHERE material_id = $1',
          [mat.material_id]
        );
        
        if (stockCheck.rows.length === 0) {
          throw new Error(`Material ${mat.material_id} no encontrado`);
        }
        
        if (stockCheck.rows[0].stock_actual < mat.cantidad) {
          throw new Error(`Stock insuficiente para material ${mat.material_id}. Disponible: ${stockCheck.rows[0].stock_actual}, Solicitado: ${mat.cantidad}`);
        }
        
        const resultado = await client.query(`
          INSERT INTO uso_material (
            ot_id,
            material_id,
            cantidad
          ) VALUES ($1, $2, $3)
          RETURNING *
        `, [
          otId,
          mat.material_id,
          mat.cantidad
        ]);
        
        resultados.push(resultado.rows[0]);
        
        // Descontar del stock actual
        await client.query(
          'UPDATE material SET stock_actual = stock_actual - $1 WHERE material_id = $2',
          [mat.cantidad, mat.material_id]
        );
      }
      
      await client.query('COMMIT');
      return resultados;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Obtener materiales utilizados en una OT
   * @param {number} otId - ID de la orden de trabajo
   */
  static async obtenerPorOT(otId) {
    const resultado = await pool.query(`
      SELECT 
        um.uso_id as uso_material_id,
        um.ot_id,
        um.material_id,
        um.cantidad,
        um.created_at as fecha_registro,
        m.descripcion as material_nombre,
        m.unidad as unidad_medida,
        m.codigo as material_codigo
      FROM uso_material um
      INNER JOIN material m ON um.material_id = m.material_id
      WHERE um.ot_id = $1
      ORDER BY um.created_at DESC
    `, [otId]);
    
    return resultado.rows;
  }

  /**
   * Obtener materiales utilizados por reclamo
   * @param {number} reclamoId - ID del reclamo
   */
  static async obtenerPorReclamo(reclamoId) {
    const resultado = await pool.query(`
      SELECT 
        um.uso_id as uso_material_id,
        um.ot_id,
        ot.reclamo_id,
        um.material_id,
        um.cantidad,
        um.created_at as fecha_registro,
        m.descripcion as material_nombre,
        m.unidad as unidad_medida,
        m.codigo as material_codigo
      FROM uso_material um
      INNER JOIN material m ON um.material_id = m.material_id
      INNER JOIN orden_trabajo ot ON um.ot_id = ot.ot_id
      WHERE ot.reclamo_id = $1
      ORDER BY um.created_at DESC
    `, [reclamoId]);
    
    return resultado.rows;
  }

  /**
   * Listar todos los materiales disponibles
   */
  static async listarMateriales() {
    const resultado = await pool.query(`
      SELECT 
        material_id,
        codigo,
        descripcion as nombre,
        descripcion,
        unidad as unidad_medida,
        stock_actual,
        stock_minimo,
        costo_unitario as precio_unitario,
        activo
      FROM material
      WHERE activo = true OR activo IS NULL
      ORDER BY descripcion ASC
    `);
    
    return resultado.rows;
  }

  /**
   * Eliminar un registro de uso de material
   * @param {number} usoMaterialId - ID del uso de material
   * @param {number} empleadoId - ID del empleado que elimina
   */
  static async eliminar(usoMaterialId, empleadoId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Obtener info del uso de material
      const usoMaterial = await client.query(
        'SELECT * FROM uso_material WHERE uso_id = $1',
        [usoMaterialId]
      );
      
      if (usoMaterial.rows.length === 0) {
        throw new Error('Uso de material no encontrado');
      }
      
      // Eliminar el registro
      await client.query(
        'DELETE FROM uso_material WHERE uso_id = $1',
        [usoMaterialId]
      );
      
      // TODO: Revertir el movimiento de stock si existe la tabla mov_stock
      
      await client.query('COMMIT');
      return { success: true, message: 'Material eliminado correctamente' };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export default UsoMaterial;
