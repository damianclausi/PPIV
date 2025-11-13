import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createMockRequest, createMockResponse } from '../../setup/testHelpers.js';

// Mock de modelos
const mockObtenerPerfil = jest.fn();
const mockObtenerCuentas = jest.fn();
const mockObtenerPorSocio = jest.fn();
const mockObtenerPorId = jest.fn();
const mockObtenerResumen = jest.fn();
const mockCrear = jest.fn();
const mockRegistrarPago = jest.fn();

jest.unstable_mockModule('../../../_lib/models/Socio.js', () => ({
  __esModule: true,
  default: {
    obtenerPerfil: mockObtenerPerfil,
    obtenerCuentas: mockObtenerCuentas
  }
}));

jest.unstable_mockModule('../../../_lib/models/Factura.js', () => ({
  __esModule: true,
  default: {
    obtenerPorSocio: mockObtenerPorSocio,
    obtenerPorId: mockObtenerPorId,
    obtenerResumen: mockObtenerResumen,
    registrarPago: mockRegistrarPago
  }
}));

jest.unstable_mockModule('../../../_lib/models/Reclamo.js', () => ({
  __esModule: true,
  default: {
    obtenerPorSocio: mockObtenerPorSocio,
    obtenerPorId: mockObtenerPorId,
    obtenerResumen: mockObtenerResumen,
    crear: mockCrear
  }
}));

const { default: ClienteController } = await import('../../../_lib/controllers/ClienteController.js');

