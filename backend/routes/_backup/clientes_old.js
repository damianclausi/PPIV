import express from 'express';
import pool from '../db.js';
import { authMiddleware } from './auth.js';

const router = express.Router();

// GET /api/clientes/perfil - Obtener perfil del cliente
router.get('/perfil', async (req, res) => {
  try {
    const usuarioId = req.query.usuario_id || 2; // En producción vendría del token JWT
    
    const resultado = await pool.query(`
      SELECT 
        u.usuario_id,
        u.email,
        s.socio_id,
        s.nombre,
        s.apellido,
        s.dni,
        s.email as email_socio,
        s.telefono,
        s.activo,
        s.fecha_alta
      FROM usuario u
      INNER JOIN socio s ON u.socio_id = s.socio_id
      WHERE u.usuario_id = $1 AND u.activo = true
    `, [usuarioId]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json(resultado.rows[0]);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error al obtener perfil del cliente' });
  }
});

// Obtener cuentas (servicios) del cliente
router.get('/cuentas', authMiddleware, async (req, res) => {
  try {
    const socioId = req.user.socio_id;
    
    if (!socioId) {
      return res.status(403).json({ error: 'Usuario no es un socio' });
    }

    const resultado = await pool.query(`
      SELECT 
        c.cuenta_id,
        c.numero_cuenta,
        c.direccion,
        c.localidad,
        c.principal,
        c.activa,
        s.nombre as servicio_nombre,
        s.descripcion as servicio_descripcion
      FROM cuenta c
      JOIN servicio s ON c.servicio_id = s.servicio_id
      WHERE c.socio_id = $1
      ORDER BY c.principal DESC, c.cuenta_id
    `, [socioId]);

    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al obtener cuentas:', error);
    res.status(500).json({ error: 'Error al obtener cuentas' });
  }
});

// GET /api/clientes/facturas - Obtener facturas del cliente
router.get('/facturas', async (req, res) => {
  try {
    const usuarioId = req.query.usuario_id || 2;
    const estado = req.query.estado; // 'pagada', 'pendiente', 'vencida'
    const limite = parseInt(req.query.limite) || 10;
    const offset = parseInt(req.query.offset) || 0;

    let query = `
      SELECT 
        f.factura_id,
        f.cuenta_id,
        f.periodo,
        f.importe,
        f.vencimiento,
        f.estado,
        f.numero_externo,
        c.numero_cuenta,
        c.direccion,
        s.nombre as nombre_servicio
      FROM factura f
      INNER JOIN cuenta c ON f.cuenta_id = c.cuenta_id
      INNER JOIN servicio s ON c.servicio_id = s.servicio_id
      INNER JOIN usuario u ON c.socio_id = u.socio_id
      WHERE u.usuario_id = $1
    `;

    const params = [usuarioId];

    if (estado) {
      query += ` AND f.estado = $${params.length + 1}`;
      params.push(estado);
    }

    query += ` ORDER BY f.periodo DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limite, offset);

    const resultado = await pool.query(query, params);
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al obtener facturas:', error);
    res.status(500).json({ error: 'Error al obtener facturas' });
  }
});

// GET /api/clientes/reclamos - Obtener reclamos del cliente
router.get('/reclamos', async (req, res) => {
  try {
    const usuarioId = req.query.usuario_id || 2;
    const estado = req.query.estado;
    const limite = parseInt(req.query.limite) || 20;
    const offset = parseInt(req.query.offset) || 0;

    let query = `
      SELECT 
        r.reclamo_id,
        r.cuenta_id,
        r.tipo_id,
        r.descripcion,
        r.estado,
        r.prioridad_id,
        r.fecha_alta,
        r.fecha_cierre,
        r.canal,
        tr.nombre as tipo_reclamo,
        p.nombre as prioridad,
        c.numero_cuenta,
        c.direccion
      FROM reclamo r
      INNER JOIN tipo_reclamo tr ON r.tipo_id = tr.tipo_id
      INNER JOIN prioridad p ON r.prioridad_id = p.prioridad_id
      INNER JOIN cuenta c ON r.cuenta_id = c.cuenta_id
      INNER JOIN usuario u ON c.socio_id = u.socio_id
      WHERE u.usuario_id = $1
    `;

    const params = [usuarioId];

    if (estado) {
      query += ` AND r.estado = $${params.length + 1}`;
      params.push(estado);
    }

    query += ` ORDER BY r.fecha_alta DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limite, offset);

    const resultado = await pool.query(query, params);
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al obtener reclamos:', error);
    res.status(500).json({ error: 'Error al obtener reclamos' });
  }
});

