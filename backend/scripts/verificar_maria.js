import pool from '../db.js';

/**
 * Script para verificar reclamos de María Elena González
 */
async function verificarReclamosMaria() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 BUSCANDO RECLAMOS DE MARÍA ELENA GONZÁLEZ\n');
    console.log('='  .repeat(60));
    
    // Buscar reclamos por email
    const result = await client.query(`
      SELECT 
        r.reclamo_id,
        r.descripcion,
        r.estado,
        r.fecha_alta,
        s.nombre,
        s.apellido,
        s.email,
        d.nombre as detalle,
        t.nombre as tipo,
        c.numero_cuenta
      FROM reclamo r
      INNER JOIN cuenta c ON r.cuenta_id = c.cuenta_id
      INNER JOIN socio s ON c.socio_id = s.socio_id
      INNER JOIN detalle_tipo_reclamo d ON r.detalle_id = d.detalle_id
      INNER JOIN tipo_reclamo t ON d.tipo_id = t.tipo_id
      WHERE s.email ILIKE '%mariaelena.gonzalez%'
         OR s.email ILIKE '%maria.gonzalez%'
         OR s.nombre ILIKE '%maria%elena%'
      ORDER BY r.fecha_alta DESC
    `);
    
    console.log(`\n✅ Total de reclamos encontrados: ${result.rows.length}\n`);
    
    if (result.rows.length > 0) {
      console.table(result.rows.map(r => ({
        ID: r.reclamo_id,
        Socio: `${r.nombre} ${r.apellido}`,
        Email: r.email,
        Cuenta: r.numero_cuenta,
        Tipo: r.tipo,
        Detalle: r.detalle,
        Estado: r.estado,
        Fecha: new Date(r.fecha_alta).toLocaleString('es-AR'),
        Descripcion: r.descripcion.substring(0, 40) + '...'
      })));
    } else {
      console.log('❌ No se encontraron reclamos para María Elena González');
      console.log('\n🔍 Buscando socios con nombre similar...\n');
      
      const socios = await client.query(`
        SELECT socio_id, nombre, apellido, email
        FROM socio
        WHERE nombre ILIKE '%maria%' OR apellido ILIKE '%gonzalez%'
        ORDER BY nombre, apellido
      `);
      
      console.log(`Socios encontrados: ${socios.rows.length}`);
      console.table(socios.rows);
    }
    
    // Ver todos los reclamos administrativos
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 TODOS LOS RECLAMOS ADMINISTRATIVOS:\n');
    
    const administrativos = await client.query(`
      SELECT 
        r.reclamo_id,
        s.nombre || ' ' || s.apellido as socio,
        s.email,
        d.nombre as detalle,
        r.estado,
        r.fecha_alta
      FROM reclamo r
      INNER JOIN cuenta c ON r.cuenta_id = c.cuenta_id
      INNER JOIN socio s ON c.socio_id = s.socio_id
      INNER JOIN detalle_tipo_reclamo d ON r.detalle_id = d.detalle_id
      INNER JOIN tipo_reclamo t ON d.tipo_id = t.tipo_id
      WHERE t.nombre = 'ADMINISTRATIVO'
      ORDER BY r.fecha_alta DESC
    `);
    
    console.log(`Total administrativos: ${administrativos.rows.length}`);
    console.table(administrativos.rows);
    
    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

verificarReclamosMaria();
