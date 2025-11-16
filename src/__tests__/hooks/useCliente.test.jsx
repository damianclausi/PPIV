import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePerfil, useDashboard, useFacturas, useFactura, useReclamos, useCuentas } from '../../hooks/useCliente';
import clienteService from '../../services/clienteService';

// Mock del servicio
vi.mock('../../services/clienteService', () => ({
  default: {
    obtenerPerfil: vi.fn(),
    obtenerDashboard: vi.fn(),
    obtenerFacturas: vi.fn(),
    obtenerFactura: vi.fn(),
    obtenerReclamos: vi.fn(),
    obtenerCuentas: vi.fn(),
    crearReclamo: vi.fn(),
  },
}));

describe('useCliente hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('usePerfil', () => {
    it('debería cargar el perfil correctamente', async () => {
      const mockPerfil = {
        socio_id: 1,
        nombre: 'Test',
        apellido: 'Usuario',
      };

      clienteService.obtenerPerfil.mockResolvedValueOnce(mockPerfil);

      const { result } = renderHook(() => usePerfil());

      expect(result.current.cargando).toBe(true);
      expect(result.current.perfil).toBe(null);

      await waitFor(() => {
        expect(result.current.cargando).toBe(false);
      });

      expect(result.current.perfil).toEqual(mockPerfil);
      expect(result.current.error).toBe(null);
    });

    it('debería manejar errores al cargar el perfil', async () => {
      const errorMessage = 'Error al cargar perfil';
      clienteService.obtenerPerfil.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => usePerfil());

      await waitFor(() => {
        expect(result.current.cargando).toBe(false);
      });

      expect(result.current.perfil).toBe(null);
      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('useDashboard', () => {
    it('debería cargar el dashboard correctamente', async () => {
      const mockDashboard = {
        facturas_pendientes: 2,
        reclamos_abiertos: 1,
      };

      clienteService.obtenerDashboard.mockResolvedValueOnce(mockDashboard);

      const { result } = renderHook(() => useDashboard());

      expect(result.current.cargando).toBe(true);

      await waitFor(() => {
        expect(result.current.cargando).toBe(false);
      });

      expect(result.current.dashboard).toEqual(mockDashboard);
      expect(result.current.error).toBe(null);
    });

    it('debería permitir recargar el dashboard', async () => {
      const mockDashboard = { facturas_pendientes: 2 };
      clienteService.obtenerDashboard.mockResolvedValue(mockDashboard);

      const { result } = renderHook(() => useDashboard());

      await waitFor(() => {
        expect(result.current.cargando).toBe(false);
      });

      // Recargar
      await result.current.recargar();

      expect(clienteService.obtenerDashboard).toHaveBeenCalledTimes(2);
    });
  });

  describe('useFacturas', () => {
    it('debería cargar facturas correctamente', async () => {
      const mockFacturas = [
        {
          factura_id: 1,
          numero_externo: 'F-000001',
          importe: 5000,
        },
      ];

      clienteService.obtenerFacturas.mockResolvedValueOnce(mockFacturas);

      const { result } = renderHook(() => useFacturas());

      expect(result.current.cargando).toBe(true);

      await waitFor(() => {
        expect(result.current.cargando).toBe(false);
      });

      expect(result.current.facturas).toEqual(mockFacturas);
      expect(result.current.error).toBe(null);
    });

    it('debería cargar facturas con parámetros', async () => {
      const params = { estado: 'PENDIENTE' };
      clienteService.obtenerFacturas.mockResolvedValueOnce([]);

      renderHook(() => useFacturas(params));

      await waitFor(() => {
        expect(clienteService.obtenerFacturas).toHaveBeenCalledWith(params);
      });
    });

    it('debería permitir recargar facturas', async () => {
      clienteService.obtenerFacturas.mockResolvedValue([]);

      const { result } = renderHook(() => useFacturas());

      await waitFor(() => {
        expect(result.current.cargando).toBe(false);
      });

      await result.current.recargar();

      expect(clienteService.obtenerFacturas).toHaveBeenCalledTimes(2);
    });
  });

  describe('useFactura', () => {
    it('debería cargar una factura por ID', async () => {
      const mockFactura = {
        factura_id: 1,
        numero_externo: 'F-000001',
        importe: 5000,
      };

      clienteService.obtenerFactura.mockResolvedValueOnce(mockFactura);

      const { result } = renderHook(() => useFactura(1));

      expect(result.current.cargando).toBe(true);

      await waitFor(() => {
        expect(result.current.cargando).toBe(false);
      });

      expect(result.current.factura).toEqual(mockFactura);
      expect(clienteService.obtenerFactura).toHaveBeenCalledWith(1);
    });

    it('debería no cargar si no hay ID', () => {
      const { result } = renderHook(() => useFactura(null));

      expect(result.current.cargando).toBe(true);
      expect(clienteService.obtenerFactura).not.toHaveBeenCalled();
    });
  });

  describe('useReclamos', () => {
    it('debería cargar reclamos correctamente', async () => {
      const mockReclamos = [
        {
          reclamo_id: 1,
          descripcion: 'Reclamo de prueba',
          estado: 'PENDIENTE',
        },
      ];

      clienteService.obtenerReclamos.mockResolvedValueOnce(mockReclamos);

      const { result } = renderHook(() => useReclamos());

      expect(result.current.cargando).toBe(true);

      await waitFor(() => {
        expect(result.current.cargando).toBe(false);
      });

      expect(result.current.reclamos).toEqual(mockReclamos);
      expect(result.current.error).toBe(null);
    });

    it('debería permitir crear un nuevo reclamo', async () => {
      const mockReclamos = [];
      const nuevoReclamo = {
        reclamo_id: 2,
        descripcion: 'Nuevo reclamo',
      };

      clienteService.obtenerReclamos.mockResolvedValue(mockReclamos);
      clienteService.crearReclamo.mockResolvedValueOnce(nuevoReclamo);

      const { result } = renderHook(() => useReclamos());

      await waitFor(() => {
        expect(result.current.cargando).toBe(false);
      });

      await result.current.crearReclamo({ descripcion: 'Nuevo reclamo' });

      expect(clienteService.crearReclamo).toHaveBeenCalledWith({
        descripcion: 'Nuevo reclamo',
      });
      expect(clienteService.obtenerReclamos).toHaveBeenCalledTimes(2);
    });
  });

  describe('useCuentas', () => {
    it('debería cargar cuentas correctamente', async () => {
      const mockCuentas = [
        {
          cuenta_id: 1,
          numero_cuenta: 'CUENTA-001',
          direccion: 'Calle Test 123',
        },
      ];

      clienteService.obtenerCuentas.mockResolvedValueOnce(mockCuentas);

      const { result } = renderHook(() => useCuentas());

      expect(result.current.cargando).toBe(true);

      await waitFor(() => {
        expect(result.current.cargando).toBe(false);
      });

      expect(result.current.cuentas).toEqual(mockCuentas);
      expect(result.current.error).toBe(null);
    });
  });
});

