import pool from '../db.js';

async function analizarOTsTecnicas() {
  try {
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║     ANÁLISIS DE ÓRDENES DE TRABAJO TÉCNICAS              ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    
    // 1. Estructura de empleados/operarios
    console.log('1️⃣  OPERARIOS Y CUADRILLAS:\n');
    
    const operarios = await pool.query(`
      SELECT 
        e.empleado_id,
        e.nombre,
        e.apellido,
        e.legajo,
        e.rol_interno,
        e.activo,
        COUNT(ot.ot_id) as ots_asignadas,
        COUNT(CASE WHEN ot.estado IN ('ASIGNADA', 'EN_PROCESO') THEN 1 END) as ots_activas
      FROM empleado e
      LEFT JOIN orden_trabajo ot ON e.empleado_id = ot.empleado_id
      WHERE e.rol_interno ILIKE '%operario%' OR e.rol_interno ILIKE '%tecnico%'
      GROUP BY e.empleado_id, e.nombre, e.apellido, e.legajo, e.rol_interno, e.activo
      ORDER BY e.empleado_id;
    `);
    
    console.log(`   Total operarios: ${operarios.rowCount}`);
    console.table(operarios.rows);
    
    // 2. Cuadrillas disponibles
    console.log('\n2️⃣  CUADRILLAS DISPONIBLES:\n');
    
    const cuadrillas = await pool.query(`
      SELECT 
        c.cuadrilla_id,
        c.nombre,
        c.tipo,
        c.activa,
        COUNT(e.empleado_id) as total_operarios
      FROM cuadrilla c
      LEFT JOIN empleado e ON c.cuadrilla_id = e.cuadrilla_id AND e.activo = true
      GROUP BY c.cuadrilla_id, c.nombre, c.tipo, c.activa
      ORDER BY c.cuadrilla_id;
    `);
    
    console.table(cuadrillas.rows);
    
    // 3. OTs técnicas actuales (con empleado_id)
    console.log('\n3️⃣  ÓRDENES DE TRABAJO TÉCNICAS ACTUALES:\n');
    
    const otsTecnicas = await pool.query(`
      SELECT 
        ot.ot_id,
        ot.estado,
        ot.empleado_id,
        e.nombre as operario_nombre,
        e.apellido as operario_apellido,
        r.reclamo_id,
        r.descripcion,
        t.nombre as tipo_reclamo
      FROM orden_trabajo ot
      INNER JOIN reclamo r ON ot.reclamo_id = r.reclamo_id
      LEFT JOIN empleado e ON ot.empleado_id = e.empleado_id
      INNER JOIN detalle_tipo_reclamo d ON r.detalle_id = d.detalle_id
      INNER JOIN tipo_reclamo t ON d.tipo_id = t.tipo_id
      WHERE ot.empleado_id IS NOT NULL
      ORDER BY ot.ot_id DESC
      LIMIT 10;
    `);
    
    console.log(`   Total OTs técnicas: ${otsTecnicas.rowCount}`);
    console.table(otsTecnicas.rows);
    
    // 4. Resumen por estado
    console.log('\n4️⃣  RESUMEN DE OTs TÉCNICAS POR ESTADO:\n');
    
    const resumen = await pool.query(`
      SELECT 
        ot.estado,
        COUNT(*) as cantidad,
        COUNT(DISTINCT ot.empleado_id) as operarios_distintos
      FROM orden_trabajo ot
      WHERE ot.empleado_id IS NOT NULL
      GROUP BY ot.estado
      ORDER BY ot.estado;
    `);
    
    console.table(resumen.rows);
    
    // 5. Tipos de reclamos técnicos
    console.log('\n5️⃣  TIPOS DE RECLAMOS TÉCNICOS:\n');
    
    const tiposReclamos = await pool.query(`
      SELECT 
        t.tipo_id,
        t.nombre as tipo_reclamo,
        COUNT(DISTINCT r.reclamo_id) as total_reclamos,
        COUNT(DISTINCT ot.ot_id) as total_ots
      FROM tipo_reclamo t
      LEFT JOIN detalle_tipo_reclamo d ON t.tipo_id = d.tipo_id
      LEFT JOIN reclamo r ON d.detalle_id = r.detalle_id
      LEFT JOIN orden_trabajo ot ON r.reclamo_id = ot.reclamo_id AND ot.empleado_id IS NOT NULL
      WHERE t.nombre != 'ADMINISTRATIVO'
      GROUP BY t.tipo_id, t.nombre
      ORDER BY total_reclamos DESC;
    `);
    
    console.table(tiposReclamos.rows);
    
    // 6. OTs sin asignar (PENDIENTES)
    console.log('\n6️⃣  OTs TÉCNICAS PENDIENTES (Sin operario asignado):\n');
    
    const pendientes = await pool.query(`
      SELECT 
        ot.ot_id,
        r.reclamo_id,
        r.descripcion,
        r.fecha_alta,
        t.nombre as tipo_reclamo,
        p.nombre as prioridad
      FROM orden_trabajo ot
      INNER JOIN reclamo r ON ot.reclamo_id = r.reclamo_id
      INNER JOIN detalle_tipo_reclamo d ON r.detalle_id = d.detalle_id
      INNER JOIN tipo_reclamo t ON d.tipo_id = t.tipo_id
      INNER JOIN prioridad p ON r.prioridad_id = p.prioridad_id
      WHERE ot.empleado_id IS NULL
        AND t.nombre != 'ADMINISTRATIVO'
        AND ot.estado = 'PENDIENTE'
      ORDER BY p.prioridad_id ASC, r.fecha_alta ASC;
    `);
    
    console.log(`   Total OTs técnicas pendientes: ${pendientes.rowCount}`);
    if (pendientes.rowCount > 0) {
      console.table(pendientes.rows);
    } else {
      console.log('   ✅ No hay OTs técnicas pendientes de asignación');
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

analizarOTsTecnicas();
