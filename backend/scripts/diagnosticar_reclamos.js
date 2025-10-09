import pool from '../db.js';

/**
 * Script para diagnosticar por qué el admin no ve los reclamos
 */
async function diagnosticar() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 DIAGNÓSTICO DE RECLAMOS\n');
    console.log('='  .repeat(60));
    
    // 1. Total de reclamos en la base
    console.log('\n📊 1. TOTAL DE RECLAMOS EN LA BASE:');
    const totalReclamos = await client.query('SELECT COUNT(*) as total FROM reclamo');
    console.log(`   Total: ${totalReclamos.rows[0].total} reclamos`);
    
    // 2. Reclamos por estado
    console.log('\n📊 2. RECLAMOS POR ESTADO:');
    const porEstado = await client.query(`
      SELECT estado, COUNT(*) as cantidad 
      FROM reclamo 
      GROUP BY estado 
      ORDER BY cantidad DESC
    `);
    console.table(porEstado.rows);
    
    // 3. Verificar estructura de tablas relacionadas
    console.log('\n📊 3. TIPOS DE RECLAMO DISPONIBLES:');
    const tiposReclamo = await client.query('SELECT * FROM tipo_reclamo ORDER BY tipo_id');
    console.table(tiposReclamo.rows);
    
    console.log('\n📊 4. DETALLES DE TIPO DISPONIBLES:');
    const detallesTipo = await client.query(`
      SELECT dtr.*, tr.nombre as tipo_reclamo_nombre
      FROM detalle_tipo_reclamo dtr
      INNER JOIN tipo_reclamo tr ON dtr.tipo_id = tr.tipo_id
      ORDER BY tr.nombre, dtr.nombre
    `);
    console.table(detallesTipo.rows);
    
    // 5. Verificar nombres de columnas en las tablas
    console.log('\n📊 5. ESTRUCTURA DE TABLA detalle_tipo_reclamo:');
    const estructuraDetalle = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'detalle_tipo_reclamo'
      ORDER BY ordinal_position
    `);
    console.table(estructuraDetalle.rows);
    
    console.log('\n📊 6. ESTRUCTURA DE TABLA tipo_reclamo:');
    const estructuraTipo = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'tipo_reclamo'
      ORDER BY ordinal_position
    `);
    console.table(estructuraTipo.rows);
    
    // 6. Intentar la consulta completa que usa el admin
    console.log('\n📊 7. CONSULTA COMPLETA (como la usa el admin):');
    try {
      const consultaAdmin = await client.query(`
        SELECT 
          r.reclamo_id,
          r.descripcion,
          r.estado,
          r.fecha_alta,
          r.fecha_cierre,
          d.nombre as detalle_reclamo,
          t.nombre as tipo_reclamo,
          p.nombre as prioridad,
          c.numero_cuenta,
          c.direccion,
          s.nombre as socio_nombre,
          s.apellido as socio_apellido
        FROM reclamo r
        INNER JOIN detalle_tipo_reclamo d ON r.detalle_id = d.detalle_id
        INNER JOIN tipo_reclamo t ON d.tipo_id = t.tipo_id
        INNER JOIN prioridad p ON r.prioridad_id = p.prioridad_id
        INNER JOIN cuenta c ON r.cuenta_id = c.cuenta_id
        INNER JOIN socio s ON c.socio_id = s.socio_id
        ORDER BY r.fecha_alta DESC
        LIMIT 5
      `);
      
      console.log(`   ✅ Consulta exitosa: ${consultaAdmin.rows.length} reclamos encontrados`);
      if (consultaAdmin.rows.length > 0) {
        console.log('\n   Primeros reclamos:');
        console.table(consultaAdmin.rows.map(r => ({
          ID: r.reclamo_id,
          Socio: `${r.socio_nombre} ${r.socio_apellido}`,
          Tipo: r.tipo_reclamo,
          Detalle: r.detalle_reclamo,
          Estado: r.estado,
          Fecha: r.fecha_alta
        })));
      }
    } catch (error) {
      console.log(`   ❌ ERROR en consulta: ${error.message}`);
      console.log('\n   Probando con nombres de columna alternativos...\n');
      
      // Probar con detalle_id en vez de detalle_tipo_id
      try {
        const consultaAlt = await client.query(`
          SELECT 
            r.reclamo_id,
            r.descripcion,
            r.estado,
            r.fecha_alta
          FROM reclamo r
          LIMIT 3
        `);
        console.log('   ✅ Reclamos básicos sin JOINs:');
        console.table(consultaAlt.rows);
        
        // Ver qué columnas tiene realmente la tabla reclamo
        console.log('\n   Columnas reales de tabla reclamo:');
        const columnasReclamo = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'reclamo'
          ORDER BY ordinal_position
        `);
        console.table(columnasReclamo.rows);
        
      } catch (err2) {
        console.log(`   ❌ Error adicional: ${err2.message}`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Diagnóstico completado\n');
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

diagnosticar();
