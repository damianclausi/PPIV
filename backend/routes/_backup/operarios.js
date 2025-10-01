import express from 'express';
import { query } from '../db.js';
import { authMiddleware } from './auth.js';

const router = express.Router();

// Listar reclamos asignados al operario
router.get('/asignados', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      `SELECT r.*, s.numero_servicio, s.direccion, s.tipo_servicio,
              c.nombre as cliente_nombre, c.apellido as cliente_apellido, c.telefono as cliente_telefono
       FROM reclamos r
       JOIN servicios s ON r.servicio_id = s.id
       JOIN clientes c ON s.cliente_id = c.id
       WHERE r.operario_asignado_id = $1
       ORDER BY 
         CASE r.prioridad
           WHEN 'alta' THEN 1
           WHEN 'media' THEN 2
           WHEN 'baja' THEN 3
         END,
         r.fecha_creacion ASC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener reclamos asignados' });
  }
});

// Actualizar estado de reclamo
router.put('/reclamos/:id/estado', authMiddleware, async (req, res) => {
  try {
    const { estado, notas } = req.body;

    if (!['pendiente', 'en_curso', 'resuelto'].includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const result = await query(
      `UPDATE reclamos 
       SET estado = $1, 
           notas = COALESCE($2, notas),
           fecha_resolucion = CASE WHEN $1 = 'resuelto' THEN NOW() ELSE fecha_resolucion END
       WHERE id = $3 AND operario_asignado_id = $4
       RETURNING *`,
      [estado, notas, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reclamo no encontrado o no asignado' });
    }

    res.json({
      message: 'Estado actualizado exitosamente',
      reclamo: result.rows[0]
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al actualizar reclamo' });
  }
});

// Cargar insumos utilizados
router.post('/reclamos/:id/insumos', authMiddleware, async (req, res) => {
  try {
    const { insumos } = req.body; // Array de {material, cantidad}

    if (!Array.isArray(insumos) || insumos.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de insumos' });
    }

    // Verificar que el reclamo está asignado al operario
    const reclamo = await query(
      'SELECT * FROM reclamos WHERE id = $1 AND operario_asignado_id = $2',
      [req.params.id, req.user.id]
    );

    if (reclamo.rows.length === 0) {
      return res.status(404).json({ error: 'Reclamo no encontrado o no asignado' });
    }

    // Insertar insumos
    const insertPromises = insumos.map(insumo =>
      query(
        'INSERT INTO insumos_utilizados (reclamo_id, material, cantidad, fecha) VALUES ($1, $2, $3, NOW())',
        [req.params.id, insumo.material, insumo.cantidad]
      )
    );

    await Promise.all(insertPromises);

    res.json({ message: 'Insumos registrados exitosamente' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al registrar insumos' });
  }
});

export default router;