describe('ClienteController', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = createMockRequest();
    res = createMockResponse();
    console.error = jest.fn();
  });

  describe('obtenerPerfil', () => {
    it('debería retornar el perfil del socio con sus cuentas', async () => {
      const perfil = {
        socio_id: 1,
        nombre: 'Juan',
        apellido: 'Pérez',
        dni: '12345678'
      };
      const cuentas = [
        { cuenta_id: 1, numero_cuenta: '001', activa: true },
        { cuenta_id: 2, numero_cuenta: '002', activa: false }
      ];

      req.usuario = { socio_id: 1 };
      mockObtenerPerfil.mockResolvedValueOnce(perfil);
      mockObtenerCuentas.mockResolvedValueOnce(cuentas);

      await ClienteController.obtenerPerfil(req, res);

      expect(mockObtenerPerfil).toHaveBeenCalledWith(1);
      expect(mockObtenerCuentas).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          exito: true,
          datos: expect.objectContaining({
            ...perfil,
            cuentas
          })
        })
      );
    });

    it('debería retornar error si el usuario no es un socio', async () => {
      req.usuario = { socio_id: null };

      await ClienteController.obtenerPerfil(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          exito: false,
          mensaje: 'Usuario no es un socio'
        })
      );
    });

    it('debería retornar error si el perfil no se encuentra', async () => {
      req.usuario = { socio_id: 1 };
      mockObtenerPerfil.mockResolvedValueOnce(null);

      await ClienteController.obtenerPerfil(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          exito: false,
          mensaje: 'Perfil no encontrado'
        })
      );
    });
  });

  describe('obtenerCuentas', () => {
    it('debería retornar las cuentas del socio', async () => {
      const cuentas = [
        { cuenta_id: 1, numero_cuenta: '001' },
        { cuenta_id: 2, numero_cuenta: '002' }
      ];

      req.usuario = { socio_id: 1 };
      mockObtenerCuentas.mockResolvedValueOnce(cuentas);

      await ClienteController.obtenerCuentas(req, res);

      expect(mockObtenerCuentas).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          exito: true,
          datos: cuentas
        })
      );
    });

    it('debería retornar error si el usuario no es un socio', async () => {
      req.usuario = { socio_id: null };

      await ClienteController.obtenerCuentas(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('obtenerFacturas', () => {
    it('debería retornar las facturas del socio con filtros', async () => {
      const facturas = {
        facturas: [
          { factura_id: 1, monto: 1000, estado: 'PENDIENTE' }
        ],
        total: 1
      };

      req.usuario = { socio_id: 1 };
      req.query = { estado: 'PENDIENTE', limite: '10', offset: '0' };
      mockObtenerPorSocio.mockResolvedValueOnce(facturas);

      await ClienteController.obtenerFacturas(req, res);

      expect(mockObtenerPorSocio).toHaveBeenCalledWith(1, {
        estado: 'PENDIENTE',
        limite: 10,
        offset: 0,
        cuenta_id: null
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('debería usar valores por defecto para límite y offset', async () => {
      const facturas = { facturas: [], total: 0 };

      req.usuario = { socio_id: 1 };
      req.query = {};
      mockObtenerPorSocio.mockResolvedValueOnce(facturas);

      await ClienteController.obtenerFacturas(req, res);

      expect(mockObtenerPorSocio).toHaveBeenCalledWith(1, {
        estado: undefined,
        limite: 10,
        offset: 0,
        cuenta_id: null
      });
    });
  });

  describe('obtenerFactura', () => {
    it('debería retornar una factura específica', async () => {
      const factura = {
        factura_id: 1,
        monto: 1000,
        estado: 'PENDIENTE'
      };

      req.usuario = { socio_id: 1 };
      req.params = { id: '1' };
      mockObtenerPorId.mockResolvedValueOnce(factura);

      await ClienteController.obtenerFactura(req, res);

      expect(mockObtenerPorId).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('debería retornar error si la factura no existe', async () => {
      req.usuario = { socio_id: 1 };
      req.params = { id: '999' };
      mockObtenerPorId.mockResolvedValueOnce(null);

      await ClienteController.obtenerFactura(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          mensaje: 'Factura no encontrada'
        })
      );
    });
  });

  describe('obtenerReclamos', () => {
    it('debería retornar los reclamos del socio', async () => {
      const reclamos = {
        reclamos: [
          { reclamo_id: 1, descripcion: 'Problema con medidor' }
        ],
        total: 1
      };

      req.usuario = { socio_id: 1 };
      req.query = { estado: 'PENDIENTE', limite: '20', offset: '0' };
      mockObtenerPorSocio.mockResolvedValueOnce(reclamos);

      await ClienteController.obtenerReclamos(req, res);

      expect(mockObtenerPorSocio).toHaveBeenCalledWith(1, {
        estado: 'PENDIENTE',
        limite: 20,
        offset: 0,
        cuenta_id: null
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('obtenerReclamo', () => {
    it('debería retornar un reclamo específico', async () => {
      const reclamo = {
        reclamo_id: 1,
        descripcion: 'Problema con medidor',
        estado: 'PENDIENTE'
      };

      req.params = { id: '1' };
      mockObtenerPorId.mockResolvedValueOnce(reclamo);

      await ClienteController.obtenerReclamo(req, res);

      expect(mockObtenerPorId).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('debería retornar error si el reclamo no existe', async () => {
      req.params = { id: '999' };
      mockObtenerPorId.mockResolvedValueOnce(null);

      await ClienteController.obtenerReclamo(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('crearReclamo', () => {
    it('debería crear un nuevo reclamo exitosamente', async () => {
      const cuentas = [
        { cuenta_id: 1, numero_cuenta: '001' }
      ];
      const nuevoReclamo = {
        reclamo_id: 1,
        cuenta_id: 1,
        descripcion: 'Problema con medidor',
        estado: 'PENDIENTE'
      };

      req.usuario = { socio_id: 1 };
      req.body = {
        cuenta_id: 1,
        detalle_id: 2,
        descripcion: 'Problema con medidor',
        prioridad_id: 1
      };
      mockObtenerCuentas.mockResolvedValueOnce(cuentas);
      mockCrear.mockResolvedValueOnce(nuevoReclamo);

      await ClienteController.crearReclamo(req, res);

      expect(mockObtenerCuentas).toHaveBeenCalledWith(1);
      expect(mockCrear).toHaveBeenCalledWith({
        cuentaId: 1,
        detalleId: 2,
        descripcion: 'Problema con medidor',
        prioridadId: 1,
        canal: 'WEB'
      });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('debería retornar error si faltan campos requeridos', async () => {
      req.usuario = { socio_id: 1 };
      req.body = { cuenta_id: 1 };

      await ClienteController.crearReclamo(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          mensaje: 'Faltan campos requeridos'
        })
      );
    });

    it('debería retornar error si la cuenta no pertenece al socio', async () => {
      const cuentas = [
        { cuenta_id: 2, numero_cuenta: '002' }
      ];

      req.usuario = { socio_id: 1 };
      req.body = {
        cuenta_id: 1,
        detalle_id: 2,
        descripcion: 'Problema'
      };
      mockObtenerCuentas.mockResolvedValueOnce(cuentas);

      await ClienteController.crearReclamo(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          mensaje: 'La cuenta no pertenece al socio'
        })
      );
    });

    it('debería usar prioridad por defecto si no se proporciona', async () => {
      const cuentas = [{ cuenta_id: 1 }];
      const nuevoReclamo = { reclamo_id: 1 };

      req.usuario = { socio_id: 1 };
      req.body = {
        cuenta_id: 1,
        detalle_id: 2,
        descripcion: 'Problema'
      };
      mockObtenerCuentas.mockResolvedValueOnce(cuentas);
      mockCrear.mockResolvedValueOnce(nuevoReclamo);

      await ClienteController.crearReclamo(req, res);

      expect(mockCrear).toHaveBeenCalledWith(
        expect.objectContaining({
          prioridadId: 2
        })
      );
    });
  });

  describe('pagarFactura', () => {
    it('debería registrar el pago de una factura exitosamente', async () => {
      const factura = {
        factura_id: 1,
        monto: 1000,
        estado: 'PENDIENTE'
      };
      const resultado = {
        factura_id: 1,
        estado: 'PAGADA',
        monto_pagado: 1000
      };

      req.usuario = { socio_id: 1 };
      req.params = { id: '1' };
      req.body = {
        monto_pagado: 1000,
        metodo_pago: 'TARJETA'
      };
      mockObtenerPorId.mockResolvedValueOnce(factura);
      mockRegistrarPago.mockResolvedValueOnce(resultado);

      await ClienteController.pagarFactura(req, res);

      expect(mockObtenerPorId).toHaveBeenCalledWith('1');
      expect(mockRegistrarPago).toHaveBeenCalledWith('1', {
        montoPagado: 1000,
        metodoPago: 'TARJETA',
        comprobante: null
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('debería retornar error si la factura no existe', async () => {
      req.usuario = { socio_id: 1 };
      req.params = { id: '999' };
      mockObtenerPorId.mockResolvedValueOnce(null);

      await ClienteController.pagarFactura(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('debería retornar error si la factura ya está pagada', async () => {
      const factura = {
        factura_id: 1,
        estado: 'PAGADA'
      };

      req.usuario = { socio_id: 1 };
      req.params = { id: '1' };
      req.body = { monto_pagado: 1000 };
      mockObtenerPorId.mockResolvedValueOnce(factura);

      await ClienteController.pagarFactura(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          mensaje: 'La factura ya está pagada'
        })
      );
    });

    it('debería retornar error si el monto es inválido', async () => {
      const factura = {
        factura_id: 1,
        estado: 'PENDIENTE'
      };

      req.usuario = { socio_id: 1 };
      req.params = { id: '1' };
      req.body = { monto_pagado: 0 };
      mockObtenerPorId.mockResolvedValueOnce(factura);

      await ClienteController.pagarFactura(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          mensaje: 'Monto de pago inválido'
        })
      );
    });
  });

  describe('obtenerDashboard', () => {
    it('debería retornar el dashboard con resumen completo', async () => {
      const cuentas = [
        { cuenta_id: 1, activa: true },
        { cuenta_id: 2, activa: false }
      ];
      const resumenFacturas = {
        pendientes: '2',
        pagadas: '5',
        vencidas: '1',
        monto_pendiente: '5000.00',
        monto_pagado: '10000.00'
      };
      const resumenReclamos = {
        pendientes: '3',
        en_proceso: '2',
        resueltos: '10',
        cerrados: '5'
      };

      req.usuario = { socio_id: 1 };
      mockObtenerCuentas.mockResolvedValueOnce(cuentas);
      mockObtenerResumen.mockResolvedValueOnce(resumenFacturas);
      mockObtenerResumen.mockResolvedValueOnce(resumenReclamos);

      await ClienteController.obtenerDashboard(req, res);

      expect(mockObtenerCuentas).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          exito: true,
          datos: expect.objectContaining({
            cuentas: expect.objectContaining({
              total: 2,
              activas: 1
            }),
            facturas: expect.objectContaining({
              pendientes: 2,
              pagadas: 5
            }),
            reclamos: expect.objectContaining({
              pendientes: 3,
              en_proceso: 2
            })
          })
        })
      );
    });

    it('debería retornar error si el usuario no es un socio', async () => {
      req.usuario = { socio_id: null };

      await ClienteController.obtenerDashboard(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});

