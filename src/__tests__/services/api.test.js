import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApiClient } from '../../services/api';

describe('ApiClient', () => {
  let apiClient;
  let mockFetch;

  beforeEach(() => {
    apiClient = new ApiClient();
    // Mock de fetch
    mockFetch = vi.fn();
    global.fetch = mockFetch;
    // Resetear mocks de localStorage
    if (localStorage.getItem) {
      vi.mocked(localStorage.getItem).mockClear();
    }
    if (localStorage.setItem) {
      vi.mocked(localStorage.setItem).mockClear();
    }
    if (localStorage.removeItem) {
      vi.mocked(localStorage.removeItem).mockClear();
    }
  });

  describe('Gestión de tokens', () => {
    it('debería guardar y obtener token del localStorage', () => {
      const token = 'test-token-123';
      localStorage.getItem.mockReturnValue(token);
      apiClient.setToken(token);
      expect(apiClient.getToken()).toBe(token);
      expect(localStorage.setItem).toHaveBeenCalledWith('token', token);
    });

    it('debería eliminar token del localStorage', () => {
      localStorage.getItem.mockReturnValue('test-token');
      apiClient.setToken('test-token');
      localStorage.getItem.mockReturnValue(null);
      apiClient.removeToken();
      expect(apiClient.getToken()).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
    });

    it('debería retornar null si no hay token', () => {
      localStorage.getItem.mockReturnValue(null);
      expect(apiClient.getToken()).toBeNull();
    });
  });

  describe('getHeaders', () => {
    it('debería incluir Authorization header cuando hay token', () => {
      localStorage.getItem.mockReturnValue('test-token');
      const headers = apiClient.getHeaders();
      expect(headers['Authorization']).toBe('Bearer test-token');
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('debería no incluir Authorization header cuando includeAuth es false', () => {
      localStorage.getItem.mockReturnValue('test-token');
      const headers = apiClient.getHeaders(false);
      expect(headers['Authorization']).toBeUndefined();
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('debería no incluir Authorization header cuando no hay token', () => {
      localStorage.getItem.mockReturnValue(null);
      const headers = apiClient.getHeaders();
      expect(headers['Authorization']).toBeUndefined();
      expect(headers['Content-Type']).toBe('application/json');
    });
  });

  describe('request', () => {
    it('debería realizar petición GET exitosa', async () => {
      const mockResponse = {
        exito: true,
        datos: { id: 1 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiClient.request('/test');

      expect(mockFetch).toHaveBeenCalled();
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toContain('/test');
      expect(callArgs[1]).toMatchObject({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      });
      expect(result).toEqual(mockResponse);
    });

    it('debería incluir token en headers cuando está disponible', async () => {
      localStorage.getItem.mockReturnValue('test-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exito: true }),
      });

      await apiClient.request('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
          }),
        })
      );
    });

    it('debería lanzar error cuando la respuesta no es ok', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          exito: false,
          mensaje: 'No encontrado',
        }),
      });

      await expect(apiClient.request('/test')).rejects.toMatchObject({
        status: 404,
        message: 'No encontrado',
      });
    });

    it('debería eliminar token y redirigir a login en error 401', async () => {
      localStorage.getItem.mockReturnValue('test-token');
      const originalLocation = window.location;
      delete window.location;
      window.location = { ...originalLocation, href: '' };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          exito: false,
          mensaje: 'No autorizado',
        }),
      });

      await expect(apiClient.request('/test')).rejects.toMatchObject({
        status: 401,
      });

      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(window.location.href).toBe('/login');
      
      // Restaurar location
      window.location = originalLocation;
    });
  });

  describe('Métodos HTTP', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ exito: true }),
      });
    });

    it('debería realizar petición GET', async () => {
      await apiClient.get('/test');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('debería incluir query params en GET', async () => {
      await apiClient.get('/test', { page: 1, limit: 10 });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test?page=1&limit=10'),
        expect.any(Object)
      );
    });

    it('debería realizar petición POST con datos', async () => {
      const data = { nombre: 'Test' };
      await apiClient.post('/test', data);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(data),
        })
      );
    });

    it('debería realizar petición PUT con datos', async () => {
      const data = { nombre: 'Test' };
      await apiClient.put('/test', data);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(data),
        })
      );
    });

    it('debería realizar petición PATCH con datos', async () => {
      const data = { nombre: 'Test' };
      await apiClient.patch('/test', data);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(data),
        })
      );
    });

    it('debería realizar petición DELETE', async () => {
      await apiClient.delete('/test');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });
});

