import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockQuery = jest.fn();
const mockConnect = jest.fn();
const mockClientQuery = jest.fn();
const mockClientRelease = jest.fn();

jest.unstable_mockModule('../../../_lib/db.js', () => ({
  __esModule: true,
  default: {
    query: mockQuery,
    connect: mockConnect
  }
}));

const { default: Factura } = await import('../../../_lib/models/Factura.js');

describe('Modelo Factura', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockReset();
    mockConnect.mockReset();
    mockClientQuery.mockReset();
    mockClientRelease.mockReset();
    mockConnect.mockResolvedValue({
      query: mockClientQuery,
      release: mockClientRelease
    });
  });

  describe('obtenerPorSocio', () => {
    it('debería retornar facturas del socio con filtros básicos', async () => {
      const facturas = [
        { factura_id: 1, periodo: '2024-01', importe: 5000 },
        { factura_id: 2, periodo: '2024-02', importe: 5500 }
      ];
      mockQuery.mockResolvedValueOnce({ rows: facturas });

      const resultado = await Factura.obtenerPorSocio(1, { limite: 10, offset: 0 });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE c.socio_id = $1'),
        [1, 10, 0]
      );
      expect(resultado).toEqual(facturas);
    });

    it('debería aplicar filtros de estado y cuenta', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await Factura.obtenerPorSocio(1, { estado: 'PENDIENTE', cuenta_id: 5, limite: 20, offset: 10 });

      const [, params] = mockQuery.mock.calls[0];
      expect(params).toEqual([1, 5, 'PENDIENTE', 20, 10]);
    });
  });

  describe('obtenerPorId', () => {
    it('debería retornar la factura con información relacionada', async () => {
      const factura = {
        factura_id: 1,
        periodo: '2024-01',
        importe: 5000,
        numero_cuenta: '000001',
        socio_nombre: 'Juan',
        socio_apellido: 'Pérez'
      };
      mockQuery.mockResolvedValueOnce({ rows: [factura] });

      const resultado = await Factura.obtenerPorId(1);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE f.factura_id = $1'),
        [1]
      );
      expect(resultado).toEqual(factura);
    });

    it('debería retornar undefined si la factura no existe', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const resultado = await Factura.obtenerPorId(999);

      expect(resultado).toBeUndefined();
    });
  });

  describe('obtenerResumen', () => {
    it('debería retornar el resumen de facturas del socio', async () => {
      const resumen = {
        pendientes: '3',
        pagadas: '10',
        vencidas: '2',
        monto_pendiente: '15000',
        monto_pagado: '50000'
      };
      mockQuery.mockResolvedValueOnce({ rows: [resumen] });

      const resultado = await Factura.obtenerResumen(1);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE c.socio_id = $1'),
        [1]
      );
      expect(resultado).toEqual(resumen);
    });
  });

  describe('actualizarEstado', () => {
    it('debería actualizar el estado de la factura', async () => {
      const factura = { factura_id: 1, estado: 'PAGADA' };
      mockQuery.mockResolvedValueOnce({ rows: [factura] });

      const resultado = await Factura.actualizarEstado(1, 'PAGADA');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE factura SET estado = $1'),
        ['PAGADA', 1]
      );
      expect(resultado).toEqual(factura);
    });
  });

  describe('registrarPago', () => {
    it('debería registrar el pago y actualizar la factura en transacción', async () => {
      const pago = { pago_id: 1, monto: 5000, medio: 'TARJETA' };
      const factura = { factura_id: 1, estado: 'PAGADA' };

      mockClientQuery
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [pago] }) // INSERT pago
        .mockResolvedValueOnce({ rows: [factura] }) // UPDATE factura
        .mockResolvedValueOnce({}); // COMMIT

      const resultado = await Factura.registrarPago(1, {
        montoPagado: 5000,
        metodoPago: 'TARJETA',
        comprobante: 'COMP-123'
      });

      expect(mockClientQuery).toHaveBeenNthCalledWith(1, 'BEGIN');
      expect(mockClientQuery).toHaveBeenNthCalledWith(2, expect.stringContaining('INSERT INTO pago'), [
        1, 5000, 'TARJETA', 'COMP-123', 'APROBADO'
      ]);
      expect(mockClientQuery).toHaveBeenNthCalledWith(3, expect.stringContaining('UPDATE factura SET estado = $1'), ['PAGADA', 1]);
      expect(mockClientQuery).toHaveBeenNthCalledWith(4, 'COMMIT');
      expect(mockClientRelease).toHaveBeenCalled();
      expect(resultado.pago).toEqual(pago);
      expect(resultado.factura).toEqual(factura);
    });

    it('debería hacer rollback en caso de error', async () => {
      const error = new Error('DB error');

      mockClientQuery
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ pago_id: 1 }] }) // INSERT pago
        .mockRejectedValueOnce(error); // Error en UPDATE factura

      await expect(Factura.registrarPago(1, {
        montoPagado: 5000,
        metodoPago: 'TARJETA'
      })).rejects.toThrow('DB error');

      expect(mockClientQuery).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClientRelease).toHaveBeenCalled();
    });

    it('debería funcionar sin comprobante', async () => {
      const pago = { pago_id: 1, monto: 5000 };
      const factura = { factura_id: 1, estado: 'PAGADA' };

      mockClientQuery
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [pago] })
        .mockResolvedValueOnce({ rows: [factura] })
        .mockResolvedValueOnce({});

      const resultado = await Factura.registrarPago(1, {
        montoPagado: 5000,
        metodoPago: 'EFECTIVO'
      });

      const [, params] = mockClientQuery.mock.calls[1];
      expect(params[3]).toBeNull(); // comprobante
      expect(resultado.pago).toEqual(pago);
    });
  });

  describe('crear', () => {
    it('debería crear una nueva factura', async () => {
      const datos = {
        cuentaId: 1,
        periodo: '2024-03',
        importe: 6000,
        vencimiento: '2024-04-15',
        numeroExterno: 'FAC-123'
      };
      const facturaCreada = { factura_id: 5, ...datos };
      mockQuery.mockResolvedValueOnce({ rows: [facturaCreada] });

      const resultado = await Factura.crear(datos);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO factura'),
        [datos.cuentaId, datos.periodo, datos.importe, datos.vencimiento, datos.numeroExterno]
      );
      expect(resultado).toEqual(facturaCreada);
    });

    it('debería funcionar sin numeroExterno', async () => {
      const datos = {
        cuentaId: 1,
        periodo: '2024-03',
        importe: 6000,
        vencimiento: '2024-04-15'
      };
      const facturaCreada = { factura_id: 6, ...datos, numeroExterno: null };
      mockQuery.mockResolvedValueOnce({ rows: [facturaCreada] });

      const resultado = await Factura.crear(datos);

      const [, params] = mockQuery.mock.calls[0];
      expect(params[4]).toBeNull(); // numeroExterno
      expect(resultado).toEqual(facturaCreada);
    });
  });

  describe('obtenerEstadisticas', () => {
    it('debería retornar estadísticas de facturación', async () => {
      const estadisticas = {
        total: '100',
        pendientes: '20',
        pagadas: '70',
        vencidas: '10',
        monto_total: '500000',
        monto_pendiente: '100000'
      };
      mockQuery.mockResolvedValueOnce({ rows: [estadisticas] });

      const resultado = await Factura.obtenerEstadisticas();

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('FROM factura'));
      expect(resultado).toEqual(estadisticas);
    });
  });
});

