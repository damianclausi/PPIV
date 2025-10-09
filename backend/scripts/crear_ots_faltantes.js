import pool from '../db.js';

/**
 * Script para crear OTs para reclamos administrativos que no las tienen
 * 
 * Los reclamos administrativos DEBEN tener OT (sin empleado asignado)
 * para poder ser gestionados por el administrador
 */
async function crearOTsFaltantes() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🔧 CREANDO OTs PARA RECLAMOS ADMINISTRATIVOS\n');
    console.log('='  .repeat(70));
    
    // 1. Encontrar reclamos administrativos sin OT
    console.log('\n📊 Buscando reclamos sin OT...\n');
    
    const reclamosSinOT = await client.query(`
      SELECT 
        r.reclamo_id,
        r.descripcion,
        s.nombre || ' ' || s.apellido as socio,
        c.direccion,
        d.nombre as detalle
      FROM reclamo r
      INNER JOIN cuenta c ON r.cuenta_id = c.cuenta_id
      INNER JOIN socio s ON c.socio_id = s.socio_id
      INNER JOIN detalle_tipo_reclamo d ON r.detalle_id = d.detalle_id
      INNER JOIN tipo_reclamo t ON d.tipo_id = t.tipo_id
      LEFT JOIN orden_trabajo ot ON r.reclamo_id = ot.reclamo_id
      WHERE t.nombre = 'ADMINISTRATIVO'
        AND ot.ot_id IS NULL
        AND r.estado != 'RESUELTO'
      ORDER BY r.fecha_alta ASC
    `);
    
    if (reclamosSinOT.rows.length === 0) {
      console.log('✅ No hay reclamos administrativos sin OT');
      await client.query('COMMIT');
      return;
    }
    
    console.log(`📋 Encontrados ${reclamosSinOT.rows.length} reclamos sin OT:\n`);
    console.table(reclamosSinOT.rows);
    
    // 2. Crear OT para cada reclamo
    console.log('\n🔄 Creando órdenes de trabajo...\n');
    
    const otsCreadas = [];
    
    for (const reclamo of reclamosSinOT.rows) {
      try {
        const resultado = await client.query(`
          INSERT INTO orden_trabajo (
            reclamo_id,
            empleado_id,
            direccion_intervencion,
            observaciones,
            estado,
            created_at,
            updated_at
          )
          VALUES ($1, NULL, $2, $3, 'PENDIENTE', NOW(), NOW())
          RETURNING ot_id, reclamo_id, estado
        `, [
          reclamo.reclamo_id,
          reclamo.direccion,
          `OT creada automáticamente para reclamo administrativo: ${reclamo.detalle}`
        ]);
        
        otsCreadas.push({
          ot_id: resultado.rows[0].ot_id,
          reclamo_id: reclamo.reclamo_id,
          socio: reclamo.socio,
          detalle: reclamo.detalle
        });
        
        console.log(`  ✅ OT #${resultado.rows[0].ot_id} creada para Reclamo #${reclamo.reclamo_id} (${reclamo.socio})`);
        
      } catch (error) {
        console.error(`  ❌ Error al crear OT para Reclamo #${reclamo.reclamo_id}:`, error.message);
        throw error;
      }
    }
    
    await client.query('COMMIT');
    
    // 3. Mostrar resumen
    console.log('\n' + '='.repeat(70));
    console.log('\n✅ PROCESO COMPLETADO EXITOSAMENTE\n');
    console.log(`📊 Total de OTs creadas: ${otsCreadas.length}`);
    
    if (otsCreadas.length > 0) {
      console.log('\n📋 Resumen de OTs creadas:\n');
      console.table(otsCreadas);
      
      console.log('\n💡 Las OTs ahora aparecerán en:');
      console.log('   → /dashboard/admin/ots-administrativas');
      console.log('   → Estado: PENDIENTE');
      console.log('   → Sin empleado asignado (empleado_id = NULL)\n');
    }
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ ERROR en el proceso:', error.message);
    console.error(error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar
crearOTsFaltantes().catch(error => {
  console.error('Error fatal:', error);
  process.exit(1);
});
