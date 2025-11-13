import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createMockRequest, createMockResponse } from '../../setup/testHelpers.js';

// Mock de modelos
const mockObtenerPerfil = jest.fn();
const mockObtenerPorId = jest.fn();
const mockObtenerResumenPorOperario = jest.fn();
const mockObtenerPorOperario = jest.fn();
const mockActualizarEstado = jest.fn();
const mockObtenerCuadrillaPorOperario = jest.fn();
const mockListarMateriales = jest.fn();
const mockRegistrarMateriales = jest.fn();
const mockObtenerPorOT = jest.fn();
const mockObtenerPorReclamo = jest.fn();
const mockEliminar = jest.fn();

// Mock del pool de base de datos
const mockQuery = jest.fn();
const mockPool = { query: mockQuery };

jest.unstable_mockModule('../../../_lib/models/Empleado.js', () => ({
  __esModule: true,
  default: {
    obtenerPerfil: mockObtenerPerfil
  }
}));

jest.unstable_mockModule('../../../_lib/models/Reclamo.js', () => ({
  __esModule: true,
  default: {
    obtenerPorId: mockObtenerPorId,
    obtenerResumenPorOperario: mockObtenerResumenPorOperario,
    obtenerPorOperario: mockObtenerPorOperario,
    actualizarEstado: mockActualizarEstado
  }
}));

jest.unstable_mockModule('../../../_lib/models/Cuadrilla.js', () => ({
  __esModule: true,
  default: {
    obtenerCuadrillaPorOperario: mockObtenerCuadrillaPorOperario
  }
}));

jest.unstable_mockModule('../../../_lib/models/UsoMaterial.js', () => ({
  __esModule: true,
  default: {
    listarMateriales: mockListarMateriales,
    registrarMateriales: mockRegistrarMateriales,
    obtenerPorOT: mockObtenerPorOT,
    obtenerPorReclamo: mockObtenerPorReclamo,
    eliminar: mockEliminar
  }
}));

jest.unstable_mockModule('../../../_lib/db.js', () => ({
  __esModule: true,
  default: mockPool
}));

const { default: OperarioController } = await import('../../../_lib/controllers/OperarioController.js');

