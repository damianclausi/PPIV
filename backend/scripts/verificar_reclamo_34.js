import pool from '../db.js';

async function verificar() {
  try {
    const resultado = await pool.query(`
      SELECT 
        r.reclamo_id,
        r.estado,
        r.descripcion,
        t.nombre as tipo_reclamo,
        ot.ot_id,
        ot.empleado_id,
        ot.estado as estado_ot
      FROM reclamo r
      INNER JOIN detalle_tipo_reclamo d ON r.detalle_id = d.detalle_id
      INNER JOIN tipo_reclamo t ON d.tipo_id = t.tipo_id
      LEFT JOIN orden_trabajo ot ON r.reclamo_id = ot.reclamo_id
      WHERE r.reclamo_id = 34
    `);
    
    console.log('=== Reclamo #34 ===');
    console.log(JSON.stringify(resultado.rows[0], null, 2));
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

verificar();
