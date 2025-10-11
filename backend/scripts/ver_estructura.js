import pool from '../db.js';

async function verificarEstructura() {
  try {
    // Ver estructura de tabla empleado
    const empleado = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'empleado' 
      ORDER BY ordinal_position;
    `);
    
    console.log('Tabla EMPLEADO:');
    console.table(empleado.rows);
    
    // Ver si existe tabla cuadrilla
    const cuadrilla = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'cuadrilla' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\nTabla CUADRILLA:');
    if (cuadrilla.rowCount > 0) {
      console.table(cuadrilla.rows);
    } else {
      console.log('❌ No existe');
    }
    
    // Ver tabla orden_trabajo
    const ot = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'orden_trabajo' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\nTabla ORDEN_TRABAJO:');
    console.table(ot.rows);
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
  }
}

verificarEstructura();
