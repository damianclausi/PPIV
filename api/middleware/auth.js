import { verificarToken } from '../utils/jwt.js';
import { respuestaNoAutorizado } from '../utils/respuestas.js';
import Usuario from '../models/Usuario.js';

/**
 * Middleware para verificar autenticación JWT
 */
export const autenticar = async (req, res, next) => {
  try {
    // Obtener token del header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return respuestaNoAutorizado(res, 'Token no proporcionado');
    }

    // Verificar token
    const payload = verificarToken(token);

    if (!payload) {
      return respuestaNoAutorizado(res, 'Token inválido o expirado');
    }

    // Verificar que el usuario existe y está activo
    const usuario = await Usuario.buscarPorId(payload.usuario_id);

    if (!usuario || !usuario.activo) {
      return respuestaNoAutorizado(res, 'Usuario no encontrado o inactivo');
    }

    // Adjuntar información del usuario al request
    req.usuario = {
      usuario_id: usuario.usuario_id,
      email: usuario.email,
      socio_id: usuario.socio_id,
      empleado_id: usuario.empleado_id,
      roles: payload.roles || []
    };

    next();
  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    return respuestaNoAutorizado(res, 'Error de autenticación');
  }
};

/**
 * Middleware para verificar roles específicos
 */
export const requiereRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return respuestaNoAutorizado(res, 'Usuario no autenticado');
    }

    const tieneRol = req.usuario.roles.some(rol => 
      rolesPermitidos.includes(rol)
    );

    if (!tieneRol) {
      return res.status(403).json({
        exito: false,
        mensaje: 'No tienes permisos para acceder a este recurso'
      });
    }

    next();
  };
};

/**
 * Middleware para verificar que es un socio
 */
export const esSocio = (req, res, next) => {
  if (!req.usuario || !req.usuario.socio_id) {
    return res.status(403).json({
      exito: false,
      mensaje: 'Solo los socios pueden acceder a este recurso'
    });
  }
  next();
};

/**
 * Middleware para verificar que es un empleado
 */
export const esEmpleado = (req, res, next) => {
  if (!req.usuario || !req.usuario.empleado_id) {
    return res.status(403).json({
      exito: false,
      mensaje: 'Solo los empleados pueden acceder a este recurso'
    });
  }
  next();
};

/**
 * Middleware para verificar que es un operario (OPERARIO o TECNICO)
 */
export const esOperario = (req, res, next) => {
  if (!req.usuario || !req.usuario.empleado_id) {
    return res.status(403).json({
      exito: false,
      mensaje: 'Solo los operarios pueden acceder a este recurso'
    });
  }

  const esOperario = req.usuario.roles.includes('OPERARIO');

  if (!esOperario) {
    return res.status(403).json({
      exito: false,
      mensaje: 'Solo los operarios pueden acceder a este recurso'
    });
  }

  next();
};

/**
 * Middleware para verificar que es un administrador
 */
export const esAdmin = (req, res, next) => {
  if (!req.usuario || !req.usuario.empleado_id) {
    return res.status(403).json({
      exito: false,
      mensaje: 'Solo los administradores pueden acceder a este recurso'
    });
  }

  const esAdmin = req.usuario.roles.includes('ADMIN');

  if (!esAdmin) {
    return res.status(403).json({
      exito: false,
      mensaje: 'Solo los administradores pueden acceder a este recurso'
    });
  }

  next();
};
