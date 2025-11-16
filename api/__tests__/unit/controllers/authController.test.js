import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createMockRequest, createMockResponse } from '../../setup/testHelpers.js';

// Mock de modelos y utilidades
const mockBuscarPorEmail = jest.fn();
const mockBuscarPorId = jest.fn();
const mockObtenerRoles = jest.fn();
const mockActualizarUltimoLogin = jest.fn();
const mockCompararPassword = jest.fn();
const mockGenerarToken = jest.fn();

jest.unstable_mockModule('../../../_lib/models/Usuario.js', () => ({
  __esModule: true,
  default: {
    buscarPorEmail: mockBuscarPorEmail,
    buscarPorId: mockBuscarPorId,
    obtenerRoles: mockObtenerRoles,
    actualizarUltimoLogin: mockActualizarUltimoLogin
  }
}));

jest.unstable_mockModule('../../../_lib/utils/crypto.js', () => ({
  compararPassword: mockCompararPassword
}));

jest.unstable_mockModule('../../../_lib/utils/jwt.js', () => ({
  generarToken: mockGenerarToken
}));

const { default: AuthController } = await import('../../../_lib/controllers/AuthController.js');

describe('AuthController', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = createMockRequest();
    res = createMockResponse();
    console.error = jest.fn();
  });

  describe('login', () => {
    it('debería hacer login exitoso para un cliente', async () => {
      const usuario = {
        usuario_id: 1,
        email: 'cliente@test.com',
        hash_pass: 'hashed_password',
        activo: true,
        socio_id: 1,
        empleado_id: null,
        socio_nombre: 'Juan',
        socio_apellido: 'Pérez',
        socio_activo: true
      };
      const roles = [{ rol_id: 1, nombre: 'CLIENTE' }];
      const token = 'jwt_token_123';

      mockBuscarPorEmail.mockResolvedValueOnce(usuario);
      mockCompararPassword.mockResolvedValueOnce(true);
      mockObtenerRoles.mockResolvedValueOnce(roles);
      mockActualizarUltimoLogin.mockResolvedValueOnce();
      mockGenerarToken.mockReturnValueOnce(token);

      req.body = { email: 'cliente@test.com', password: 'password123' };

      await AuthController.login(req, res);

      expect(mockBuscarPorEmail).toHaveBeenCalledWith('cliente@test.com');
      expect(mockCompararPassword).toHaveBeenCalledWith('password123', 'hashed_password');
      expect(mockObtenerRoles).toHaveBeenCalledWith(1);
      expect(mockGenerarToken).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          exito: true,
          datos: expect.objectContaining({
            token,
            usuario: expect.objectContaining({
              usuario_id: 1,
              nombre: 'Juan',
              apellido: 'Pérez',
              roles: ['CLIENTE']
            })
          })
        })
      );
    });

    it('debería hacer login exitoso para un operario', async () => {
      const usuario = {
        usuario_id: 2,
        email: 'operario@test.com',
        hash_pass: 'hashed_password',
        activo: true,
        socio_id: null,
        empleado_id: 5,
        empleado_nombre: 'Pedro',
        empleado_apellido: 'García'
      };
      const roles = [{ rol_id: 2, nombre: 'OPERARIO' }];
      const token = 'jwt_token_456';

      mockBuscarPorEmail.mockResolvedValueOnce(usuario);
      mockCompararPassword.mockResolvedValueOnce(true);
      mockObtenerRoles.mockResolvedValueOnce(roles);
      mockActualizarUltimoLogin.mockResolvedValueOnce();
      mockGenerarToken.mockReturnValueOnce(token);

      req.body = { email: 'operario@test.com', password: 'password123' };

      await AuthController.login(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          datos: expect.objectContaining({
            usuario: expect.objectContaining({
              nombre: 'Pedro',
              apellido: 'García',
              roles: ['OPERARIO']
            })
          })
        })
      );
    });

    it('debería rechazar login sin email o password', async () => {
      req.body = { email: 'test@test.com' };

      await AuthController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          exito: false,
          mensaje: 'Email y contraseña son requeridos'
        })
      );
      expect(mockBuscarPorEmail).not.toHaveBeenCalled();
    });

    it('debería rechazar login con credenciales inválidas (usuario no existe)', async () => {
      mockBuscarPorEmail.mockResolvedValueOnce(null);

      req.body = { email: 'noexiste@test.com', password: 'password123' };

      await AuthController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          exito: false,
          mensaje: 'Credenciales inválidas'
        })
      );
    });

    it('debería rechazar login con usuario inactivo', async () => {
      const usuario = {
        usuario_id: 1,
        email: 'test@test.com',
        hash_pass: 'hashed_password',
        activo: false
      };

      mockBuscarPorEmail.mockResolvedValueOnce(usuario);

      req.body = { email: 'test@test.com', password: 'password123' };

      await AuthController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          mensaje: 'Usuario inactivo'
        })
      );
    });

    it('debería rechazar login con socio inactivo', async () => {
      const usuario = {
        usuario_id: 1,
        email: 'test@test.com',
        hash_pass: 'hashed_password',
        activo: true,
        socio_id: 1,
        socio_activo: false
      };

      mockBuscarPorEmail.mockResolvedValueOnce(usuario);

      req.body = { email: 'test@test.com', password: 'password123' };

      await AuthController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          mensaje: 'Socio inactivo. Contacte con la cooperativa.'
        })
      );
    });

    it('debería rechazar login con password incorrecto', async () => {
      const usuario = {
        usuario_id: 1,
        email: 'test@test.com',
        hash_pass: 'hashed_password',
        activo: true,
        socio_id: 1,
        socio_activo: true
      };

      mockBuscarPorEmail.mockResolvedValueOnce(usuario);
      mockCompararPassword.mockResolvedValueOnce(false);

      req.body = { email: 'test@test.com', password: 'password_incorrecto' };

      await AuthController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          mensaje: 'Credenciales inválidas'
        })
      );
    });

    it('debería manejar errores de base de datos', async () => {
      const error = new Error('Database error');
      mockBuscarPorEmail.mockRejectedValueOnce(error);

      req.body = { email: 'test@test.com', password: 'password123' };

      await AuthController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          exito: false,
          mensaje: 'Error al iniciar sesión'
        })
      );
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('obtenerPerfil', () => {
    it('debería retornar el perfil del usuario autenticado', async () => {
      const usuario = {
        usuario_id: 1,
        email: 'test@test.com',
        activo: true,
        socio_id: 1,
        empleado_id: null,
        socio_nombre: 'Juan',
        socio_apellido: 'Pérez',
        socio_dni: '12345678',
        ultimo_login: new Date()
      };
      const roles = [
        { rol_id: 1, nombre: 'CLIENTE', descripcion: 'Cliente del sistema' }
      ];

      req.usuario = { usuario_id: 1 };
      mockBuscarPorId.mockResolvedValueOnce(usuario);
      mockObtenerRoles.mockResolvedValueOnce(roles);

      await AuthController.obtenerPerfil(req, res);

      expect(mockBuscarPorId).toHaveBeenCalledWith(1);
      expect(mockObtenerRoles).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          exito: true,
          datos: expect.objectContaining({
            usuario_id: 1,
            socio: expect.objectContaining({
              nombre: 'Juan',
              apellido: 'Pérez'
            }),
            roles: expect.arrayContaining([
              expect.objectContaining({ nombre: 'CLIENTE' })
            ])
          })
        })
      );
    });

    it('debería retornar error si el usuario no existe', async () => {
      req.usuario = { usuario_id: 999 };
      mockBuscarPorId.mockResolvedValueOnce(null);

      await AuthController.obtenerPerfil(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          exito: false,
          mensaje: 'Usuario no encontrado'
        })
      );
    });

    it('debería incluir información de empleado si es empleado', async () => {
      const usuario = {
        usuario_id: 2,
        email: 'operario@test.com',
        activo: true,
        socio_id: null,
        empleado_id: 5,
        empleado_nombre: 'Pedro',
        empleado_apellido: 'García',
        empleado_legajo: 'LEG001',
        ultimo_login: new Date()
      };
      const roles = [{ rol_id: 2, nombre: 'OPERARIO', descripcion: 'Operario técnico' }];

      req.usuario = { usuario_id: 2 };
      mockBuscarPorId.mockResolvedValueOnce(usuario);
      mockObtenerRoles.mockResolvedValueOnce(roles);

      await AuthController.obtenerPerfil(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          datos: expect.objectContaining({
            empleado: expect.objectContaining({
              nombre: 'Pedro',
              apellido: 'García',
              legajo: 'LEG001'
            })
          })
        })
      );
    });
  });

  describe('verificarToken', () => {
    it('debería verificar token válido y retornar datos del usuario', async () => {
      const usuario = {
        usuario_id: 1,
        email: 'test@test.com',
        socio_id: 1,
        empleado_id: null,
        socio_nombre: 'Juan',
        socio_apellido: 'Pérez'
      };

      req.usuario = { usuario_id: 1, roles: ['CLIENTE'] };
      mockBuscarPorId.mockResolvedValueOnce(usuario);

      await AuthController.verificarToken(req, res);

      expect(mockBuscarPorId).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          exito: true,
          datos: expect.objectContaining({
            valido: true,
            usuario: expect.objectContaining({
              usuario_id: 1,
              nombre: 'Juan',
              apellido: 'Pérez',
              roles: ['CLIENTE']
            })
          })
        })
      );
    });

    it('debería retornar error si el usuario no existe', async () => {
      req.usuario = { usuario_id: 999, roles: ['CLIENTE'] };
      mockBuscarPorId.mockResolvedValueOnce(null);

      await AuthController.verificarToken(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          exito: false,
          mensaje: 'Usuario no encontrado'
        })
      );
    });

    it('debería manejar errores correctamente', async () => {
      const error = new Error('Database error');
      req.usuario = { usuario_id: 1, roles: ['CLIENTE'] };
      mockBuscarPorId.mockRejectedValueOnce(error);

      await AuthController.verificarToken(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(console.error).toHaveBeenCalled();
    });
  });
});

