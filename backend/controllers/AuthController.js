import Usuario from '../models/Usuario.js';
import { compararPassword } from '../utils/crypto.js';
import { generarToken } from '../utils/jwt.js';
import { respuestaExitosa, respuestaError, respuestaNoAutorizado } from '../utils/respuestas.js';

class AuthController {
  /**
   * POST /api/auth/login
   * Iniciar sesión
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validar campos requeridos
      if (!email || !password) {
        return respuestaError(res, 'Email y contraseña son requeridos', 400);
      }

      // Buscar usuario por email
      const usuario = await Usuario.buscarPorEmail(email);

      if (!usuario) {
        return respuestaNoAutorizado(res, 'Credenciales inválidas');
      }

      // Verificar que el usuario esté activo
      if (!usuario.activo) {
        return respuestaNoAutorizado(res, 'Usuario inactivo');
      }

      // Verificar contraseña
      const passwordValido = await compararPassword(password, usuario.hash_pass);

      if (!passwordValido) {
        return respuestaNoAutorizado(res, 'Credenciales inválidas');
      }

      // Obtener roles del usuario
      const roles = await Usuario.obtenerRoles(usuario.usuario_id);
      const nombresRoles = roles.map(r => r.nombre);

      // Actualizar último login
      await Usuario.actualizarUltimoLogin(usuario.usuario_id);

      // Generar token JWT
      const token = generarToken({
        usuario_id: usuario.usuario_id,
        email: usuario.email,
        socio_id: usuario.socio_id,
        empleado_id: usuario.empleado_id,
        roles: nombresRoles
      });

      // Preparar datos del usuario
      const datosUsuario = {
        usuario_id: usuario.usuario_id,
        email: usuario.email,
        socio_id: usuario.socio_id,
        empleado_id: usuario.empleado_id,
        roles: nombresRoles
      };

      // Si es socio, agregar nombre y apellido del socio
      if (usuario.socio_id && usuario.socio_nombre) {
        datosUsuario.nombre = usuario.socio_nombre;
        datosUsuario.apellido = usuario.socio_apellido;
      }

      // Si es empleado, agregar nombre y apellido del empleado
      if (usuario.empleado_id && usuario.empleado_nombre) {
        datosUsuario.nombre = usuario.empleado_nombre;
        datosUsuario.apellido = usuario.empleado_apellido;
      }

      // Preparar respuesta
      const respuesta = {
        token,
        usuario: datosUsuario
      };

      return respuestaExitosa(res, respuesta, 'Login exitoso');
    } catch (error) {
      console.error('Error en login:', error);
      return respuestaError(res, 'Error al iniciar sesión', 500, error.message);
    }
  }

  /**
   * GET /api/auth/perfil
   * Obtener perfil del usuario autenticado
   */
  static async obtenerPerfil(req, res) {
    try {
      const usuario = await Usuario.buscarPorId(req.usuario.usuario_id);

      if (!usuario) {
        return respuestaError(res, 'Usuario no encontrado', 404);
      }

      // Obtener roles
      const roles = await Usuario.obtenerRoles(usuario.usuario_id);

      const perfil = {
        usuario_id: usuario.usuario_id,
        email: usuario.email,
        socio_id: usuario.socio_id,
        empleado_id: usuario.empleado_id,
        activo: usuario.activo,
        ultimo_login: usuario.ultimo_login,
        roles: roles.map(r => ({
          rol_id: r.rol_id,
          nombre: r.nombre,
          descripcion: r.descripcion
        }))
      };

      // Si es socio, agregar información del socio
      if (usuario.socio_id) {
        perfil.socio = {
          nombre: usuario.socio_nombre,
          apellido: usuario.socio_apellido,
          dni: usuario.socio_dni
        };
      }

      // Si es empleado, agregar información del empleado
      if (usuario.empleado_id) {
        perfil.empleado = {
          nombre: usuario.empleado_nombre,
          apellido: usuario.empleado_apellido,
          legajo: usuario.empleado_legajo
        };
      }

      return respuestaExitosa(res, perfil, 'Perfil obtenido exitosamente');
    } catch (error) {
      console.error('Error al obtener perfil:', error);
      return respuestaError(res, 'Error al obtener perfil', 500, error.message);
    }
  }

  /**
   * POST /api/auth/verificar
   * Verificar si el token es válido y obtener datos completos del usuario
   */
  static async verificarToken(req, res) {
    try {
      // Si llegamos aquí, el token es válido (pasó por el middleware)
      const usuario = await Usuario.buscarPorId(req.usuario.usuario_id);
      
      if (!usuario) {
        return respuestaError(res, 'Usuario no encontrado', 404);
      }

      // Preparar datos del usuario
      const datosUsuario = {
        usuario_id: usuario.usuario_id,
        email: usuario.email,
        socio_id: usuario.socio_id,
        empleado_id: usuario.empleado_id,
        roles: req.usuario.roles
      };

      // Si es socio, agregar nombre y apellido del socio
      if (usuario.socio_id && usuario.socio_nombre) {
        datosUsuario.nombre = usuario.socio_nombre;
        datosUsuario.apellido = usuario.socio_apellido;
      }

      // Si es empleado, agregar nombre y apellido del empleado
      if (usuario.empleado_id && usuario.empleado_nombre) {
        datosUsuario.nombre = usuario.empleado_nombre;
        datosUsuario.apellido = usuario.empleado_apellido;
      }

      return respuestaExitosa(res, { valido: true, usuario: datosUsuario }, 'Token válido');
    } catch (error) {
      console.error('Error al verificar token:', error);
      return respuestaError(res, 'Error al verificar token', 500, error.message);
    }
  }
}

export default AuthController;
