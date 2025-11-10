/**
 * Controlador de Métricas Avanzadas
 * Calcula KPIs y métricas complejas del sistema
 */

import Reclamo from '../models/Reclamo.js';
import pool from '../db.js';
import { respuestaExitosa, respuestaError } from '../utils/respuestas.js';

export default class MetricasController {
  /**
   * Obtener métricas avanzadas del sistema
   * Calcula KPIs como tiempo promedio de resolución, eficiencia operativa, etc.
   */
  static async obtenerMetricasAvanzadas(req, res) {
    try {
      // Obtener período del query parameter (default: mes_actual)
      const periodo = req.query.periodo || 'mes_actual';
      
      // Calcular el intervalo SQL según el período
      let intervaloActual = "NOW() - INTERVAL '30 days'";
      let intervaloAnterior = "NOW() - INTERVAL '60 days'";
      let finIntervaloAnterior = "NOW() - INTERVAL '30 days'";
      let periodoTexto = '30 días';

      switch(periodo) {
        case 'mes_actual':
          intervaloActual = "DATE_TRUNC('month', NOW())";
          intervaloAnterior = "DATE_TRUNC('month', NOW() - INTERVAL '1 month')";
          finIntervaloAnterior = "DATE_TRUNC('month', NOW())";
          periodoTexto = 'mes actual';
          break;
        case '7dias':
          intervaloActual = "NOW() - INTERVAL '7 days'";
          intervaloAnterior = "NOW() - INTERVAL '14 days'";
          finIntervaloAnterior = "NOW() - INTERVAL '7 days'";
          periodoTexto = 'últimos 7 días';
          break;
        case '30dias':
          intervaloActual = "NOW() - INTERVAL '30 days'";
          intervaloAnterior = "NOW() - INTERVAL '60 days'";
          finIntervaloAnterior = "NOW() - INTERVAL '30 days'";
          periodoTexto = 'últimos 30 días';
          break;
        case '90dias':
          intervaloActual = "NOW() - INTERVAL '90 days'";
          intervaloAnterior = "NOW() - INTERVAL '180 days'";
          finIntervaloAnterior = "NOW() - INTERVAL '90 days'";
          periodoTexto = 'últimos 90 días';
          break;
        case 'año':
          intervaloActual = "DATE_TRUNC('year', NOW())";
          intervaloAnterior = "DATE_TRUNC('year', NOW() - INTERVAL '1 year')";
          finIntervaloAnterior = "DATE_TRUNC('year', NOW())";
          periodoTexto = 'este año';
          break;
      }

      // 1. TIEMPO PROMEDIO DE RESOLUCIÓN
      // Calcular diferencia entre fecha_alta y fecha_cierre
      const tiempoResolucion = await pool.query(`
        SELECT 
          COUNT(*) as total_resueltos,
          AVG(
            EXTRACT(EPOCH FROM (
              COALESCE(r.fecha_cierre, NOW()) - r.fecha_alta
            )) / 86400
          ) as promedio_dias
        FROM reclamo r
        WHERE UPPER(r.estado) IN ('RESUELTO', 'CERRADO')
          AND r.fecha_alta >= ${intervaloActual}
      `);

      // Calcular del período anterior para comparación
      const tiempoResolucionAnterior = await pool.query(`
        SELECT 
          AVG(
            EXTRACT(EPOCH FROM (
              COALESCE(r.fecha_cierre, NOW()) - r.fecha_alta
            )) / 86400
          ) as promedio_dias
        FROM reclamo r
        WHERE UPPER(r.estado) IN ('RESUELTO', 'CERRADO')
          AND r.fecha_alta >= ${intervaloAnterior}
          AND r.fecha_alta < ${finIntervaloAnterior}
      `);

      const promedioActual = parseFloat(tiempoResolucion.rows[0]?.promedio_dias) || 0;
      const promedioAnterior = parseFloat(tiempoResolucionAnterior.rows[0]?.promedio_dias) || promedioActual;
      const cambioTiempo = promedioAnterior > 0 
        ? ((promedioAnterior - promedioActual) / promedioAnterior * 100) 
        : 0;

      // 2. EFICIENCIA OPERATIVA
      // Porcentaje de reclamos resueltos vs total
      const eficienciaQuery = await pool.query(`
        SELECT 
          COUNT(*) FILTER (WHERE UPPER(estado) IN ('RESUELTO', 'CERRADO')) as resueltos,
          COUNT(*) as total
        FROM reclamo
        WHERE fecha_alta >= ${intervaloActual}
      `);

      const resueltos = parseInt(eficienciaQuery.rows[0]?.resueltos) || 0;
      const totalReclamos = parseInt(eficienciaQuery.rows[0]?.total) || 1;
      const eficienciaOperativa = (resueltos / totalReclamos * 100);

      // Eficiencia del período anterior
      const eficienciaAnteriorQuery = await pool.query(`
        SELECT 
          COUNT(*) FILTER (WHERE UPPER(estado) IN ('RESUELTO', 'CERRADO')) as resueltos,
          COUNT(*) as total
        FROM reclamo
        WHERE fecha_alta >= ${intervaloAnterior}
          AND fecha_alta < ${finIntervaloAnterior}
      `);

      const resueltosAnterior = parseInt(eficienciaAnteriorQuery.rows[0]?.resueltos) || 0;
      const totalAnterior = parseInt(eficienciaAnteriorQuery.rows[0]?.total) || 1;
      const eficienciaAnterior = (resueltosAnterior / totalAnterior * 100);
      const cambioEficiencia = eficienciaOperativa - eficienciaAnterior;

      // 3. SATISFACCIÓN DEL SOCIO
      // Calcular promedio de calificaciones de la tabla valoracion (escala 1-5)
      let satisfaccionSocio = 0;
      let totalValoraciones = 0;
      let cambioSatisfaccion = 0;

      try {
        const satisfaccionQuery = await pool.query(`
          SELECT 
            AVG(calificacion) as promedio_calificacion,
            COUNT(*) as total_valoraciones
          FROM valoracion
          WHERE calificacion IS NOT NULL
            AND fecha_valoracion >= ${intervaloActual}
        `);

        const promedioCalificacion = parseFloat(satisfaccionQuery.rows[0]?.promedio_calificacion) || 0;
        totalValoraciones = parseInt(satisfaccionQuery.rows[0]?.total_valoraciones) || 0;
        satisfaccionSocio = promedioCalificacion;

        // Satisfacción del período anterior para comparación
        const satisfaccionAnteriorQuery = await pool.query(`
          SELECT 
            AVG(calificacion) as promedio_calificacion
          FROM valoracion
          WHERE calificacion IS NOT NULL
            AND fecha_valoracion >= ${intervaloAnterior}
            AND fecha_valoracion < ${finIntervaloAnterior}
        `);

        const satisfaccionSocioAnterior = parseFloat(satisfaccionAnteriorQuery.rows[0]?.promedio_calificacion) || satisfaccionSocio;
        cambioSatisfaccion = satisfaccionSocioAnterior > 0 
          ? ((satisfaccionSocio - satisfaccionSocioAnterior) / satisfaccionSocioAnterior * 100)
          : 0;
      } catch (error) {
        console.warn('⚠️  Tabla valoracion no disponible, usando valor por defecto:', error.message);
        // Si la tabla no existe, usar valor neutral
        satisfaccionSocio = 0;
        totalValoraciones = 0;
        cambioSatisfaccion = 0;
      }

      // 4. ESTADOS DE RECLAMOS (por período)
      const estadosReclamosQuery = await pool.query(`
        SELECT 
          COUNT(*) FILTER (WHERE UPPER(estado) = 'PENDIENTE') as pendientes,
          COUNT(*) FILTER (WHERE UPPER(estado) = 'EN_PROCESO') as en_proceso,
          COUNT(*) FILTER (WHERE UPPER(estado) IN ('RESUELTO', 'CERRADO')) as resueltos,
          COUNT(*) as total
        FROM reclamo
        WHERE fecha_alta >= ${intervaloActual}
      `);

      const estadosReclamos = {
        pendientes: parseInt(estadosReclamosQuery.rows[0]?.pendientes) || 0,
        en_proceso: parseInt(estadosReclamosQuery.rows[0]?.en_proceso) || 0,
        resueltos: parseInt(estadosReclamosQuery.rows[0]?.resueltos) || 0,
        total: parseInt(estadosReclamosQuery.rows[0]?.total) || 0
      };

      // 5. ANÁLISIS DE FACTURACIÓN (por período)
      // Filtrar facturas pagadas por updated_at (fecha de pago) y pendientes por vencimiento o creación
      const facturacionQuery = await pool.query(`
        SELECT 
          COUNT(*) FILTER (WHERE estado IN ('PAGADA', 'PENDIENTE'))::int as total_facturas,
          COUNT(*) FILTER (WHERE estado = 'PENDIENTE')::int as facturas_pendientes,
          COUNT(*) FILTER (WHERE estado = 'PAGADA')::int as facturas_pagadas,
          COALESCE(SUM(importe) FILTER (WHERE estado = 'PAGADA' AND updated_at >= ${intervaloActual}), 0)::numeric as recaudado,
          COALESCE(SUM(importe) FILTER (WHERE estado = 'PENDIENTE'), 0)::numeric as pendiente_cobro
        FROM factura
      `);

      const totalFacturas = parseInt(facturacionQuery.rows[0]?.total_facturas) || 0;
      const facturasPendientes = parseInt(facturacionQuery.rows[0]?.facturas_pendientes) || 0;
      const facturasPagadas = parseInt(facturacionQuery.rows[0]?.facturas_pagadas) || 0;
      const recaudado = parseFloat(facturacionQuery.rows[0]?.recaudado) || 0;
      const pendienteCobro = parseFloat(facturacionQuery.rows[0]?.pendiente_cobro) || 0;
      
      const tasaCobro = totalFacturas > 0 
        ? Math.round((facturasPagadas / totalFacturas) * 100)
        : 0;

      const facturacion = {
        total_facturas: totalFacturas,
        facturas_pendientes: facturasPendientes,
        facturas_pagadas: facturasPagadas,
        recaudado: recaudado,
        pendiente_cobro: pendienteCobro,
        tasa_cobro: tasaCobro
      };

      // 6. OPERARIOS ACTIVOS E INACTIVOS (con/sin órdenes de trabajo)
      // Contar total de operarios y cuántos tienen OTs asignadas
      const operariosQuery = await pool.query(`
        SELECT 
          COUNT(DISTINCT e.empleado_id) as total_operarios
        FROM empleado e
        INNER JOIN usuario u ON e.empleado_id = u.empleado_id
        INNER JOIN usuario_rol ur ON u.usuario_id = ur.usuario_id
        INNER JOIN rol r ON ur.rol_id = r.rol_id
        WHERE UPPER(r.nombre) = 'OPERARIO'
          AND e.activo = true
      `);

      const operariosConOtQuery = await pool.query(`
        SELECT 
          COUNT(DISTINCT ot.empleado_id) as operarios_con_ot,
          COUNT(ot.ot_id) as total_ots_activas
        FROM orden_trabajo ot
        INNER JOIN empleado e ON ot.empleado_id = e.empleado_id
        INNER JOIN usuario u ON e.empleado_id = u.empleado_id
        INNER JOIN usuario_rol ur ON u.usuario_id = ur.usuario_id
        INNER JOIN rol r ON ur.rol_id = r.rol_id
        WHERE ot.estado IN ('PENDIENTE', 'EN_PROCESO', 'ASIGNADA')
          AND ot.empleado_id IS NOT NULL
          AND UPPER(r.nombre) = 'OPERARIO'
          AND e.activo = true
      `);

      const totalOperarios = parseInt(operariosQuery.rows[0]?.total_operarios) || 0;
      const operariosConOt = parseInt(operariosConOtQuery.rows[0]?.operarios_con_ot) || 0;
      const totalOtsActivas = parseInt(operariosConOtQuery.rows[0]?.total_ots_activas) || 0;
      const operariosInactivos = totalOperarios - operariosConOt;

      // Respuesta estructurada
      const metricas = {
        tiempo_resolucion: {
          promedio_dias: Math.round(promedioActual * 10) / 10, // 1 decimal
          total_resueltos: parseInt(tiempoResolucion.rows[0]?.total_resueltos) || 0,
          cambio_porcentual: Math.round(cambioTiempo * 10) / 10,
          mejor: cambioTiempo > 0 // true si mejoró (menos tiempo)
        },
        eficiencia_operativa: {
          porcentaje: Math.round(eficienciaOperativa),
          reclamos_resueltos: resueltos,
          total_reclamos: totalReclamos,
          cambio_porcentual: Math.round(cambioEficiencia * 10) / 10
        },
        satisfaccion_socio: {
          calificacion: satisfaccionSocio > 0 ? Math.round(satisfaccionSocio * 10) / 10 : 0, // Escala 1-5
          base_calculo: 'promedio_valoraciones',
          total_valoraciones: totalValoraciones,
          cambio_porcentual: isNaN(cambioSatisfaccion) ? 0 : Math.round(cambioSatisfaccion * 10) / 10
        },
        estados_reclamos: estadosReclamos,
        facturacion: facturacion,
        operarios_activos: {
          inactivos: operariosInactivos,
          con_ordenes: operariosConOt,
          total_ots_activas: totalOtsActivas,
          total_operarios: totalOperarios
        },
        fecha_calculo: new Date(),
        periodo_evaluado: periodoTexto
      };

      return respuestaExitosa(res, metricas, 'Métricas avanzadas calculadas exitosamente');
    } catch (error) {
      console.error('Error al calcular métricas avanzadas:', error);
      return respuestaError(res, 'Error al calcular métricas avanzadas', 500, error.message);
    }
  }

