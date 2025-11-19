import { describe, it, expect, beforeEach, vi } from 'vitest';
import authService from '../../services/authService';
import apiClient from '../../services/api';

// Mock del apiClient
vi.mock('../../services/api', () => {
  const mockApiClient = {
    getToken: vi.fn(),
    setToken: vi.fn(),
    removeToken: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
  };
  return {
    default: mockApiClient,
  };
});

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('debería hacer login exitoso y guardar token', async () => {
      const mockResponse = {
        exito: true,
        datos: {
          token: 'mock-jwt-token-123',
          usuario: {
            usuario_id: 1,
            email: 'test@test.com',
          },
        },
      };

      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await authService.login('test@test.com', 'password123');

      expect(apiClient.post).toHaveBeenCalledWith(
        '/auth/login',
        { email: 'test@test.com', password: 'password123' },
        { auth: false }
      );
      expect(apiClient.setToken).toHaveBeenCalledWith('mock-jwt-token-123');
      expect(result).toEqual(mockResponse.datos);
    });

    it('debería no guardar token si no viene en la respuesta', async () => {
      const mockResponse = {
        exito: true,
        datos: {
          usuario: { usuario_id: 1 },
        },
      };

      apiClient.post.mockResolvedValueOnce(mockResponse);

      await authService.login('test@test.com', 'password123');

      expect(apiClient.setToken).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('debería eliminar el token', () => {
      authService.logout();
      expect(apiClient.removeToken).toHaveBeenCalled();
    });
  });

  describe('obtenerPerfil', () => {
    it('debería obtener el perfil del usuario', async () => {
      const mockResponse = {
        exito: true,
        datos: {
          usuario_id: 1,
          email: 'test@test.com',
          roles: ['SOCIO'],
        },
      };

      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await authService.obtenerPerfil();

      expect(apiClient.get).toHaveBeenCalledWith('/auth/perfil');
      expect(result).toEqual(mockResponse.datos);
    });
  });

  describe('verificarToken', () => {
    it('debería retornar datos cuando el token es válido', async () => {
      const mockResponse = {
        exito: true,
        datos: { valido: true },
      };

      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await authService.verificarToken();

      expect(apiClient.post).toHaveBeenCalledWith('/auth/verificar');
      expect(result).toEqual(mockResponse.datos);
    });

    it('debería retornar null cuando el token es inválido', async () => {
      apiClient.post.mockRejectedValueOnce(new Error('Token inválido'));

      const result = await authService.verificarToken();

      expect(result).toBeNull();
    });
  });

  describe('estaAutenticado', () => {
    it('debería retornar true cuando hay token', () => {
      apiClient.getToken.mockReturnValueOnce('test-token');
      expect(authService.estaAutenticado()).toBe(true);
    });

    it('debería retornar false cuando no hay token', () => {
      apiClient.getToken.mockReturnValueOnce(null);
      expect(authService.estaAutenticado()).toBe(false);
    });
  });
});

