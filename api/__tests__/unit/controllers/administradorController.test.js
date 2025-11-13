import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createMockRequest, createMockResponse } from '../../setup/testHelpers.js';

// Mock de modelos
const mockObtenerPerfil = jest.fn();
const mockObtenerEstadisticas = jest.fn();
const mockListar = jest.fn();
const mockObtenerCuentas = jest.fn();
const mockCrear = jest.fn();
const mockActualizar = jest.fn();
const mockCambiarEstado = jest.fn();
const mockEliminar = jest.fn();
const mockObtenerResumenGeneral = jest.fn();
const mockListarTodos = jest.fn();
const mockContarTodos = jest.fn();
const mockObtenerPorId = jest.fn();
const mockAsignarOperario = jest.fn();
const mockListarPorCuenta = jest.fn();
const mockListarServicios = jest.fn();
const mockListarCuentas = jest.fn();
const mockObtenerStockBajo = jest.fn();
const mockObtenerResumenStock = jest.fn();
const mockListarTodosMateriales = jest.fn();

jest.unstable_mockModule('../../../_lib/models/Empleado.js', () => ({
  __esModule: true,
  default: {
    obtenerPerfil: mockObtenerPerfil,
    listar: mockListar
  }
}));

jest.unstable_mockModule('../../../_lib/models/Socio.js', () => ({
  __esModule: true,
  default: {
    obtenerPerfil: mockObtenerPerfil,
    obtenerCuentas: mockObtenerCuentas,
    obtenerEstadisticas: mockObtenerEstadisticas,
    listar: mockListar,
    crear: mockCrear,
    actualizar: mockActualizar,
    cambiarEstado: mockCambiarEstado,
    eliminar: mockEliminar
  }
}));

jest.unstable_mockModule('../../../_lib/models/Reclamo.js', () => ({
  __esModule: true,
  default: {
    obtenerResumenGeneral: mockObtenerResumenGeneral,
    listarTodos: mockListarTodos,
    contarTodos: mockContarTodos,
    obtenerPorId: mockObtenerPorId,
    asignarOperario: mockAsignarOperario,
    listarPorCuenta: mockListarPorCuenta
  }
}));

jest.unstable_mockModule('../../../_lib/models/Factura.js', () => ({
  __esModule: true,
  default: {
    obtenerEstadisticas: mockObtenerEstadisticas
  }
}));

jest.unstable_mockModule('../../../_lib/models/Cuenta.js', () => ({
  __esModule: true,
  default: {
    crear: mockCrear,
    actualizar: mockActualizar,
    listar: mockListarCuentas
  }
}));

jest.unstable_mockModule('../../../_lib/models/Servicio.js', () => ({
  __esModule: true,
  default: {
    listar: mockListarServicios
  }
}));

jest.unstable_mockModule('../../../_lib/models/Material.js', () => ({
  __esModule: true,
  default: {
    obtenerStockBajo: mockObtenerStockBajo,
    obtenerResumenStock: mockObtenerResumenStock,
    listarTodos: mockListarTodosMateriales
  }
}));

jest.unstable_mockModule('../../../_lib/models/Lectura.js', () => ({
  __esModule: true,
  default: {
    listarPorCuenta: mockListarPorCuenta
  }
}));

const { default: AdministradorController } = await import('../../../_lib/controllers/AdministradorController.js');

