import pool from '../db.js';

async function analizarEstructuraCompleta() {
  try {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('       ANÁLISIS COMPLETO DE BASE DE DATOS');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // 1. Ver todas las tablas
    console.log('1. TABLAS DISPONIBLES:\n');
    const tablas = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    console.table(tablas.rows);
    
    // 2. Estructura de tabla EMPLEADO
    console.log('\n2. ESTRUCTURA DE TABLA EMPLEADO:\n');
    const empleado = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'empleado'
      ORDER BY ordinal_position;
    `);
    console.table(empleado.rows);
    
    // 3. Datos de empleados
    console.log('\n3. EMPLEADOS EN EL SISTEMA:\n');
    const empleados = await pool.query(`
      SELECT empleado_id, nombre, apellido, rol_interno, activo
      FROM empleado
      ORDER BY empleado_id;
    `);
    console.table(empleados.rows);
    
    // 4. Estructura de CUADRILLA
    console.log('\n4. ESTRUCTURA DE TABLA CUADRILLA:\n');
    const cuadrillaStruct = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'cuadrilla'
      ORDER BY ordinal_position;
    `);
    console.table(cuadrillaStruct.rows);
    
    // 5. Cuadrillas disponibles
    console.log('\n5. CUADRILLAS EN EL SISTEMA:\n');
    const cuadrillas = await pool.query(`
      SELECT cuadrilla_id, nombre, zona, activa
      FROM cuadrilla
      ORDER BY cuadrilla_id;
    `);
    console.table(cuadrillas.rows);
    
    // 6. Estructura de EMPLEADO_CUADRILLA
    console.log('\n6. ESTRUCTURA DE TABLA EMPLEADO_CUADRILLA:\n');
    const empCuadStruct = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'empleado_cuadrilla'
      ORDER BY ordinal_position;
    `);
    console.table(empCuadStruct.rows);
    
    // 7. Relación empleados-cuadrillas
    console.log('\n7. EMPLEADOS Y SUS CUADRILLAS:\n');
    const empCuad = await pool.query(`
      SELECT 
        e.empleado_id,
        e.nombre || ' ' || e.apellido as empleado,
        e.rol_interno,
        c.cuadrilla_id,
        c.nombre as cuadrilla,
        ec.fecha_asignacion,
        ec.fecha_desasignacion,
        ec.activa
      FROM empleado_cuadrilla ec
      INNER JOIN empleado e ON ec.empleado_id = e.empleado_id
      INNER JOIN cuadrilla c ON ec.cuadrilla_id = c.cuadrilla_id
      WHERE e.activo = true AND ec.activa = true
      ORDER BY c.cuadrilla_id, e.apellido;
    `);
    console.table(empCuad.rows);
    
    // 8. OTs técnicas actuales
    console.log('\n8. OTs TÉCNICAS (con empleado_id):\n');
    const otsTecnicas = await pool.query(`
      SELECT 
        ot.ot_id,
        ot.estado,
        ot.empleado_id,
        e.nombre || ' ' || e.apellido as operario,
        e.rol_interno,
        r.reclamo_id,
        t.nombre as tipo_reclamo
      FROM orden_trabajo ot
      INNER JOIN reclamo r ON ot.reclamo_id = r.reclamo_id
      INNER JOIN detalle_tipo_reclamo d ON r.detalle_id = d.detalle_id
      INNER JOIN tipo_reclamo t ON d.tipo_id = t.tipo_id
      LEFT JOIN empleado e ON ot.empleado_id = e.empleado_id
      WHERE ot.empleado_id IS NOT NULL
      ORDER BY ot.ot_id DESC
      LIMIT 10;
    `);
    console.log(`Total OTs técnicas: ${otsTecnicas.rowCount}`);
    console.table(otsTecnicas.rows);
    
    // 9. Ver foreign keys
    console.log('\n9. FOREIGN KEYS EN ORDEN_TRABAJO:\n');
    const fks = await pool.query(`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'orden_trabajo';
    `);
    console.table(fks.rows);
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

analizarEstructuraCompleta();
