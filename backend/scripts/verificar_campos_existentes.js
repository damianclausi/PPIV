import pool from '../db.js';

async function verificarCamposExistentes() {
  try {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('   VERIFICACIÓN DE CAMPOS EXISTENTES - NO CREAR NUEVOS');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // 1. Campos actuales en orden_trabajo
    console.log('1. CAMPOS EXISTENTES EN ORDEN_TRABAJO:\n');
    const otCampos = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'orden_trabajo'
      ORDER BY ordinal_position;
    `);
    console.table(otCampos.rows);
    
    // 2. Campos actuales en reclamo
    console.log('\n2. CAMPOS EXISTENTES EN RECLAMO:\n');
    const reclamoCampos = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'reclamo'
      ORDER BY ordinal_position;
    `);
    console.table(reclamoCampos.rows);
    
    // 3. Campos actuales en empleado_cuadrilla
    console.log('\n3. CAMPOS EXISTENTES EN EMPLEADO_CUADRILLA:\n');
    const empCuadCampos = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'empleado_cuadrilla'
      ORDER BY ordinal_position;
    `);
    console.table(empCuadCampos.rows);
    
    // 4. Verificar si orden_trabajo ya tiene cuadrilla_id
    console.log('\n4. ¿ORDEN_TRABAJO TIENE CUADRILLA_ID?\n');
    const tieneCuadrillaId = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'orden_trabajo'
        AND column_name = 'cuadrilla_id';
    `);
    console.log(tieneCuadrillaId.rowCount > 0 
      ? '✅ SÍ tiene cuadrilla_id' 
      : '❌ NO tiene cuadrilla_id (usar solo empleado_id)'
    );
    
    // 5. Estados actuales en OTs
    console.log('\n5. ESTADOS ACTUALES EN OTs:\n');
    const estados = await pool.query(`
      SELECT DISTINCT estado, COUNT(*) as cantidad
      FROM orden_trabajo
      GROUP BY estado
      ORDER BY estado;
    `);
    console.table(estados.rows);
    
    // 6. Estados actuales en Reclamos
    console.log('\n6. ESTADOS ACTUALES EN RECLAMOS:\n');
    const estadosReclamo = await pool.query(`
      SELECT DISTINCT estado, COUNT(*) as cantidad
      FROM reclamo
      GROUP BY estado
      ORDER BY estado;
    `);
    console.table(estadosReclamo.rows);
    
    // 7. OTs con empleado_id NULL (administrativas)
    console.log('\n7. DISTRIBUCIÓN OTs ADMINISTRATIVAS vs TÉCNICAS:\n');
    const distribucion = await pool.query(`
      SELECT 
        CASE 
          WHEN empleado_id IS NULL THEN 'ADMINISTRATIVA'
          ELSE 'TECNICA'
        END as tipo_ot,
        estado,
        COUNT(*) as cantidad
      FROM orden_trabajo
      GROUP BY tipo_ot, estado
      ORDER BY tipo_ot, estado;
    `);
    console.table(distribucion.rows);
    
    // 8. Verificar tipo_reclamo
    console.log('\n8. TIPOS DE RECLAMO EN BASE DE DATOS:\n');
    const tiposReclamo = await pool.query(`
      SELECT t.tipo_id, t.nombre
      FROM tipo_reclamo t
      ORDER BY t.tipo_id;
    `);
    console.table(tiposReclamo.rows);
    
    // 9. Reclamos por tipo
    console.log('\n9. DISTRIBUCIÓN DE RECLAMOS POR TIPO:\n');
    const reclamosPorTipo = await pool.query(`
      SELECT 
        t.nombre as tipo_reclamo,
        r.estado,
        COUNT(*) as cantidad
      FROM reclamo r
      INNER JOIN detalle_tipo_reclamo d ON r.detalle_id = d.detalle_id
      INNER JOIN tipo_reclamo t ON d.tipo_id = t.tipo_id
      GROUP BY t.nombre, r.estado
      ORDER BY t.nombre, r.estado;
    `);
    console.table(reclamosPorTipo.rows);
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('   CONCLUSIÓN: ¿QUÉ CAMPOS PODEMOS USAR?');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('✅ CAMPOS DISPONIBLES EN ORDEN_TRABAJO:');
    otCampos.rows.forEach(campo => {
      console.log(`   - ${campo.column_name} (${campo.data_type})`);
    });
    
    console.log('\n✅ CAMPOS DISPONIBLES EN EMPLEADO_CUADRILLA:');
    empCuadCampos.rows.forEach(campo => {
      console.log(`   - ${campo.column_name} (${campo.data_type})`);
    });
    
    console.log('\n📋 ESTRATEGIA SIN CREAR CAMPOS NUEVOS:');
    console.log('   1. Usar empleado_id en orden_trabajo (YA EXISTE)');
    console.log('   2. Obtener cuadrilla desde empleado_cuadrilla (YA EXISTE)');
    console.log('   3. NO crear cuadrilla_id en orden_trabajo');
    console.log('   4. Estados: PENDIENTE, ASIGNADA, EN_PROCESO, COMPLETADA, CERRADO (usar VARCHAR existente)');
    console.log('   5. observaciones: usar campo TEXT existente');
    console.log('   6. Fechas: usar campos fecha_* existentes\n');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

verificarCamposExistentes();