// POST /api/clientes/reclamos - Crear nuevo reclamo
router.post('/reclamos', async (req, res) => {
  try {
    const { usuario_id, cuenta_id, tipo_id, descripcion, prioridad_id = 2 } = req.body;

    // Verificar que la cuenta pertenezca al usuario
    const verificacion = await pool.query(`
      SELECT c.cuenta_id 
      FROM cuenta c
      INNER JOIN usuario u ON c.socio_id = u.socio_id
      WHERE u.usuario_id = $1 AND c.cuenta_id = $2
    `, [usuario_id, cuenta_id]);

    if (verificacion.rows.length === 0) {
      return res.status(403).json({ error: 'No autorizado para crear reclamo en esta cuenta' });
    }

    const resultado = await pool.query(`
      INSERT INTO reclamo (
        cuenta_id, tipo_id, descripcion, estado, prioridad_id, fecha_alta
      ) VALUES ($1, $2, $3, 'PENDIENTE', $4, NOW())
      RETURNING *
    `, [cuenta_id, tipo_id, descripcion, prioridad_id]);

    res.status(201).json({
      mensaje: 'Reclamo creado exitosamente',
      reclamo: resultado.rows[0]
    });
  } catch (error) {
    console.error('Error al crear reclamo:', error);
    res.status(500).json({ error: 'Error al crear reclamo' });
  }
});

// Dashboard del cliente
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const socioId = req.user.socio_id;
    
    if (!socioId) {
      return res.status(403).json({ error: 'Usuario no es un socio' });
    }

    // Cuentas activas
    const cuentas = await pool.query(
      'SELECT COUNT(*) as total FROM cuenta WHERE socio_id = $1 AND activa = true',
      [socioId]
    );

    // Facturas pendientes
    const facturasPendientes = await pool.query(`
      SELECT COUNT(*) as total, SUM(f.monto_total) as monto_total
      FROM factura f
      JOIN cuenta c ON f.cuenta_id = c.cuenta_id
      WHERE c.socio_id = $1 AND f.pagada = false
    `, [socioId]);

    // Reclamos activos
    const reclamosActivos = await pool.query(`
      SELECT COUNT(*) as total
      FROM reclamo r
      JOIN cuenta c ON r.cuenta_id = c.cuenta_id
      WHERE c.socio_id = $1 AND r.estado != 'RESUELTO'
    `, [socioId]);

    // Últimos pagos
    const ultimosPagos = await pool.query(`
      SELECT 
        p.pago_id,
        p.monto,
        p.fecha_pago,
        p.metodo_pago,
        f.numero_factura,
        c.numero_cuenta
      FROM pago p
      JOIN factura f ON p.factura_id = f.factura_id
      JOIN cuenta c ON f.cuenta_id = c.cuenta_id
      WHERE c.socio_id = $1
      ORDER BY p.fecha_pago DESC
      LIMIT 5
    `, [socioId]);

    res.json({
      cuentas_activas: parseInt(cuentas.rows[0].total),
      facturas_pendientes: {
        cantidad: parseInt(facturasPendientes.rows[0].total) || 0,
        monto_total: parseFloat(facturasPendientes.rows[0].monto_total) || 0
      },
      reclamos_activos: parseInt(reclamosActivos.rows[0].total),
      ultimos_pagos: ultimosPagos.rows
    });
  } catch (error) {
    console.error('Error al obtener dashboard:', error);
    res.status(500).json({ error: 'Error al obtener dashboard' });
  }
});

export default router;
