import pool from '../db.js';

/**
 * Script para corregir OTs administrativas existentes
 * Quita el empleado_id de las OTs de reclamos administrativos
 * 
 * Las OTs TÉCNICAS mantienen su empleado_id
 * Las OTs ADMINISTRATIVAS tendrán empleado_id = NULL
 */
async function corregirOTsAdministrativas() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Iniciando corrección de OTs administrativas...\n');
    
    // 1. Mostrar estado actual
    console.log('📊 Estado actual:');
    const estadoActual = await client.query(`
      SELECT 
        t.nombre as tipo,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE ot.empleado_id IS NOT NULL) as con_empleado,
        COUNT(*) FILTER (WHERE ot.empleado_id IS NULL) as sin_empleado
      FROM orden_trabajo ot
      INNER JOIN reclamo r ON ot.reclamo_id = r.reclamo_id
      INNER JOIN detalle_tipo_reclamo d ON r.detalle_id = d.detalle_id
      INNER JOIN tipo_reclamo t ON d.tipo_id = t.tipo_id
      GROUP BY t.nombre
      ORDER BY t.nombre
    `);
    
    console.table(estadoActual.rows);
    
    // 2. Actualizar OTs de reclamos administrativos para que NO tengan empleado
    console.log('\n🔄 Actualizando OTs administrativas...');
    const query = `
      UPDATE orden_trabajo ot
      SET empleado_id = NULL,
          updated_at = NOW()
      FROM reclamo r
      INNER JOIN detalle_tipo_reclamo d ON r.detalle_id = d.detalle_id
      INNER JOIN tipo_reclamo t ON d.tipo_id = t.tipo_id
      WHERE ot.reclamo_id = r.reclamo_id
        AND t.nombre = 'ADMINISTRATIVO'
        AND ot.empleado_id IS NOT NULL
      RETURNING ot.ot_id, r.reclamo_id, r.descripcion, d.nombre as detalle
    `;
    
    const resultado = await client.query(query);
    
    if (resultado.rows.length > 0) {
      console.log(`\n✅ Se corrigieron ${resultado.rows.length} OTs administrativas:\n`);
      resultado.rows.forEach(row => {
        console.log(`  🔹 OT #${row.ot_id} | Reclamo #${row.reclamo_id}`);
        console.log(`     ${row.detalle}: ${row.descripcion.substring(0, 60)}...`);
      });
    } else {
      console.log('ℹ️  No había OTs administrativas con empleado asignado (ya estaban correctas)');
    }
    
    // 3. Mostrar estado final
    console.log('\n📊 Estado final:');
    const estadoFinal = await client.query(`
      SELECT 
        t.nombre as tipo,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE ot.empleado_id IS NOT NULL) as con_empleado,
        COUNT(*) FILTER (WHERE ot.empleado_id IS NULL) as sin_empleado
      FROM orden_trabajo ot
      INNER JOIN reclamo r ON ot.reclamo_id = r.reclamo_id
      INNER JOIN detalle_tipo_reclamo d ON r.detalle_id = d.detalle_id
      INNER JOIN tipo_reclamo t ON d.tipo_id = t.tipo_id
      GROUP BY t.nombre
      ORDER BY t.nombre
    `);
    
    console.table(estadoFinal.rows);
    
    console.log('\n✅ Corrección completada exitosamente');
    console.log('\n📌 Resumen:');
    console.log('   • OTs TÉCNICAS: mantienen empleado_id para asignación a operarios');
    console.log('   • OTs ADMINISTRATIVAS: empleado_id = NULL, gestionadas por administrador');
    
  } catch (error) {
    console.error('\n❌ Error al corregir OTs:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  corregirOTsAdministrativas()
    .then(() => {
      console.log('\n✨ Script finalizado correctamente');
      process.exit(0);
    })
    .catch(() => {
      console.log('\n💥 Script finalizado con errores');
      process.exit(1);
    });
}

export default corregirOTsAdministrativas;
