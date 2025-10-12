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
      // 1. TIEMPO PROMEDIO DE RESOLUCIÓN
      // Calcular diferencia entre fecha_alta y cuando el estado cambió a RESUELTO
      const tiempoResolucion = await pool.query(`
        SELECT 
          COUNT(*) as total_resueltos,
          AVG(
            EXTRACT(EPOCH FROM (
              COALESCE(r.fecha_modificacion, r.fecha_alta) - r.fecha_alta
            )) / 86400
          ) as promedio_dias
        FROM reclamo r
        WHERE UPPER(r.estado) IN ('RESUELTO', 'CERRADO')
          AND r.fecha_alta >= NOW() - INTERVAL '30 days'
      `);

      // Calcular del mes anterior para comparación
      const tiempoResolucionAnterior = await pool.query(`
        SELECT 
          AVG(
            EXTRACT(EPOCH FROM (
              COALESCE(r.fecha_modificacion, r.fecha_alta) - r.fecha_alta
            )) / 86400
          ) as promedio_dias
        FROM reclamo r
        WHERE UPPER(r.estado) IN ('RESUELTO', 'CERRADO')
          AND r.fecha_alta >= NOW() - INTERVAL '60 days'
          AND r.fecha_alta < NOW() - INTERVAL '30 days'
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
        WHERE fecha_alta >= NOW() - INTERVAL '30 days'
      `);

      const resueltos = parseInt(eficienciaQuery.rows[0]?.resueltos) || 0;
      const totalReclamos = parseInt(eficienciaQuery.rows[0]?.total) || 1;
      const eficienciaOperativa = (resueltos / totalReclamos * 100);

      // Eficiencia del mes anterior
      const eficienciaAnteriorQuery = await pool.query(`
        SELECT 
          COUNT(*) FILTER (WHERE UPPER(estado) IN ('RESUELTO', 'CERRADO')) as resueltos,
          COUNT(*) as total
        FROM reclamo
        WHERE fecha_alta >= NOW() - INTERVAL '60 days'
          AND fecha_alta < NOW() - INTERVAL '30 days'
      `);

      const resueltosAnterior = parseInt(eficienciaAnteriorQuery.rows[0]?.resueltos) || 0;
      const totalAnterior = parseInt(eficienciaAnteriorQuery.rows[0]?.total) || 1;
      const eficienciaAnterior = (resueltosAnterior / totalAnterior * 100);
      const cambioEficiencia = eficienciaOperativa - eficienciaAnterior;

      // 3. SATISFACCIÓN DEL SOCIO
      // Como no tenemos tabla de calificaciones, usamos un proxy:
      // Ratio de reclamos cerrados sin reapertura vs total de reclamos
      const satisfaccionQuery = await pool.query(`
        SELECT 
          COUNT(*) FILTER (
            WHERE UPPER(estado) IN ('RESUELTO', 'CERRADO')
            AND NOT EXISTS (
              SELECT 1 FROM reclamo r2 
              WHERE r2.cuenta_id = reclamo.cuenta_id 
              AND r2.fecha_alta > reclamo.fecha_alta 
              AND r2.detalle_id = reclamo.detalle_id
              AND r2.fecha_alta < reclamo.fecha_alta + INTERVAL '7 days'
            )
          ) as sin_reincidencia,
          COUNT(*) FILTER (WHERE UPPER(estado) IN ('RESUELTO', 'CERRADO')) as total_cerrados
        FROM reclamo
        WHERE fecha_alta >= NOW() - INTERVAL '30 days'
      `);

      const sinReincidencia = parseInt(satisfaccionQuery.rows[0]?.sin_reincidencia) || 0;
      const totalCerrados = parseInt(satisfaccionQuery.rows[0]?.total_cerrados) || 1;
      // Convertir a escala de 1-5
      const satisfaccionBase = (sinReincidencia / totalCerrados);
      const satisfaccionSocio = 3.0 + (satisfaccionBase * 2); // Escala 3.0 - 5.0

      // Satisfacción del trimestre anterior
      const satisfaccionAnteriorQuery = await pool.query(`
        SELECT 
          COUNT(*) FILTER (
            WHERE UPPER(estado) IN ('RESUELTO', 'CERRADO')
            AND NOT EXISTS (
              SELECT 1 FROM reclamo r2 
              WHERE r2.cuenta_id = reclamo.cuenta_id 
              AND r2.fecha_alta > reclamo.fecha_alta 
              AND r2.detalle_id = reclamo.detalle_id
              AND r2.fecha_alta < reclamo.fecha_alta + INTERVAL '7 days'
            )
          ) as sin_reincidencia,
          COUNT(*) FILTER (WHERE UPPER(estado) IN ('RESUELTO', 'CERRADO')) as total_cerrados
        FROM reclamo
        WHERE fecha_alta >= NOW() - INTERVAL '120 days'
          AND fecha_alta < NOW() - INTERVAL '30 days'
      `);

      const sinReincidenciaAnterior = parseInt(satisfaccionAnteriorQuery.rows[0]?.sin_reincidencia) || 0;
      const totalCerradosAnterior = parseInt(satisfaccionAnteriorQuery.rows[0]?.total_cerrados) || 1;
      const satisfaccionBaseAnterior = (sinReincidenciaAnterior / totalCerradosAnterior);
      const satisfaccionSocioAnterior = 3.0 + (satisfaccionBaseAnterior * 2);
      const cambioSatisfaccion = ((satisfaccionSocio - satisfaccionSocioAnterior) / satisfaccionSocioAnterior * 100);

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
          calificacion: Math.round(satisfaccionSocio * 10) / 10, // Escala 1-5
          base_calculo: 'ratio_sin_reincidencia',
          sin_reincidencia: sinReincidencia,
          total_evaluado: totalCerrados,
          cambio_porcentual: Math.round(cambioSatisfaccion * 10) / 10
        },
        fecha_calculo: new Date(),
        periodo_evaluado: '30 días'
      };

      return respuestaExitosa(res, metricas, 'Métricas avanzadas calculadas exitosamente');
    } catch (error) {
      console.error('Error al calcular métricas avanzadas:', error);
      return respuestaError(res, 'Error al calcular métricas avanzadas', 500, error.message);
    }
  }
}