  /**
   * Obtener detalle del estado de operarios con sus OTs asignadas
   */
  static async obtenerEstadoOperarios(req, res) {
    try {
      // Listar todos los operarios con sus OTs
      const resultado = await pool.query(`
        SELECT 
          e.empleado_id,
          e.nombre,
          e.apellido,
          e.activo,
          u.email,
          r.nombre as rol_nombre,
          COUNT(ot.ot_id) FILTER (WHERE ot.estado IN ('PENDIENTE', 'EN_PROCESO', 'ASIGNADA')) as ots_activas,
          COUNT(ot.ot_id) FILTER (WHERE ot.estado = 'PENDIENTE') as ots_pendientes,
          COUNT(ot.ot_id) FILTER (WHERE ot.estado = 'EN_PROCESO') as ots_en_proceso,
          COUNT(ot.ot_id) FILTER (WHERE ot.estado = 'COMPLETADA') as ots_completadas_mes,
          CASE 
            WHEN COUNT(ot.ot_id) FILTER (WHERE ot.estado IN ('PENDIENTE', 'EN_PROCESO', 'ASIGNADA')) > 0 
            THEN 'OCUPADO' 
            ELSE 'LIBRE' 
          END as estado
        FROM empleado e
        INNER JOIN usuario u ON e.empleado_id = u.empleado_id
        INNER JOIN usuario_rol ur ON u.usuario_id = ur.usuario_id
        INNER JOIN rol r ON ur.rol_id = r.rol_id
        LEFT JOIN orden_trabajo ot ON e.empleado_id = ot.empleado_id 
          AND (ot.estado IN ('PENDIENTE', 'EN_PROCESO', 'ASIGNADA', 'COMPLETADA'))
          AND (ot.estado IN ('PENDIENTE', 'EN_PROCESO', 'ASIGNADA') OR ot.fecha_cierre >= NOW() - INTERVAL '30 days')
        WHERE UPPER(r.nombre) = 'OPERARIO'
          AND e.activo = true
        GROUP BY e.empleado_id, e.nombre, e.apellido, e.activo, u.email, r.nombre
        ORDER BY 
          CASE 
            WHEN COUNT(ot.ot_id) FILTER (WHERE ot.estado IN ('PENDIENTE', 'EN_PROCESO', 'ASIGNADA')) > 0 
            THEN 1 
            ELSE 0 
          END DESC,
          e.apellido, e.nombre
      `);

      const operarios = resultado.rows.map(op => ({
        empleado_id: op.empleado_id,
        nombre_completo: `${op.nombre} ${op.apellido}`,
        nombre: op.nombre,
        apellido: op.apellido,
        legajo: op.empleado_id,
        email: op.email || 'No asignado',
        cargo: op.rol_nombre || 'Operario',
        activo: op.activo,
        estado: op.estado,
        ots_activas: parseInt(op.ots_activas) || 0,
        ots_pendientes: parseInt(op.ots_pendientes) || 0,
        ots_en_proceso: parseInt(op.ots_en_proceso) || 0,
        ots_completadas_mes: parseInt(op.ots_completadas_mes) || 0
      }));

      const resumen = {
        total_operarios: operarios.length,
        operarios_libres: operarios.filter(op => op.estado === 'LIBRE').length,
        operarios_ocupados: operarios.filter(op => op.estado === 'OCUPADO').length,
        total_ots_activas: operarios.reduce((sum, op) => sum + op.ots_activas, 0)
      };

      return respuestaExitosa(res, { operarios, resumen }, 'Estado de operarios obtenido exitosamente');
    } catch (error) {
      console.error('Error al obtener estado de operarios:', error);
      return respuestaError(res, 'Error al obtener estado de operarios', 500, error.message);
    }
  }
}
