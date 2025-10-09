import pool from '../db.js';

/**
 * Script de normalización de estados
 * 
 * OBJETIVO: Normalizar estados para que:
 * - CLIENTE ve: PENDIENTE, EN_PROCESO, RESUELTO
 * - OTs manejan: PENDIENTE, ASIGNADA, EN_PROCESO, COMPLETADA (técnicas) / CERRADO (admin)
 */

async function normalizarEstados() {
  const client = await pool.connect();
  
  try {
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║       NORMALIZACIÓN DE ESTADOS - INICIO                  ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    
    await client.query('BEGIN');
    
    // ========================================
    // PASO 1: Normalizar tabla RECLAMO
    // ========================================
    console.log('📋 PASO 1: Normalizando estados en tabla RECLAMO\n');
    
    // 1.1: EN CURSO → EN_PROCESO
    console.log('   1.1. Cambiando "EN CURSO" → "EN_PROCESO"...');
    const result1 = await client.query(`
      UPDATE reclamo 
      SET estado = 'EN_PROCESO',
          updated_at = NOW()
      WHERE estado = 'EN CURSO'
      RETURNING reclamo_id, descripcion;
    `);
    console.log(`       ✅ ${result1.rowCount} reclamo(s) actualizado(s)`);
    if (result1.rows.length > 0 && result1.rows.length <= 5) {
      result1.rows.forEach(r => console.log(`          - Reclamo #${r.reclamo_id}: ${r.descripcion.substring(0, 40)}...`));
    }
    
    // 1.2: CERRADO → RESUELTO
    console.log('\n   1.2. Cambiando "CERRADO" → "RESUELTO"...');
    const result2 = await client.query(`
      UPDATE reclamo 
      SET estado = 'RESUELTO',
          updated_at = NOW()
      WHERE estado = 'CERRADO'
      RETURNING reclamo_id, descripcion;
    `);
    console.log(`       ✅ ${result2.rowCount} reclamo(s) actualizado(s)`);
    if (result2.rows.length > 0 && result2.rows.length <= 5) {
      result2.rows.forEach(r => console.log(`          - Reclamo #${r.reclamo_id}: ${r.descripcion.substring(0, 40)}...`));
    }
    
    // ========================================
    // PASO 2: Normalizar tabla ORDEN_TRABAJO
    // ========================================
    console.log('\n📋 PASO 2: Normalizando estados en tabla ORDEN_TRABAJO\n');
    
    // 2.1: EN CURSO → EN_PROCESO
    console.log('   2.1. Cambiando "EN CURSO" → "EN_PROCESO"...');
    const result3 = await client.query(`
      UPDATE orden_trabajo 
      SET estado = 'EN_PROCESO',
          updated_at = NOW()
      WHERE estado = 'EN CURSO'
      RETURNING ot_id, reclamo_id, empleado_id;
    `);
    console.log(`       ✅ ${result3.rowCount} OT(s) actualizada(s)`);
    if (result3.rows.length > 0 && result3.rows.length <= 5) {
      result3.rows.forEach(r => {
        const tipo = r.empleado_id ? 'TÉCNICA' : 'ADMINISTRATIVA';
        console.log(`          - OT #${r.ot_id} (${tipo}) - Reclamo #${r.reclamo_id}`);
      });
    }
    
    // ========================================
    // PASO 3: Verificar consistencia
    // ========================================
    console.log('\n📋 PASO 3: Verificando consistencia OT ↔ Reclamo\n');
    
    const verificacion = await client.query(`
      SELECT 
        COUNT(*) as total_desincronizados
      FROM reclamo r
      INNER JOIN orden_trabajo ot ON r.reclamo_id = ot.reclamo_id
      WHERE r.estado != CASE ot.estado
        WHEN 'PENDIENTE' THEN 'PENDIENTE'
        WHEN 'ASIGNADA' THEN 'EN_PROCESO'
        WHEN 'EN_PROCESO' THEN 'EN_PROCESO'
        WHEN 'COMPLETADA' THEN 'RESUELTO'
        WHEN 'CERRADO' THEN 'RESUELTO'
        ELSE r.estado
      END;
    `);
    
    const desincronizados = parseInt(verificacion.rows[0].total_desincronizados);
    
    if (desincronizados > 0) {
      console.log(`   ⚠️  Encontrados ${desincronizados} reclamo(s) desincronizado(s)`);
      console.log('   🔧 Sincronizando automáticamente...\n');
      
      const sync = await client.query(`
        UPDATE reclamo r
        SET estado = CASE ot.estado
          WHEN 'PENDIENTE' THEN 'PENDIENTE'
          WHEN 'ASIGNADA' THEN 'EN_PROCESO'
          WHEN 'EN_PROCESO' THEN 'EN_PROCESO'
          WHEN 'COMPLETADA' THEN 'RESUELTO'
          WHEN 'CERRADO' THEN 'RESUELTO'
          ELSE r.estado
        END,
        updated_at = NOW()
        FROM orden_trabajo ot
        WHERE r.reclamo_id = ot.reclamo_id
          AND r.estado != CASE ot.estado
            WHEN 'PENDIENTE' THEN 'PENDIENTE'
            WHEN 'ASIGNADA' THEN 'EN_PROCESO'
            WHEN 'EN_PROCESO' THEN 'EN_PROCESO'
            WHEN 'COMPLETADA' THEN 'RESUELTO'
            WHEN 'CERRADO' THEN 'RESUELTO'
            ELSE r.estado
          END
        RETURNING r.reclamo_id;
      `);
      
      console.log(`       ✅ ${sync.rowCount} reclamo(s) sincronizado(s)`);
    } else {
      console.log('   ✅ Todos los reclamos están sincronizados con sus OTs');
    }
    
    // ========================================
    // PASO 4: Resumen final
    // ========================================
    console.log('\n📋 PASO 4: Resumen de estados después de normalización\n');
    
    // Estados en RECLAMO
    const estadosReclamo = await client.query(`
      SELECT estado, COUNT(*) as cantidad
      FROM reclamo
      GROUP BY estado
      ORDER BY estado;
    `);
    
    console.log('   Estados en tabla RECLAMO (Vista del cliente):');
    estadosReclamo.rows.forEach(row => {
      console.log(`      - ${row.estado}: ${row.cantidad} reclamo(s)`);
    });
    
    // Estados en ORDEN_TRABAJO
    const estadosOT = await client.query(`
      SELECT 
        estado, 
        COUNT(*) as total,
        SUM(CASE WHEN empleado_id IS NULL THEN 1 ELSE 0 END) as administrativas,
        SUM(CASE WHEN empleado_id IS NOT NULL THEN 1 ELSE 0 END) as tecnicas
      FROM orden_trabajo
      GROUP BY estado
      ORDER BY estado;
    `);
    
    console.log('\n   Estados en tabla ORDEN_TRABAJO (Vista interna):');
    estadosOT.rows.forEach(row => {
      console.log(`      - ${row.estado}: ${row.total} OT(s) (${row.administrativas} admin, ${row.tecnicas} técnicas)`);
    });
    
    // ========================================
    // COMMIT
    // ========================================
    await client.query('COMMIT');
    
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║       ✅ NORMALIZACIÓN COMPLETADA EXITOSAMENTE           ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    
    console.log('📊 RESUMEN DE CAMBIOS:');
    console.log(`   - Reclamos "EN CURSO" → "EN_PROCESO": ${result1.rowCount}`);
    console.log(`   - Reclamos "CERRADO" → "RESUELTO": ${result2.rowCount}`);
    console.log(`   - OTs "EN CURSO" → "EN_PROCESO": ${result3.rowCount}`);
    console.log(`   - Total de registros actualizados: ${result1.rowCount + result2.rowCount + result3.rowCount}\n`);
    
    console.log('✅ Estados normalizados:');
    console.log('   Cliente ve: PENDIENTE, EN_PROCESO, RESUELTO');
    console.log('   OTs usan: PENDIENTE, ASIGNADA, EN_PROCESO, COMPLETADA, CERRADO\n');
    
    await client.release();
    await pool.end();
    process.exit(0);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ ERROR durante la normalización:');
    console.error(error);
    
    await client.release();
    await pool.end();
    process.exit(1);
  }
}

normalizarEstados();
