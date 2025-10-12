import express from 'express';
import { query } from '../db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    // Buscar usuario y sus roles
    const queryText = `
      SELECT u.usuario_id, u.email, u.hash_pass, u.socio_id, u.empleado_id, u.activo,
             array_agg(r.nombre) as roles
      FROM usuario u
      LEFT JOIN usuario_rol ur ON u.usuario_id = ur.usuario_id
      LEFT JOIN rol r ON ur.rol_id = r.rol_id
      WHERE u.email = $1 AND u.activo = true
      GROUP BY u.usuario_id
    `;

    const result = await query(queryText, [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const usuario = result.rows[0];

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, usuario.hash_pass);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar token
    const token = jwt.sign(
      { 
        usuario_id: usuario.usuario_id, 
        email: usuario.email, 
        roles: usuario.roles,
        socio_id: usuario.socio_id,
        empleado_id: usuario.empleado_id
      },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '24h' }
    );

    res.json({
      mensaje: 'Login exitoso',
      token,
      usuario: {
        usuario_id: usuario.usuario_id,
        email: usuario.email,
        roles: usuario.roles,
        socio_id: usuario.socio_id,
        empleado_id: usuario.empleado_id
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Registro de cliente
router.post('/register', async (req, res) => {
  try {
    const { email, password, nombre, apellido, dni, telefono, direccion } = req.body;

    if (!email || !password || !nombre || !apellido || !dni) {
      return res.status(400).json({ error: 'Campos requeridos faltantes' });
    }

    // Verificar si el email ya existe
    const existingUser = await query('SELECT * FROM clientes WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar nuevo cliente
    const result = await query(
      `INSERT INTO clientes (email, password, nombre, apellido, dni, telefono, direccion, activo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       RETURNING id, email, nombre, apellido, dni`,
      [email, hashedPassword, nombre, apellido, dni, telefono, direccion]
    );

    res.status(201).json({
      message: 'Cliente registrado exitosamente',
      cliente: result.rows[0]
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Middleware de autenticación
export const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

export default router;