describe('OperarioController', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = createMockRequest();
    res = createMockResponse();
    console.error = jest.fn();
  });

  describe('verificarPermisosReclamo', () => {
    it('debería retornar true si el reclamo está asignado directamente al operario', async () => {
      const reclamo = {
        reclamo_id: 1,
        operario_asignado_id: 5
      };

      mockObtenerPorId.mockResolvedValueOnce(reclamo);

      const resultado = await OperarioController.verificarPermisosReclamo(5, 1);

      expect(resultado).toBe(true);
      expect(mockObtenerPorId).toHaveBeenCalledWith(1);
    });

    it('debería retornar false si el reclamo no existe', async () => {
      mockObtenerPorId.mockResolvedValueOnce(null);

      const resultado = await OperarioController.verificarPermisosReclamo(5, 999);

      expect(resultado).toBe(false);
    });

    it('debería retornar true si el reclamo está en el itinerario de la cuadrilla', async () => {
      const reclamo = {
        reclamo_id: 1,
        operario_asignado_id: null
      };
      const cuadrilla = {
        cuadrilla_id: 3
      };

      mockObtenerPorId.mockResolvedValueOnce(reclamo);
      mockObtenerCuadrillaPorOperario.mockResolvedValueOnce(cuadrilla);
      mockQuery.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });

      const resultado = await OperarioController.verificarPermisosReclamo(5, 1);

      expect(resultado).toBe(true);
      expect(mockObtenerCuadrillaPorOperario).toHaveBeenCalledWith(5);
      expect(mockQuery).toHaveBeenCalled();
    });

    it('debería retornar false si el operario no tiene cuadrilla', async () => {
      const reclamo = {
        reclamo_id: 1,
        operario_asignado_id: null
      };

      mockObtenerPorId.mockResolvedValueOnce(reclamo);
      mockObtenerCuadrillaPorOperario.mockResolvedValueOnce(null);

      const resultado = await OperarioController.verificarPermisosReclamo(5, 1);

      expect(resultado).toBe(false);
    });

    it('debería retornar false si el reclamo no está en el itinerario', async () => {
      const reclamo = {
        reclamo_id: 1,
        operario_asignado_id: null
      };
      const cuadrilla = {
        cuadrilla_id: 3
      };

      mockObtenerPorId.mockResolvedValueOnce(reclamo);
      mockObtenerCuadrillaPorOperario.mockResolvedValueOnce(cuadrilla);
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const resultado = await OperarioController.verificarPermisosReclamo(5, 1);

      expect(resultado).toBe(false);
    });
  });

  describe('obtenerPerfil', () => {
    it('debería retornar el perfil del operario', async () => {
      const perfil = {
        empleado_id: 5,
        nombre: 'Pedro',
        apellido: 'García',
        legajo: 'LEG001'
      };

      req.usuario = { empleado_id: 5 };
      mockObtenerPerfil.mockResolvedValueOnce(perfil);

      await OperarioController.obtenerPerfil(req, res);

      expect(mockObtenerPerfil).toHaveBeenCalledWith(5);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          exito: true,
          datos: perfil
        })
      );
    });

    it('debería retornar error si el perfil no se encuentra', async () => {
      req.usuario = { empleado_id: 999 };
      mockObtenerPerfil.mockResolvedValueOnce(null);

      await OperarioController.obtenerPerfil(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          mensaje: 'Perfil de operario no encontrado'
        })
      );
    });
  });

  describe('obtenerDashboard', () => {
    it('debería retornar el dashboard con estadísticas del operario', async () => {
      const resumenReclamos = {
        pendientes: 5,
        en_proceso: 3,
        resueltos_hoy: 2,
        total: 10
      };
      const ultimosReclamos = [
        { reclamo_id: 1, descripcion: 'Reclamo 1' },
        { reclamo_id: 2, descripcion: 'Reclamo 2' }
      ];

      req.usuario = { empleado_id: 5 };
      mockObtenerResumenPorOperario.mockResolvedValueOnce(resumenReclamos);
      mockObtenerPorOperario.mockResolvedValueOnce({ reclamos: ultimosReclamos });

      await OperarioController.obtenerDashboard(req, res);

      expect(mockObtenerResumenPorOperario).toHaveBeenCalledWith(5);
      expect(mockObtenerPorOperario).toHaveBeenCalledWith(5, { limite: 5, pagina: 1 });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          datos: expect.objectContaining({
            reclamos: expect.objectContaining({
              pendientes: 5,
              en_proceso: 3,
              resueltos_hoy: 2,
              total: 10
            }),
            ultimos_reclamos: ultimosReclamos
          })
        })
      );
    });
  });

  describe('obtenerReclamos', () => {
    it('debería retornar los reclamos del operario con filtros', async () => {
      const resultado = {
        reclamos: [
          { reclamo_id: 1, estado: 'PENDIENTE' }
        ],
        total: 1,
        pagina: 1,
        total_paginas: 1
      };

      req.usuario = { empleado_id: 5 };
      req.query = { estado: 'PENDIENTE', pagina: '1', limite: '10' };
      mockObtenerPorOperario.mockResolvedValueOnce(resultado);

      await OperarioController.obtenerReclamos(req, res);

      expect(mockObtenerPorOperario).toHaveBeenCalledWith(5, {
        estado: 'PENDIENTE',
        pagina: 1,
        limite: 10
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('debería usar valores por defecto para página y límite', async () => {
      const resultado = { reclamos: [], total: 0 };

      req.usuario = { empleado_id: 5 };
      req.query = {};
      mockObtenerPorOperario.mockResolvedValueOnce(resultado);

      await OperarioController.obtenerReclamos(req, res);

      expect(mockObtenerPorOperario).toHaveBeenCalledWith(5, {
        estado: undefined,
        pagina: 1,
        limite: 10
      });
    });
  });

  describe('obtenerReclamo', () => {
    it('debería retornar un reclamo si el operario tiene permisos', async () => {
      const reclamo = {
        reclamo_id: 1,
        descripcion: 'Problema con medidor',
        operario_asignado_id: 5
      };

      req.usuario = { empleado_id: 5 };
      req.params = { id: '1' };
      // Primera llamada para verificarPermisosReclamo
      mockObtenerPorId.mockResolvedValueOnce(reclamo);
      // Segunda llamada para obtener el reclamo
      mockObtenerPorId.mockResolvedValueOnce(reclamo);

      await OperarioController.obtenerReclamo(req, res);

      expect(mockObtenerPorId).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('debería retornar error si el reclamo no existe', async () => {
      req.usuario = { empleado_id: 5 };
      req.params = { id: '999' };
      mockObtenerPorId.mockResolvedValueOnce(null);

      await OperarioController.obtenerReclamo(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          mensaje: 'Reclamo no encontrado'
        })
      );
    });

    it('debería retornar error si el operario no tiene permisos', async () => {
      const reclamo = {
        reclamo_id: 1,
        operario_asignado_id: 10
      };

      req.usuario = { empleado_id: 5 };
      req.params = { id: '1' };
      // Primera llamada para verificarPermisosReclamo
      mockObtenerPorId.mockResolvedValueOnce(reclamo);
      mockObtenerCuadrillaPorOperario.mockResolvedValueOnce(null);
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await OperarioController.obtenerReclamo(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          mensaje: 'No tienes permiso para ver este reclamo'
        })
      );
    });
  });

  describe('actualizarEstadoReclamo', () => {
    it('debería actualizar el estado de un reclamo exitosamente', async () => {
      const reclamo = {
        reclamo_id: 1,
        operario_asignado_id: 5
      };
      const reclamoActualizado = {
        reclamo_id: 1,
        estado: 'EN_PROCESO'
      };

      req.usuario = { empleado_id: 5 };
      req.params = { id: '1' };
      req.body = { estado: 'EN_PROCESO', observaciones: 'Iniciando trabajo' };
      // Primera llamada para verificar que existe
      mockObtenerPorId.mockResolvedValueOnce(reclamo);
      // Segunda llamada para verificarPermisosReclamo
      mockObtenerPorId.mockResolvedValueOnce(reclamo);
      mockActualizarEstado.mockResolvedValueOnce(reclamoActualizado);

      await OperarioController.actualizarEstadoReclamo(req, res);

      expect(mockActualizarEstado).toHaveBeenCalledWith('1', 'EN_PROCESO', 'Iniciando trabajo');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('debería retornar error si falta el estado', async () => {
      req.usuario = { empleado_id: 5 };
      req.params = { id: '1' };
      req.body = { observaciones: 'Sin estado' };

      await OperarioController.actualizarEstadoReclamo(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          mensaje: 'El estado es requerido'
        })
      );
    });

    it('debería retornar error si el operario no tiene permisos', async () => {
      const reclamo = {
        reclamo_id: 1,
        operario_asignado_id: 10
      };

      req.usuario = { empleado_id: 5 };
      req.params = { id: '1' };
      req.body = { estado: 'EN_PROCESO' };
      // Primera llamada para verificar que existe
      mockObtenerPorId.mockResolvedValueOnce(reclamo);
      // Segunda llamada para verificarPermisosReclamo
      mockObtenerPorId.mockResolvedValueOnce(reclamo);
      mockObtenerCuadrillaPorOperario.mockResolvedValueOnce(null);
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await OperarioController.actualizarEstadoReclamo(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('listarMateriales', () => {
    it('debería retornar la lista de materiales disponibles', async () => {
      const materiales = [
        { material_id: 1, nombre: 'Cable', stock: 100 },
        { material_id: 2, nombre: 'Conector', stock: 50 }
      ];

      mockListarMateriales.mockResolvedValueOnce(materiales);

      await OperarioController.listarMateriales(req, res);

      expect(mockListarMateriales).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          datos: materiales
        })
      );
    });
  });

  describe('registrarMateriales', () => {
    it('debería registrar materiales en una OT exitosamente', async () => {
      const materiales = [
        { material_id: 1, cantidad: 2 },
        { material_id: 2, cantidad: 1 }
      ];
      const resultado = {
        ot_id: 10,
        materiales_registrados: 2
      };

      req.usuario = { empleado_id: 5 };
      req.params = { otId: '10' };
      req.body = { materiales };
      mockRegistrarMateriales.mockResolvedValueOnce(resultado);

      await OperarioController.registrarMateriales(req, res);

      expect(mockRegistrarMateriales).toHaveBeenCalledWith('10', 5, materiales);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('debería retornar error si no se proporcionan materiales', async () => {
      req.usuario = { empleado_id: 5 };
      req.params = { otId: '10' };
      req.body = { materiales: [] };

      await OperarioController.registrarMateriales(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          mensaje: 'Debe proporcionar al menos un material'
        })
      );
    });

    it('debería retornar error si falta material_id o cantidad', async () => {
      req.usuario = { empleado_id: 5 };
      req.params = { otId: '10' };
      req.body = {
        materiales: [
          { material_id: 1 }
        ]
      };

      await OperarioController.registrarMateriales(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          mensaje: 'Cada material debe tener material_id y cantidad'
        })
      );
    });
  });

  describe('obtenerMaterialesOT', () => {
    it('debería retornar los materiales de una OT', async () => {
      const materiales = [
        { uso_material_id: 1, material_id: 1, cantidad: 2 }
      ];

      req.params = { otId: '10' };
      mockObtenerPorOT.mockResolvedValueOnce(materiales);

      await OperarioController.obtenerMaterialesOT(req, res);

      expect(mockObtenerPorOT).toHaveBeenCalledWith('10');
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('obtenerMaterialesReclamo', () => {
    it('debería retornar los materiales de un reclamo', async () => {
      const materiales = [
        { uso_material_id: 1, material_id: 1, cantidad: 2 }
      ];

      req.params = { id: '1' };
      mockObtenerPorReclamo.mockResolvedValueOnce(materiales);

      await OperarioController.obtenerMaterialesReclamo(req, res);

      expect(mockObtenerPorReclamo).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('eliminarUsoMaterial', () => {
    it('debería eliminar un registro de uso de material', async () => {
      const resultado = {
        eliminado: true,
        uso_material_id: 1
      };

      req.usuario = { empleado_id: 5 };
      req.params = { id: '1' };
      mockEliminar.mockResolvedValueOnce(resultado);

      await OperarioController.eliminarUsoMaterial(req, res);

      expect(mockEliminar).toHaveBeenCalledWith('1', 5);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});

