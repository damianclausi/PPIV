import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { 
  requiereRol, 
  esSocio, 
  esEmpleado, 
  esOperario, 
  esAdmin 
} from '../../../_lib/middleware/auth.js';
import { generarToken, verificarToken } from '../../../_lib/utils/jwt.js';
import { createMockRequest, createMockResponse } from '../../setup/testHelpers.js';
import Usuario from '../../../_lib/models/Usuario.js';

// Mock del modelo Usuario
jest.mock('../../../_lib/models/Usuario.js', () => ({
  __esModule: true,
  default: {
    buscarPorId: jest.fn()
  }
}));

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    // Resetear mocks
    jest.clearAllMocks();
    
    // Crear mocks
    req = createMockRequest();
    res = createMockResponse();
    next = jest.fn();
  });

  // Nota: Los tests de autenticar requieren integración con la base de datos
  // Se probarán en tests de integración

  describe('requiereRol', () => {
    it('debería permitir acceso con rol válido', () => {
      req.usuario = {
        usuario_id: 1,
        roles: ['admin', 'operario']
      };

      const middleware = requiereRol('admin', 'cliente');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('debería rechazar acceso sin rol válido', () => {
      req.usuario = {
        usuario_id: 1,
        roles: ['cliente']
      };

      const middleware = requiereRol('admin');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('debería rechazar acceso sin usuario autenticado', () => {
      req.usuario = null;

      const middleware = requiereRol('admin');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('esSocio', () => {
    it('debería permitir acceso a socio', () => {
      req.usuario = {
        usuario_id: 1,
        socio_id: 1
      };

      esSocio(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('debería rechazar acceso sin socio_id', () => {
      req.usuario = {
        usuario_id: 1,
        socio_id: null
      };

      esSocio(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('debería rechazar acceso sin usuario', () => {
      req.usuario = null;

      esSocio(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('esEmpleado', () => {
    it('debería permitir acceso a empleado', () => {
      req.usuario = {
        usuario_id: 1,
        empleado_id: 1
      };

      esEmpleado(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('debería rechazar acceso sin empleado_id', () => {
      req.usuario = {
        usuario_id: 1,
        empleado_id: null
      };

      esEmpleado(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('esOperario', () => {
    it('debería permitir acceso a operario', () => {
      req.usuario = {
        usuario_id: 1,
        empleado_id: 1,
        roles: ['OPERARIO']
      };

      esOperario(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('debería rechazar acceso sin rol OPERARIO', () => {
      req.usuario = {
        usuario_id: 1,
        empleado_id: 1,
        roles: ['ADMIN']
      };

      esOperario(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('debería rechazar acceso sin empleado_id', () => {
      req.usuario = {
        usuario_id: 1,
        empleado_id: null,
        roles: ['OPERARIO']
      };

      esOperario(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('esAdmin', () => {
    it('debería permitir acceso a administrador', () => {
      req.usuario = {
        usuario_id: 1,
        empleado_id: 1,
        roles: ['ADMIN']
      };

      esAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('debería rechazar acceso sin rol ADMIN', () => {
      req.usuario = {
        usuario_id: 1,
        empleado_id: 1,
        roles: ['OPERARIO']
      };

      esAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('debería rechazar acceso sin empleado_id', () => {
      req.usuario = {
        usuario_id: 1,
        empleado_id: null,
        roles: ['ADMIN']
      };

      esAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });
});

