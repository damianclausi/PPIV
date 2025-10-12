import express from 'express';
import { query } from '../db.js';
import { authMiddleware } from './auth.js';

const router = express.Router();

// Listar facturas del cliente
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { estado, desde, hasta } = req.query;
    
    let queryText = `
      SELECT f.*, s.numero_servicio, s.direccion
      FROM facturas f
      JOIN servicios s ON f.servicio_id = s.id
      WHERE s.cliente_id = $1
    `;
    
    const params = [req.user.id];
    let paramCount = 1;

    if (estado) {
      paramCount++;
      queryText += ` AND f.estado = $${paramCount}`;
      params.push(estado);
    }

    if (desde) {
      paramCount++;
      queryText += ` AND f.fecha_emision >= $${paramCount}`;
      params.push(desde);
    }

    if (hasta) {
      paramCount++;
      queryText += ` AND f.fecha_emision <= $${paramCount}`;
      params.push(hasta);
    }

    queryText += ' ORDER BY f.fecha_emision DESC';

    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener facturas' });
  }
});

// Obtener detalle de factura
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      `SELECT f.*, s.numero_servicio, s.direccion, s.tipo_servicio
       FROM facturas f
       JOIN servicios s ON f.servicio_id = s.id
       WHERE f.id = $1 AND s.cliente_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener factura' });
  }
});

// Registrar pago de factura
router.post('/:id/pagar', authMiddleware, async (req, res) => {
  try {
    const { metodo_pago, comprobante } = req.body;

    // Verificar que la factura existe y pertenece al cliente
    const factura = await query(
      `SELECT f.* FROM facturas f
       JOIN servicios s ON f.servicio_id = s.id
       WHERE f.id = $1 AND s.cliente_id = $2 AND f.estado = 'pendiente'`,
      [req.params.id, req.user.id]
    );

    if (factura.rows.length === 0) {
      return res.status(404).json({ error: 'Factura no encontrada o ya pagada' });
    }

    // Registrar el pago
    const result = await query(
      `INSERT INTO pagos (factura_id, monto, fecha_pago, metodo_pago, comprobante)
       VALUES ($1, $2, NOW(), $3, $4)
       RETURNING *`,
      [req.params.id, factura.rows[0].monto, metodo_pago, comprobante]
    );

    // Actualizar estado de la factura
    await query(
      'UPDATE facturas SET estado = $1 WHERE id = $2',
      ['pagada', req.params.id]
    );

    res.json({
      message: 'Pago registrado exitosamente',
      pago: result.rows[0]
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al procesar pago' });
  }
});

export default router;