describe('AdministradorController', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = createMockRequest();
    res = createMockResponse();
    console.error = jest.fn();
  });

  describe('obtenerPerfil', () => {
    it('debería retornar el perfil del administrador', async () => {
      const perfil = {
        empleado_id: 1,
        nombre: 'Admin',
        apellido: 'Sistema',
        legajo: 'ADM001'
      };

      req.usuario = { empleado_id: 1 };
      mockObtenerPerfil.mockResolvedValueOnce(perfil);

      await AdministradorController.obtenerPerfil(req, res);

      expect(mockObtenerPerfil).toHaveBeenCalledWith(1);
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

      await AdministradorController.obtenerPerfil(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('obtenerDashboard', () => {
    it('debería retornar el dashboard con estadísticas generales', async () => {
      const resumenReclamos = {
        pendientes: 10,
        en_proceso: 5,
        resueltos: 20
      };
      const estadisticasSocios = {
        total: 100,
        activos: 95
      };
      const estadisticasFacturacion = {
        total_facturado: 50000,
        pendiente: 10000
      };

      mockObtenerResumenGeneral.mockResolvedValueOnce(resumenReclamos);
      mockObtenerEstadisticas.mockResolvedValueOnce(estadisticasSocios);
      mockObtenerEstadisticas.mockResolvedValueOnce(estadisticasFacturacion);

      await AdministradorController.obtenerDashboard(req, res);

      expect(mockObtenerResumenGeneral).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          datos: expect.objectContaining({
            socios: estadisticasSocios,
            reclamos: resumenReclamos,
            facturacion: estadisticasFacturacion
          })
        })
      );
    });
  });

  describe('listarSocios', () => {
    it('debería listar socios con filtros', async () => {
      const resultado = {
        socios: [
          { socio_id: 1, nombre: 'Juan', apellido: 'Pérez' }
        ],
        total: 1
      };

      req.query = { activo: 'true', pagina: '1', limite: '10', busqueda: 'Juan' };
      mockListar.mockResolvedValueOnce(resultado);

      await AdministradorController.listarSocios(req, res);

      expect(mockListar).toHaveBeenCalledWith({
        activo: true,
        offset: 0,
        limite: 10,
        busqueda: 'Juan',
        orden: 'socio_id',
        direccion: 'ASC'
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('debería usar valores por defecto', async () => {
      const resultado = { socios: [], total: 0 };

      req.query = {};
      mockListar.mockResolvedValueOnce(resultado);

      await AdministradorController.listarSocios(req, res);

      expect(mockListar).toHaveBeenCalledWith({
        activo: null,
        offset: 0,
        limite: 10,
        busqueda: undefined,
        orden: 'socio_id',
        direccion: 'ASC'
      });
    });
  });

  describe('obtenerSocio', () => {
    it('debería retornar un socio con sus cuentas', async () => {
      const socio = {
        socio_id: 1,
        nombre: 'Juan',
        apellido: 'Pérez'
      };
      const cuentas = [
        { cuenta_id: 1, numero_cuenta: '001' }
      ];

      req.params = { id: '1' };
      mockObtenerPerfil.mockResolvedValueOnce(socio);
      mockObtenerCuentas.mockResolvedValueOnce(cuentas);

      await AdministradorController.obtenerSocio(req, res);

      expect(mockObtenerPerfil).toHaveBeenCalledWith('1');
      expect(mockObtenerCuentas).toHaveBeenCalledWith('1');
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          datos: expect.objectContaining({
            ...socio,
            cuentas
          })
        })
      );
    });

    it('debería retornar error si el socio no existe', async () => {
      req.params = { id: '999' };
      mockObtenerPerfil.mockResolvedValueOnce(null);

      await AdministradorController.obtenerSocio(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('crearSocio', () => {
    it('debería crear un nuevo socio exitosamente', async () => {
      const datosSocio = {
        nombre: 'Juan',
        apellido: 'Pérez',
        dni: '12345678',
        email: 'juan@test.com'
      };
      const nuevoSocio = {
        socio_id: 1,
        ...datosSocio
      };

      req.body = datosSocio;
      mockCrear.mockResolvedValueOnce(nuevoSocio);

      await AdministradorController.crearSocio(req, res);

      expect(mockCrear).toHaveBeenCalledWith(datosSocio);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('debería retornar error si faltan campos obligatorios', async () => {
      req.body = { nombre: 'Juan' };

      await AdministradorController.crearSocio(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          mensaje: 'Faltan datos obligatorios: nombre, apellido, DNI, email'
        })
      );
    });

    it('debería manejar error de DNI o email duplicado', async () => {
      const error = new Error('Duplicate key');
      error.code = '23505';

      req.body = {
        nombre: 'Juan',
        apellido: 'Pérez',
        dni: '12345678',
        email: 'juan@test.com'
      };
      mockCrear.mockRejectedValueOnce(error);

      await AdministradorController.crearSocio(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          mensaje: 'Ya existe un socio con ese DNI o email'
        })
      );
    });
  });

  describe('actualizarSocio', () => {
    it('debería actualizar un socio exitosamente', async () => {
      const datosActualizados = { nombre: 'Juan Carlos' };
      const socioActualizado = {
        socio_id: 1,
        nombre: 'Juan Carlos',
        apellido: 'Pérez'
      };

      req.params = { id: '1' };
      req.body = datosActualizados;
      mockActualizar.mockResolvedValueOnce(socioActualizado);

      await AdministradorController.actualizarSocio(req, res);

      expect(mockActualizar).toHaveBeenCalledWith('1', datosActualizados);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('debería retornar error si el socio no existe', async () => {
      req.params = { id: '999' };
      req.body = { nombre: 'Nuevo' };
      mockActualizar.mockResolvedValueOnce(null);

      await AdministradorController.actualizarSocio(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('cambiarEstadoSocio', () => {
    it('debería activar un socio exitosamente', async () => {
      const socioActualizado = {
        socio_id: 1,
        activo: true
      };

      req.params = { id: '1' };
      req.body = { activo: true };
      mockCambiarEstado.mockResolvedValueOnce(socioActualizado);

      await AdministradorController.cambiarEstadoSocio(req, res);

      expect(mockCambiarEstado).toHaveBeenCalledWith('1', true);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          mensaje: 'Socio activado exitosamente'
        })
      );
    });

    it('debería retornar error si falta el campo activo', async () => {
      req.params = { id: '1' };
      req.body = {};

      await AdministradorController.cambiarEstadoSocio(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('eliminarSocio', () => {
    it('debería eliminar un socio exitosamente', async () => {
      req.params = { id: '1' };
      mockEliminar.mockResolvedValueOnce(true);

      await AdministradorController.eliminarSocio(req, res);

      expect(mockEliminar).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('debería manejar error de foreign key constraint', async () => {
      const error = new Error('Foreign key constraint');
      error.code = '23503';

      req.params = { id: '1' };
      mockEliminar.mockRejectedValueOnce(error);

      await AdministradorController.eliminarSocio(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          mensaje: 'No se puede eliminar el socio porque tiene cuentas o reclamos asociados'
        })
      );
    });
  });

  describe('listarReclamos', () => {
    it('debería listar reclamos con filtros', async () => {
      const reclamos = [
        { reclamo_id: 1, descripcion: 'Problema' }
      ];
      const total = 1;

      req.query = { estado: 'PENDIENTE', prioridad: 'ALTA', pagina: '1', limite: '10' };
      mockListarTodos.mockResolvedValueOnce(reclamos);
      mockContarTodos.mockResolvedValueOnce(total);

      await AdministradorController.listarReclamos(req, res);

      expect(mockListarTodos).toHaveBeenCalledWith({
        estado: 'PENDIENTE',
        prioridadId: 1,
        tipo: undefined,
        busqueda: undefined,
        limite: 10,
        offset: 0
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          datos: expect.objectContaining({
            reclamos,
            total: 1,
            pagina: 1,
            limite: 10,
            totalPaginas: 1
          })
        })
      );
    });
  });

  describe('obtenerReclamo', () => {
    it('debería retornar un reclamo específico', async () => {
      const reclamo = {
        reclamo_id: 1,
        descripcion: 'Problema con medidor'
      };

      req.params = { id: '1' };
      mockObtenerPorId.mockResolvedValueOnce(reclamo);

      await AdministradorController.obtenerReclamo(req, res);

      expect(mockObtenerPorId).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('asignarOperarioReclamo', () => {
    it('debería asignar un operario a un reclamo', async () => {
      const reclamo = {
        reclamo_id: 1,
        operario_asignado_id: 5
      };

      req.params = { id: '1' };
      req.body = { operario_id: 5 };
      mockAsignarOperario.mockResolvedValueOnce(reclamo);

      await AdministradorController.asignarOperarioReclamo(req, res);

      expect(mockAsignarOperario).toHaveBeenCalledWith('1', 5);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('debería retornar error si falta el operario_id', async () => {
      req.params = { id: '1' };
      req.body = {};

      await AdministradorController.asignarOperarioReclamo(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('listarEmpleados', () => {
    it('debería listar empleados con filtros', async () => {
      const resultado = {
        empleados: [
          { empleado_id: 1, nombre: 'Pedro' }
        ],
        total: 1
      };

      req.query = { activo: 'true', pagina: '1', limite: '10' };
      mockListar.mockResolvedValueOnce(resultado);

      await AdministradorController.listarEmpleados(req, res);

      expect(mockListar).toHaveBeenCalledWith({
        activo: true,
        pagina: 1,
        limite: 10
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('crearCuenta', () => {
    it('debería crear una cuenta exitosamente', async () => {
      const datos = {
        socio_id: 1,
        direccion: 'Calle 123',
        servicio_id: 1
      };
      const cuenta = {
        cuenta_id: 1,
        ...datos
      };

      req.body = datos;
      mockCrear.mockResolvedValueOnce(cuenta);

      await AdministradorController.crearCuenta(req, res);

      expect(mockCrear).toHaveBeenCalledWith(datos);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('debería retornar error si faltan campos requeridos', async () => {
      req.body = { socio_id: 1 };

      await AdministradorController.crearCuenta(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('listarServicios', () => {
    it('debería listar todos los servicios', async () => {
      const servicios = [
        { servicio_id: 1, nombre: 'Residencial' }
      ];

      mockListarServicios.mockResolvedValueOnce(servicios);

      await AdministradorController.listarServicios(req, res);

      expect(mockListarServicios).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('listarCuentas', () => {
    it('debería listar cuentas con filtros', async () => {
      const resultado = {
        cuentas: [
          { cuenta_id: 1, numero_cuenta: '001' }
        ],
        total: 1
      };

      req.query = { activa: 'true', pagina: '1', limite: '50' };
      mockListarCuentas.mockResolvedValueOnce(resultado);

      await AdministradorController.listarCuentas(req, res);

      expect(mockListarCuentas).toHaveBeenCalledWith({
        activa: true,
        offset: 0,
        limite: 50,
        busqueda: undefined,
        orden: 'numero_cuenta',
        direccion: 'ASC'
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('obtenerStockBajo', () => {
    it('debería retornar materiales con stock bajo', async () => {
      const materiales = [
        { material_id: 1, nombre: 'Cable', stock_actual: 5, stock_minimo: 10 }
      ];

      mockObtenerStockBajo.mockResolvedValueOnce(materiales);

      await AdministradorController.obtenerStockBajo(req, res);

      expect(mockObtenerStockBajo).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('listarMateriales', () => {
    it('debería listar todos los materiales', async () => {
      const materiales = [
        { material_id: 1, nombre: 'Cable', stock_actual: 100 }
      ];

      mockListarTodosMateriales.mockResolvedValueOnce(materiales);

      await AdministradorController.listarMateriales(req, res);

      expect(mockListarTodosMateriales).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});

