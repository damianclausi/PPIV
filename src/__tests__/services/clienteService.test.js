import { describe, it, expect, beforeEach, vi } from 'vitest';
import clienteService from '../../services/clienteService';
import apiClient from '../../services/api';

// Mock del apiClient
vi.mock('../../services/api', () => {
  const mockApiClient = {
    get: vi.fn(),
    post: vi.fn(),
  };
  return {
    default: mockApiClient,
  };
});

describe('clienteService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('obtenerPerfil', () => {
    it('debería obtener el perfil del cliente', async () => {
      const mockResponse = {
        exito: true,
        datos: {
          socio_id: 1,
          nombre: 'Test',
          apellido: 'Usuario',
        },
      };

      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await clienteService.obtenerPerfil();

      expect(apiClient.get).toHaveBeenCalledWith('/api/clientes/perfil');
      expect(result).toEqual(mockResponse.datos);
    });
  });

  describe('obtenerCuentas', () => {
    it('debería obtener las cuentas del cliente', async () => {
      const mockResponse = {
        exito: true,
        datos: [
          {
            cuenta_id: 1,
            numero_cuenta: 'CUENTA-001',
            direccion: 'Calle Test 123',
          },
        ],
      };

      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await clienteService.obtenerCuentas();

      expect(apiClient.get).toHaveBeenCalledWith('/api/clientes/cuentas');
      expect(result).toEqual(mockResponse.datos);
    });
  });

  describe('obtenerDashboard', () => {
    it('debería obtener el dashboard del cliente', async () => {
      const mockResponse = {
        exito: true,
        datos: {
          facturas_pendientes: 2,
          reclamos_abiertos: 1,
        },
      };

      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await clienteService.obtenerDashboard();

      expect(apiClient.get).toHaveBeenCalledWith('/api/clientes/dashboard');
      expect(result).toEqual(mockResponse.datos);
    });
  });

  describe('obtenerFacturas', () => {
    it('debería obtener facturas sin parámetros', async () => {
      const mockResponse = {
        exito: true,
        datos: [
          {
            factura_id: 1,
            numero_externo: 'F-000001',
            importe: 5000,
          },
        ],
      };

      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await clienteService.obtenerFacturas();

      expect(apiClient.get).toHaveBeenCalledWith('/api/clientes/facturas', {});
      expect(result).toEqual(mockResponse.datos);
    });

    it('debería obtener facturas con parámetros', async () => {
      const params = { estado: 'PENDIENTE', limite: 10 };
      const mockResponse = {
        exito: true,
        datos: [],
      };

      apiClient.get.mockResolvedValueOnce(mockResponse);

      await clienteService.obtenerFacturas(params);

      expect(apiClient.get).toHaveBeenCalledWith('/api/clientes/facturas', params);
    });
  });

  describe('obtenerFactura', () => {
    it('debería obtener una factura por ID', async () => {
      const mockResponse = {
        exito: true,
        datos: {
          factura_id: 1,
          numero_externo: 'F-000001',
        },
      };

      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await clienteService.obtenerFactura(1);

      expect(apiClient.get).toHaveBeenCalledWith('/api/clientes/facturas/1');
      expect(result).toEqual(mockResponse.datos);
    });
  });

  describe('pagarFactura', () => {
    it('debería registrar el pago de una factura', async () => {
      const datosPago = {
        monto: 5000,
        metodo: 'TARJETA',
      };
      const mockResponse = {
        exito: true,
        datos: {
          factura_id: 1,
          estado: 'PAGADA',
        },
      };

      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await clienteService.pagarFactura(1, datosPago);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/clientes/facturas/1/pagar',
        datosPago
      );
      expect(result).toEqual(mockResponse.datos);
    });
  });

  describe('obtenerReclamos', () => {
    it('debería obtener reclamos sin parámetros', async () => {
      const mockResponse = {
        exito: true,
        datos: [
          {
            reclamo_id: 1,
            descripcion: 'Reclamo de prueba',
            estado: 'PENDIENTE',
          },
        ],
      };

      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await clienteService.obtenerReclamos();

      expect(apiClient.get).toHaveBeenCalledWith('/api/clientes/reclamos', {});
      expect(result).toEqual(mockResponse.datos);
    });

    it('debería obtener reclamos con parámetros', async () => {
      const params = { estado: 'PENDIENTE' };
      const mockResponse = {
        exito: true,
        datos: [],
      };

      apiClient.get.mockResolvedValueOnce(mockResponse);

      await clienteService.obtenerReclamos(params);

      expect(apiClient.get).toHaveBeenCalledWith('/api/clientes/reclamos', params);
    });
  });

  describe('obtenerReclamo', () => {
    it('debería obtener un reclamo por ID', async () => {
      const mockResponse = {
        exito: true,
        datos: {
          reclamo_id: 1,
          descripcion: 'Reclamo de prueba',
        },
      };

      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await clienteService.obtenerReclamo(1);

      expect(apiClient.get).toHaveBeenCalledWith('/api/clientes/reclamos/1');
      expect(result).toEqual(mockResponse.datos);
    });
  });

  describe('crearReclamo', () => {
    it('debería crear un nuevo reclamo', async () => {
      const datosReclamo = {
        cuenta_id: 1,
        detalle_id: 1,
        descripcion: 'Nuevo reclamo',
      };
      const mockResponse = {
        exito: true,
        datos: {
          reclamo_id: 2,
          descripcion: 'Nuevo reclamo',
          estado: 'PENDIENTE',
        },
      };

      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await clienteService.crearReclamo(datosReclamo);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/clientes/reclamos',
        datosReclamo
      );
      expect(result).toEqual(mockResponse.datos);
    });
  });
});

