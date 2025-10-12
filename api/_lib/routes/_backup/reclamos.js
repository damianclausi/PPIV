import express from 'express';
import { query } from '../db.js';
import { authMiddleware } from './auth.js';

const router = express.Router();

// Listar reclamos del cliente
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      `SELECT r.*, s.numero_servicio, s.direccion
       FROM reclamos r
       JOIN servicios s ON r.servicio_id = s.id
       WHERE s.cliente_id = $1
       ORDER BY r.fecha_creacion DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener reclamos' });
  }
});

// Obtener detalle de reclamo
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      `SELECT r.*, s.numero_servicio, s.direccion,
              o.nombre as operario_nombre, o.apellido as operario_apellido
       FROM reclamos r
       JOIN servicios s ON r.servicio_id = s.id
       LEFT JOIN operarios o ON r.operario_asignado_id = o.id
       WHERE r.id = $1 AND s.cliente_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reclamo no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener reclamo' });
  }
});

// Crear nuevo reclamo
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { servicio_id, tipo, descripcion, prioridad } = req.body;

    if (!servicio_id || !tipo || !descripcion) {
      return res.status(400).json({ error: 'Campos requeridos faltantes' });
    }

    // Verificar que el servicio pertenece al cliente
    const servicio = await query(
      'SELECT * FROM servicios WHERE id = $1 AND cliente_id = $2',
      [servicio_id, req.user.id]
    );

    if (servicio.rows.length === 0) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    const result = await query(
      `INSERT INTO reclamos (servicio_id, tipo, descripcion, prioridad, estado, fecha_creacion)
       VALUES ($1, $2, $3, $4, 'pendiente', NOW())
       RETURNING *`,
      [servicio_id, tipo, descripcion, prioridad || 'media']
    );

    res.status(201).json({
      message: 'Reclamo creado exitosamente',
      reclamo: result.rows[0]
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al crear reclamo' });
  }
});

export default router;
