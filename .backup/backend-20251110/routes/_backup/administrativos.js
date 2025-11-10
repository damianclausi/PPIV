import express from 'express';
import { query } from '../db.js';
import { authMiddleware } from './auth.js';

const router = express.Router();

// Listar todos los clientes (ABM)
router.get('/clientes', authMiddleware, async (req, res) => {
  try {
    const { activo, buscar } = req.query;
    
    let queryText = 'SELECT id, nombre, apellido, email, dni, telefono, direccion, activo FROM clientes WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (activo !== undefined) {
      paramCount++;
      queryText += ` AND activo = $${paramCount}`;
      params.push(activo === 'true');
    }

    if (buscar) {
      paramCount++;
      queryText += ` AND (nombre ILIKE $${paramCount} OR apellido ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      params.push(`%${buscar}%`);
    }

    queryText += ' ORDER BY apellido, nombre';

    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
});

// Activar/Desactivar cliente
router.patch('/clientes/:id/estado', authMiddleware, async (req, res) => {
  try {
    const { activo } = req.body;

    const result = await query(
      'UPDATE clientes SET activo = $1 WHERE id = $2 RETURNING *',
      [activo, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json({
      message: `Cliente ${activo ? 'activado' : 'desactivado'} exitosamente`,
      cliente: result.rows[0]
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al actualizar cliente' });
  }
});

// Métricas y KPIs
router.get('/metricas', authMiddleware, async (req, res) => {
  try {
    // Tiempo medio de resolución
    const tiempoResolucion = await query(
      `SELECT AVG(EXTRACT(EPOCH FROM (fecha_resolucion - fecha_creacion))/3600) as horas_promedio
       FROM reclamos
       WHERE estado = 'resuelto' AND fecha_resolucion IS NOT NULL`
    );

    // Reclamos por tipo
    const reclamosPorTipo = await query(
      `SELECT tipo, COUNT(*) as cantidad
       FROM reclamos
       GROUP BY tipo
       ORDER BY cantidad DESC`
    );

    // Reclamos por prioridad
    const reclamosPorPrioridad = await query(
      `SELECT prioridad, COUNT(*) as cantidad
       FROM reclamos
       GROUP BY prioridad
       ORDER BY 
         CASE prioridad
           WHEN 'alta' THEN 1
           WHEN 'media' THEN 2
           WHEN 'baja' THEN 3
         END`
    );

    // Reclamos por semana (últimos 3 meses)
    const reclamosPorSemana = await query(
      `SELECT 
         DATE_TRUNC('week', fecha_creacion) as semana,
         COUNT(*) as cantidad
       FROM reclamos
       WHERE fecha_creacion >= NOW() - INTERVAL '3 months'
       GROUP BY semana
       ORDER BY semana DESC`
    );

    // Estadísticas generales
    const estadisticas = await query(
      `SELECT 
         COUNT(*) FILTER (WHERE estado = 'pendiente') as pendientes,
         COUNT(*) FILTER (WHERE estado = 'en_curso') as en_curso,
         COUNT(*) FILTER (WHERE estado = 'resuelto') as resueltos,
         COUNT(*) as total
       FROM reclamos`
    );

    res.json({
      tiempoMedioResolucion: parseFloat(tiempoResolucion.rows[0].horas_promedio) || 0,
      reclamosPorTipo: reclamosPorTipo.rows,
      reclamosPorPrioridad: reclamosPorPrioridad.rows,
      reclamosPorSemana: reclamosPorSemana.rows,
      estadisticas: estadisticas.rows[0]
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener métricas' });
  }
});

// Planificación de itinerarios
router.get('/itinerarios', authMiddleware, async (req, res) => {
  try {
    const { fecha } = req.query;
    
    const result = await query(
      `SELECT r.*, s.direccion, s.numero_servicio,
              c.nombre as cliente_nombre, c.apellido as cliente_apellido,
              o.nombre as operario_nombre, o.apellido as operario_apellido
       FROM reclamos r
       JOIN servicios s ON r.servicio_id = s.id
       JOIN clientes c ON s.cliente_id = c.id
       LEFT JOIN operarios o ON r.operario_asignado_id = o.id
       WHERE r.estado IN ('pendiente', 'en_curso')
       ${fecha ? 'AND DATE(r.fecha_creacion) = $1' : ''}
       ORDER BY r.prioridad, r.fecha_creacion`,
      fecha ? [fecha] : []
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener itinerarios' });
  }
});

// Asignar operario a reclamo
router.put('/reclamos/:id/asignar', authMiddleware, async (req, res) => {
  try {
    const { operario_id } = req.body;

    const result = await query(
      'UPDATE reclamos SET operario_asignado_id = $1 WHERE id = $2 RETURNING *',
      [operario_id, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reclamo no encontrado' });
    }

    res.json({
      message: 'Operario asignado exitosamente',
      reclamo: result.rows[0]
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al asignar operario' });
  }
});

export default router;
