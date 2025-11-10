import pool from '../db.js';

/**
 * Modelo para gestionar materiales e inventario
 */
class Material {
  /**
   * Obtener materiales con stock bajo (stock_actual <= stock_minimo)
   */
  static async obtenerStockBajo() {
    const resultado = await pool.query(`
      SELECT 
        material_id,
        codigo,
        descripcion,
        unidad,
        stock_actual,
        stock_minimo,
        costo_unitario,
        activo,
        CASE 
          WHEN stock_actual = 0 THEN 'CRITICO'
          WHEN stock_actual <= stock_minimo * 0.5 THEN 'MUY_BAJO'
          WHEN stock_actual <= stock_minimo THEN 'BAJO'
          ELSE 'NORMAL'
        END as nivel_alerta
      FROM material
      WHERE (activo = true OR activo IS NULL)
        AND stock_actual <= stock_minimo
      ORDER BY 
        CASE 
          WHEN stock_actual = 0 THEN 1
          WHEN stock_actual <= stock_minimo * 0.5 THEN 2
          WHEN stock_actual <= stock_minimo THEN 3
        END,
        stock_actual ASC
    `);
    
    return resultado.rows;
  }

  /**
   * Obtener todos los materiales activos
   */
  static async listarTodos() {
    const resultado = await pool.query(`
      SELECT 
        material_id,
        codigo,
        descripcion,
        unidad,
        stock_actual,
        stock_minimo,
        costo_unitario,
        activo
      FROM material
      WHERE activo = true OR activo IS NULL
      ORDER BY descripcion ASC
    `);
    
    return resultado.rows;
  }

  /**
   * Obtener resumen de stock
   */
  static async obtenerResumenStock() {
    const resultado = await pool.query(`
      SELECT 
        COUNT(*) as total_materiales,
        COUNT(*) FILTER (WHERE stock_actual <= stock_minimo) as con_stock_bajo,
        COUNT(*) FILTER (WHERE stock_actual = 0) as sin_stock,
        COUNT(*) FILTER (WHERE stock_actual > stock_minimo) as stock_normal,
        SUM(stock_actual * costo_unitario) as valor_inventario_total
      FROM material
      WHERE activo = true OR activo IS NULL
    `);
    
    return resultado.rows[0];
  }

  /**
   * Obtener material por ID
   */
  static async obtenerPorId(materialId) {
    const resultado = await pool.query(`
      SELECT 
        material_id,
        codigo,
        descripcion,
        unidad,
        stock_actual,
        stock_minimo,
        costo_unitario,
        activo
      FROM material
      WHERE material_id = $1
    `, [materialId]);
    
    return resultado.rows[0];
  }

  /**
   * Actualizar stock de un material
   */
  static async actualizarStock(materialId, nuevoStock) {
    const resultado = await pool.query(`
      UPDATE material
      SET stock_actual = $2
      WHERE material_id = $1
      RETURNING *
    `, [materialId, nuevoStock]);
    
    return resultado.rows[0];
  }
}

export default Material;
