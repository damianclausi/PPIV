import pool from '../db.js';

async function verificarEstados() {
  try {
    console.log('=== VERIFICANDO ESTADOS EN EL SISTEMA ===\n');
    
    // 1. Verificar tipos de datos de columnas estado
    console.log('1. Estructura de columnas estado:');
    const columnas = await pool.query(`
      SELECT table_name, column_name, data_type, udt_name
      FROM information_schema.columns 
      WHERE column_name LIKE '%estado%' 
        AND table_schema = 'public'
      ORDER BY table_name;
    `);
    console.table(columnas.rows);
    
    // 2. Verificar estados de reclamos
    console.log('\n2. Estados únicos en tabla RECLAMO:');
    const estadosReclamo = await pool.query(`
      SELECT DISTINCT estado, COUNT(*) as cantidad
      FROM reclamo
      GROUP BY estado
      ORDER BY estado;
    `);
    console.table(estadosReclamo.rows);
    
    // 3. Verificar estados de OTs
    console.log('\n3. Estados únicos en tabla ORDEN_TRABAJO:');
    const estadosOT = await pool.query(`
      SELECT DISTINCT estado, COUNT(*) as cantidad
      FROM orden_trabajo
      GROUP BY estado
      ORDER BY estado;
    `);
    console.table(estadosOT.rows);
    
    // 4. Verificar tipos ENUM si existen
    console.log('\n4. Verificando ENUM types:');
    const enums = await pool.query(`
      SELECT t.typname as enum_name, e.enumlabel as enum_value
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      ORDER BY enum_name, e.enumsortorder;
    `);
    
    if (enums.rows.length > 0) {
      console.table(enums.rows);
    } else {
      console.log('No hay ENUMs definidos (usando VARCHAR/TEXT)');
    }
    
    // 5. Verificar mapeo actual OT -> Reclamo
    console.log('\n5. Mapeo actual de estados (OT -> Reclamo):');
    const mapeo = await pool.query(`
      SELECT 
        ot.estado as estado_ot,
        r.estado as estado_reclamo,
        COUNT(*) as cantidad
      FROM orden_trabajo ot
      INNER JOIN reclamo r ON ot.reclamo_id = r.reclamo_id
      GROUP BY ot.estado, r.estado
      ORDER BY ot.estado, r.estado;
    `);
    console.table(mapeo.rows);
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

verificarEstados();
