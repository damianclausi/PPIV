import pool from '../db.js';

/**
 * Verificar qué reclamos tienen OT y cuáles no
 */
async function verificarOTs() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 VERIFICANDO ÓRDENES DE TRABAJO\n');
    console.log('='  .repeat(70));
    
    // Reclamos administrativos SIN orden de trabajo
    console.log('\n❌ RECLAMOS ADMINISTRATIVOS SIN ORDEN DE TRABAJO:\n');
    
    const sinOT = await client.query(`
      SELECT 
        r.reclamo_id,
        s.nombre || ' ' || s.apellido as socio,
        d.nombre as detalle,
        r.estado,
        r.descripcion
      FROM reclamo r
      INNER JOIN cuenta c ON r.cuenta_id = c.cuenta_id
      INNER JOIN socio s ON c.socio_id = s.socio_id
      INNER JOIN detalle_tipo_reclamo d ON r.detalle_id = d.detalle_id
      INNER JOIN tipo_reclamo t ON d.tipo_id = t.tipo_id
      LEFT JOIN orden_trabajo ot ON r.reclamo_id = ot.reclamo_id
      WHERE t.nombre = 'ADMINISTRATIVO'
        AND ot.ot_id IS NULL
      ORDER BY r.fecha_alta DESC
    `);
    
    console.log(`Total: ${sinOT.rows.length} reclamos sin OT`);
    console.table(sinOT.rows);
    
    // Reclamos administrativos CON orden de trabajo
    console.log('\n' + '='.repeat(70));
    console.log('\n✅ RECLAMOS ADMINISTRATIVOS CON ORDEN DE TRABAJO:\n');
    
    const conOT = await client.query(`
      SELECT 
        r.reclamo_id,
        ot.ot_id,
        s.nombre || ' ' || s.apellido as socio,
        d.nombre as detalle,
        r.estado as estado_reclamo,
        ot.estado as estado_ot,
        ot.empleado_id
      FROM reclamo r
      INNER JOIN cuenta c ON r.cuenta_id = c.cuenta_id
      INNER JOIN socio s ON c.socio_id = s.socio_id
      INNER JOIN detalle_tipo_reclamo d ON r.detalle_id = d.detalle_id
      INNER JOIN tipo_reclamo t ON d.tipo_id = t.tipo_id
      INNER JOIN orden_trabajo ot ON r.reclamo_id = ot.reclamo_id
      WHERE t.nombre = 'ADMINISTRATIVO'
        AND ot.empleado_id IS NULL
      ORDER BY ot.ot_id DESC
    `);
    
    console.log(`Total: ${conOT.rows.length} reclamos con OT`);
    console.table(conOT.rows);
    
    console.log('\n' + '='.repeat(70));
    console.log('\n💡 CONCLUSIÓN:');
    console.log(`   - ${sinOT.rows.length} reclamos administrativos NO tienen OT creada`);
    console.log(`   - ${conOT.rows.length} reclamos administrativos SÍ tienen OT creada`);
    console.log('\n📝 ACCIÓN REQUERIDA:');
    console.log('   Los reclamos administrativos DEBEN tener una OT creada automáticamente');
    console.log('   cuando el cliente los genera, o el admin debe poder crearlas manualmente.');
    console.log('\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

verificarOTs();
