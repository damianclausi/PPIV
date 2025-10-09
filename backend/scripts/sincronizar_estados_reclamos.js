import pool from '../db.js';

/**
 * Script para sincronizar estados de reclamos con sus OTs
 * Corrige reclamos que tienen OT EN_PROCESO pero el reclamo sigue PENDIENTE
 */
async function sincronizarEstados() {
  try {
    console.log('🔍 Buscando reclamos desincronizados...\n');
    
    // Buscar reclamos desincronizados
    const resultado = await pool.query(`
      SELECT 
        r.reclamo_id,
        r.estado as estado_reclamo,
        ot.ot_id,
        ot.estado as estado_ot,
        t.nombre as tipo_reclamo
      FROM reclamo r
      INNER JOIN orden_trabajo ot ON r.reclamo_id = ot.reclamo_id
      INNER JOIN detalle_tipo_reclamo d ON r.detalle_id = d.detalle_id
      INNER JOIN tipo_reclamo t ON d.tipo_id = t.tipo_id
      WHERE r.estado != ot.estado
        AND ot.empleado_id IS NULL
      ORDER BY r.reclamo_id
    `);
    
    if (resultado.rows.length === 0) {
      console.log('✅ No hay reclamos desincronizados');
      await pool.end();
      return;
    }
    
    console.log(`⚠️  Encontrados ${resultado.rows.length} reclamo(s) desincronizado(s):\n`);
    
    for (const row of resultado.rows) {
      console.log(`Reclamo #${row.reclamo_id} (${row.tipo_reclamo}):`);
      console.log(`  Estado Reclamo: ${row.estado_reclamo}`);
      console.log(`  Estado OT #${row.ot_id}: ${row.estado_ot}`);
      console.log(`  ➡️  Sincronizando...`);
      
      // Actualizar estado del reclamo para que coincida con la OT
      const updateResult = await pool.query(`
        UPDATE reclamo 
        SET estado = $1,
            updated_at = NOW()
        WHERE reclamo_id = $2
        RETURNING *
      `, [row.estado_ot, row.reclamo_id]);
      
      if (updateResult.rows.length > 0) {
        console.log(`  ✅ Reclamo #${row.reclamo_id} actualizado a: ${row.estado_ot}\n`);
      }
    }
    
    console.log('✅ Sincronización completada');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

sincronizarEstados();
