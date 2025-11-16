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

const mockObtenerCuadrilla = jest.fn();

jest.unstable_mockModule('../../../_lib/models/Cuadrilla.js', () => ({
  __esModule: true,
  default: {
    obtenerCuadrillaPorOperario: mockObtenerCuadrilla
  }
}));

const { default: Reclamo } = await import('../../../_lib/models/Reclamo.js');

describe('Modelo Reclamo', () => {
  const originalConsoleLog = console.log;

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
    mockObtenerCuadrilla.mockReset();
    console.log = jest.fn();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
  });

  describe('obtenerPorSocio', () => {
    it('debería construir la query con filtros básicos', async () => {
      const filas = [{ reclamo_id: 1 }];
      mockQuery.mockResolvedValueOnce({ rows: filas });

      const resultado = await Reclamo.obtenerPorSocio(10, { limite: 5, offset: 2 });

      expect(mockQuery).toHaveBeenCalledTimes(1);
      const [query, params] = mockQuery.mock.calls[0];
      expect(query).toContain('WHERE c.socio_id = $1');
      expect(query).toContain('ORDER BY r.fecha_alta DESC');
      expect(params).toEqual([10, 5, 2]);
      expect(resultado).toEqual(filas);
    });

    it('debería incluir filtros de estado y cuenta', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await Reclamo.obtenerPorSocio(3, { estado: 'PENDIENTE', cuenta_id: 7, limite: 10, offset: 0 });

      const [, params] = mockQuery.mock.calls[0];
      expect(params).toEqual([3, 7, 'PENDIENTE', 10, 0]);
    });
  });

  describe('obtenerPorId', () => {
    it('debería retornar una fila cuando existe', async () => {
      const fila = { reclamo_id: 42 };
      mockQuery.mockResolvedValueOnce({ rows: [fila] });

      const resultado = await Reclamo.obtenerPorId(42);

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('WHERE r.reclamo_id = $1'), [42]);
      expect(resultado).toEqual(fila);
    });
  });

  describe('crear', () => {
    it('debería crear el reclamo y la OT asociada', async () => {
      const reclamo = { reclamo_id: 99, descripcion: 'Problema' };
      const tipoInfo = [{ tipo: 'TECNICO', detalle: 'Falla', direccion: 'Calle 123' }];

      mockClientQuery
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [reclamo] }) // INSERT reclamo
        .mockResolvedValueOnce({ rows: tipoInfo }) // info tipo
        .mockResolvedValueOnce({}) // INSERT OT
        .mockResolvedValueOnce({}); // COMMIT

      const resultado = await Reclamo.crear({ cuentaId: 1, detalleId: 2, descripcion: 'Problema', prioridadId: 3, canal: 'WEB' });

      expect(mockClientQuery).toHaveBeenNthCalledWith(1, 'BEGIN');
      expect(mockClientQuery).toHaveBeenNthCalledWith(2, expect.stringContaining('INSERT INTO reclamo'), [1, 2, 'Problema', 3, 'WEB']);
      expect(mockClientQuery).toHaveBeenNthCalledWith(3, expect.stringContaining('SELECT t.nombre as tipo'), [2, 1]);
      expect(mockClientQuery).toHaveBeenNthCalledWith(4, expect.stringContaining('INSERT INTO orden_trabajo'), [99, 'Calle 123', 'OT creada automáticamente para: Falla']);
      expect(mockClientQuery).toHaveBeenNthCalledWith(5, 'COMMIT');
      expect(mockClientRelease).toHaveBeenCalledTimes(1);
      expect(resultado).toEqual(reclamo);
    });

    it('debería crear el reclamo sin OT cuando no hay info de tipo', async () => {
      const reclamo = { reclamo_id: 10 };

      mockClientQuery
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [reclamo] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({});

      const resultado = await Reclamo.crear({ cuentaId: 5, detalleId: 6, descripcion: 'Sin OT' });

      expect(mockClientQuery).toHaveBeenCalledTimes(4);
      expect(mockClientQuery.mock.calls.some(([sql]) => sql.includes('INSERT INTO orden_trabajo'))).toBe(false);
      expect(resultado).toEqual(reclamo);
    });

    it('debería hacer rollback y relanzar el error', async () => {
      const error = new Error('DB error');

      mockClientQuery
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [{ reclamo_id: 1 }] })
        .mockRejectedValueOnce(error);

      await expect(Reclamo.crear({ cuentaId: 1, detalleId: 2, descripcion: 'fail' })).rejects.toThrow('DB error');

      expect(mockClientQuery).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClientRelease).toHaveBeenCalled();
    });
  });

  describe('actualizarEstado', () => {
    it('debería actualizar el estado y sincronizar la OT', async () => {
      const reclamoActualizado = { reclamo_id: 5, estado: 'EN_PROCESO' };

      mockClientQuery
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [reclamoActualizado], rowCount: 1 }) // UPDATE reclamo
        .mockResolvedValueOnce({ rows: [{ ot_id: 12, estado: 'EN_PROCESO' }], rowCount: 1 }) // UPDATE OT
        .mockResolvedValueOnce({}); // COMMIT

      const resultado = await Reclamo.actualizarEstado(5, 'EN_PROCESO');

      expect(mockClientQuery).toHaveBeenNthCalledWith(2, expect.stringContaining('UPDATE reclamo'), ['EN_PROCESO', 5]);
      expect(mockClientQuery).toHaveBeenNthCalledWith(3, expect.stringContaining('UPDATE orden_trabajo'), [5]);
      expect(mockClientQuery).toHaveBeenNthCalledWith(4, 'COMMIT');
      expect(resultado).toEqual(reclamoActualizado);
    });

    it('debería lanzar error si el reclamo no existe', async () => {
      mockClientQuery
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({});

      await expect(Reclamo.actualizarEstado(99, 'RESUELTO')).rejects.toThrow('Reclamo no encontrado');
      expect(mockClientQuery).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('obtenerResumen', () => {
    it('debería retornar el resumen de estados', async () => {
      const resumen = { pendientes: '3', en_proceso: '2', resueltos: '1' };
      mockQuery.mockResolvedValueOnce({ rows: [resumen] });

      const resultado = await Reclamo.obtenerResumen(4);

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('WHERE c.socio_id = $1'), [4]);
      expect(resultado).toEqual(resumen);
    });
  });

  describe('listarTodos', () => {
    it('debería aplicar filtros y paginación', async () => {
      const filas = [{ reclamo_id: 1 }];
      mockQuery.mockResolvedValueOnce({ rows: filas });

      const resultado = await Reclamo.listarTodos({ estado: 'PENDIENTE', prioridadId: 2, tipo: 'Tecnico', busqueda: 'Juan', limite: 20, offset: 5 });

      const [query, params] = mockQuery.mock.calls[0];
      expect(query).toContain('ORDER BY r.fecha_alta DESC');
      expect(params).toEqual(['PENDIENTE', 2, 'TECNICO', '%Juan%', 20, 5]);
      expect(resultado).toEqual(filas);
    });
  });

  describe('contarTodos', () => {
    it('debería retornar el total filtrado', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ total: '15' }] });

      const resultado = await Reclamo.contarTodos({ estado: 'RESUELTO', prioridadId: 1 });

      const [, params] = mockQuery.mock.calls[0];
      expect(params).toEqual(['RESUELTO', 1]);
      expect(resultado).toBe(15);
    });
  });

  describe('obtenerPorOperario', () => {
    it('debería consultar reclamos del operario considerando su cuadrilla', async () => {
      mockObtenerCuadrilla.mockResolvedValueOnce({ cuadrilla_id: 7 });
      mockQuery.mockResolvedValueOnce({ rows: [{ reclamo_id: 1, total: '1' }] });

      const resultado = await Reclamo.obtenerPorOperario(3, { estado: 'PENDIENTE', pagina: 2, limite: 10 });

      expect(mockObtenerCuadrilla).toHaveBeenCalledWith(3);
      const [query, params] = mockQuery.mock.calls[0];
      expect(query).toContain('ot.empleado_id = $1');
      expect(query).toContain('OR i.cuadrilla_id = $2');
      expect(params).toEqual([3, 7, 'PENDIENTE', 10, 10]);
      expect(resultado.reclamos).toHaveLength(1);
      expect(resultado.total).toBe('1');
      expect(resultado.pagina).toBe(2);
      expect(resultado.totalPaginas).toBe(1);
    });

    it('debería funcionar cuando el operario no tiene cuadrilla', async () => {
      mockObtenerCuadrilla.mockResolvedValueOnce(null);
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const resultado = await Reclamo.obtenerPorOperario(5, {});

      const [query, params] = mockQuery.mock.calls[0];
      expect(query).not.toContain('OR i.cuadrilla_id = $2');
      expect(params).toEqual([5, 10, 0]);
      expect(resultado.reclamos).toEqual([]);
      expect(resultado.total).toBe(0);
      expect(resultado.totalPaginas).toBe(0);
    });
  });

  describe('obtenerResumenPorOperario', () => {
    it('debería considerar la cuadrilla del operario', async () => {
      mockObtenerCuadrilla.mockResolvedValueOnce({ cuadrilla_id: 4 });
      const resumen = { pendientes: '2', en_proceso: '1', resueltos_hoy: '0', total: '3' };
      mockQuery.mockResolvedValueOnce({ rows: [resumen] });

      const resultado = await Reclamo.obtenerResumenPorOperario(8);

      expect(mockObtenerCuadrilla).toHaveBeenCalledWith(8);
      const [, params] = mockQuery.mock.calls[0];
      expect(params).toEqual([8, 4]);
      expect(resultado).toEqual(resumen);
    });

    it('debería funcionar cuando no hay cuadrilla asociada', async () => {
      mockObtenerCuadrilla.mockResolvedValueOnce(null);
      const resumen = { pendientes: '1', en_proceso: '0', resueltos_hoy: '0', total: '1' };
      mockQuery.mockResolvedValueOnce({ rows: [resumen] });

      const resultado = await Reclamo.obtenerResumenPorOperario(9);

      const [, params] = mockQuery.mock.calls[0];
      expect(params).toEqual([9]);
      expect(resultado).toEqual(resumen);
    });
  });

  describe('obtenerResumenGeneral', () => {
    it('debería retornar métricas agregadas', async () => {
      const resumen = { pendientes: '5', en_proceso: '3', resueltos: '7', total: '15' };
      mockQuery.mockResolvedValueOnce({ rows: [resumen] });

      const resultado = await Reclamo.obtenerResumenGeneral();

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('FROM reclamo'));
      expect(resultado).toEqual(resumen);
    });
  });

  describe('asignarOperario', () => {
    it('debería actualizar y retornar el reclamo asignado', async () => {
      const fila = { reclamo_id: 1, operario_asignado_id: 5 };
      mockQuery.mockResolvedValueOnce({ rows: [fila] });

      const resultado = await Reclamo.asignarOperario(1, 5);

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('UPDATE reclamo'), [5, 1]);
      expect(resultado).toEqual(fila);
    });
  });

  describe('listarPorCuenta', () => {
    it('debería listar reclamos asociados a una cuenta', async () => {
      const filas = [{ reclamo_id: 11 }];
      mockQuery.mockResolvedValueOnce({ rows: filas });

      const resultado = await Reclamo.listarPorCuenta(22);

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('WHERE r.cuenta_id = $1'), [22]);
      expect(resultado).toEqual(filas);
    });
  });
});
