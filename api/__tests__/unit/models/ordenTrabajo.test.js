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

const { default: OrdenTrabajo } = await import('../../../_lib/models/OrdenTrabajo.js');

describe('Modelo OrdenTrabajo', () => {
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
    console.log = jest.fn();
    console.error = jest.fn();
  });

  describe('crear', () => {
    it('debería crear una OT con todos los parámetros', async () => {
      const datos = {
        reclamoId: 1,
        empleadoId: 5,
        direccionIntervencion: 'Calle 123',
        observaciones: 'Observaciones iniciales'
      };
      const otCreada = { ot_id: 10, ...datos, estado: 'PENDIENTE' };
      mockQuery.mockResolvedValueOnce({ rows: [otCreada] });

      const resultado = await OrdenTrabajo.crear(datos);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO orden_trabajo'),
        [datos.reclamoId, datos.empleadoId, datos.direccionIntervencion, datos.observaciones]
      );
      expect(resultado).toEqual(otCreada);
    });

    it('debería crear OT administrativa sin empleado', async () => {
      const datos = {
        reclamoId: 2,
        empleadoId: null,
        direccionIntervencion: null,
        observaciones: null
      };
      const otCreada = { ot_id: 11, ...datos, estado: 'PENDIENTE' };
      mockQuery.mockResolvedValueOnce({ rows: [otCreada] });

      const resultado = await OrdenTrabajo.crear(datos);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO orden_trabajo'),
        [datos.reclamoId, null, null, null]
      );
      expect(resultado).toEqual(otCreada);
    });
  });

  describe('listarAdministrativas', () => {
    it('debería listar OTs administrativas con filtros', async () => {
      const ots = [
        { ot_id: 1, estado_ot: 'PENDIENTE', reclamo_id: 1 },
        { ot_id: 2, estado_ot: 'EN_PROCESO', reclamo_id: 2 }
      ];
      mockQuery.mockResolvedValueOnce({ rows: ots });

      const resultado = await OrdenTrabajo.listarAdministrativas({ estado: 'PENDIENTE', limite: 10, offset: 0 });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE ot.empleado_id IS NULL'),
        ['PENDIENTE', 10, 0]
      );
      expect(resultado).toEqual(ots);
    });

    it('debería listar todas las OTs administrativas sin filtro de estado', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await OrdenTrabajo.listarAdministrativas({ limite: 20, offset: 5 });

      const [, params] = mockQuery.mock.calls[0];
      expect(params).toEqual([20, 5]);
    });
  });

  describe('obtenerAdministrativaPorId', () => {
    it('debería retornar la OT administrativa por ID', async () => {
      const ot = { ot_id: 1, estado: 'PENDIENTE', reclamo_id: 1 };
      mockQuery.mockResolvedValueOnce({ rows: [ot] });

      const resultado = await OrdenTrabajo.obtenerAdministrativaPorId(1);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE ot.ot_id = $1'),
        [1]
      );
      expect(resultado).toEqual(ot);
    });

    it('debería retornar undefined si la OT no existe', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const resultado = await OrdenTrabajo.obtenerAdministrativaPorId(999);

      expect(resultado).toBeUndefined();
    });
  });

  describe('cerrarAdministrativa', () => {
    it('debería cerrar la OT y el reclamo asociado en transacción', async () => {
      const ot = { ot_id: 1, reclamo_id: 5, estado: 'CERRADO' };

      mockClientQuery
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [ot] }) // UPDATE OT
        .mockResolvedValueOnce({ rows: [{ reclamo_id: 5 }] }) // UPDATE reclamo
        .mockResolvedValueOnce({}); // COMMIT

      const resultado = await OrdenTrabajo.cerrarAdministrativa(1, { observaciones: 'Trabajo completado' });

      expect(mockClientQuery).toHaveBeenNthCalledWith(1, 'BEGIN');
      expect(mockClientQuery).toHaveBeenNthCalledWith(2, expect.stringContaining('UPDATE orden_trabajo'), ['Trabajo completado', 1]);
      expect(mockClientQuery).toHaveBeenNthCalledWith(3, expect.stringContaining('UPDATE reclamo'), ['Trabajo completado', 5]);
      expect(mockClientQuery).toHaveBeenNthCalledWith(4, 'COMMIT');
      expect(mockClientRelease).toHaveBeenCalled();
      expect(resultado).toEqual(ot);
    });

    it('debería lanzar error si las observaciones están vacías', async () => {
      await expect(OrdenTrabajo.cerrarAdministrativa(1, { observaciones: '' })).rejects.toThrow('Las observaciones son obligatorias');
    });

    it('debería lanzar error si la OT no existe', async () => {
      mockClientQuery
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [] }); // UPDATE OT sin resultados

      await expect(OrdenTrabajo.cerrarAdministrativa(999, { observaciones: 'Test' })).rejects.toThrow('OT administrativa no encontrada');
      expect(mockClientQuery).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('marcarEnProcesoAdministrativa', () => {
    it('debería marcar OT y reclamo como EN_PROCESO', async () => {
      const ot = { ot_id: 1, reclamo_id: 5, estado: 'EN_PROCESO' };

      mockClientQuery
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [ot] }) // UPDATE OT
        .mockResolvedValueOnce({}) // UPDATE reclamo
        .mockResolvedValueOnce({}); // COMMIT

      const resultado = await OrdenTrabajo.marcarEnProcesoAdministrativa(1, 'Observaciones');

      expect(mockClientQuery).toHaveBeenNthCalledWith(2, expect.stringContaining('UPDATE orden_trabajo'), [1, 'Observaciones']);
      expect(mockClientQuery).toHaveBeenNthCalledWith(3, expect.stringContaining('UPDATE reclamo'), [5]);
      expect(resultado).toEqual(ot);
    });

    it('debería tratar observaciones vacías como null', async () => {
      const ot = { ot_id: 1, reclamo_id: 5 };
      mockClientQuery
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [ot] })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});

      await OrdenTrabajo.marcarEnProcesoAdministrativa(1, '');

      const [, params] = mockClientQuery.mock.calls[1];
      expect(params[1]).toBeNull();
    });
  });

  describe('contarAdministrativas', () => {
    it('debería retornar conteo de OTs administrativas por estado', async () => {
      const conteo = {
        pendientes: '5',
        en_proceso: '3',
        cerradas: '10',
        total: '18',
        nuevas_hoy: '2'
      };
      mockQuery.mockResolvedValueOnce({ rows: [conteo] });

      const resultado = await OrdenTrabajo.contarAdministrativas();

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('FROM orden_trabajo ot'));
      expect(resultado).toEqual(conteo);
    });
  });

  describe('listarTecnicas', () => {
    it('debería listar OTs técnicas con filtros', async () => {
      const ots = [
        { ot_id: 1, estado: 'ASIGNADA', empleado_id: 5 },
        { ot_id: 2, estado: 'EN_PROCESO', empleado_id: 6 }
      ];
      mockQuery.mockResolvedValueOnce({ rows: ots });

      const resultado = await OrdenTrabajo.listarTecnicas({ estado: 'ASIGNADA', empleadoId: 5, limite: 10, offset: 0 });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE ot.empleado_id IS NOT NULL'),
        ['ASIGNADA', 5, 10, 0]
      );
      expect(resultado).toEqual(ots);
    });

    it('debería aplicar filtro de cuadrilla', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await OrdenTrabajo.listarTecnicas({ cuadrillaId: 2, limite: 20, offset: 5 });

      const [, params] = mockQuery.mock.calls[0];
      expect(params).toEqual([2, 20, 5]);
    });
  });

  describe('asignarOperario', () => {
    it('debería asignar operario a OT y actualizar reclamo', async () => {
      const empleado = { empleado_id: 5, activo: true };
      const ot = { ot_id: 1, empleado_id: 5, estado: 'ASIGNADA', reclamo_id: 3 };

      mockClientQuery
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [empleado] }) // Validar empleado
        .mockResolvedValueOnce({ rows: [ot] }) // UPDATE OT
        .mockResolvedValueOnce({}) // UPDATE reclamo
        .mockResolvedValueOnce({}); // COMMIT

      const resultado = await OrdenTrabajo.asignarOperario(1, 5);

      expect(mockClientQuery).toHaveBeenNthCalledWith(2, expect.stringContaining('SELECT empleado_id'), [5]);
      expect(mockClientQuery).toHaveBeenNthCalledWith(3, expect.stringContaining('UPDATE orden_trabajo'), [5, 1]);
      expect(mockClientQuery).toHaveBeenNthCalledWith(4, expect.stringContaining('UPDATE reclamo'), [1]);
      expect(resultado).toEqual(ot);
    });

    it('debería lanzar error si el empleado no existe', async () => {
      mockClientQuery
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // Empleado no encontrado

      await expect(OrdenTrabajo.asignarOperario(1, 999)).rejects.toThrow('Empleado no encontrado o inactivo');
      expect(mockClientQuery).toHaveBeenCalledWith('ROLLBACK');
    });

    it('debería lanzar error si la OT no está pendiente', async () => {
      const empleado = { empleado_id: 5, activo: true };
      mockClientQuery
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [empleado], rowCount: 1 }) // Validar empleado
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // UPDATE OT sin resultados

      await expect(OrdenTrabajo.asignarOperario(1, 5)).rejects.toThrow('OT no encontrada o no está en estado PENDIENTE');
      expect(mockClientQuery).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('iniciarTrabajo', () => {
    it('debería cambiar estado de ASIGNADA a EN_PROCESO', async () => {
      const ot = { ot_id: 1, empleado_id: 5, estado: 'EN_PROCESO' };

      mockClientQuery
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [ot] }) // UPDATE OT
        .mockResolvedValueOnce({}); // COMMIT

      const resultado = await OrdenTrabajo.iniciarTrabajo(1, 5);

      expect(mockClientQuery).toHaveBeenNthCalledWith(2, expect.stringContaining('UPDATE orden_trabajo'), [1, 5]);
      expect(resultado).toEqual(ot);
    });

    it('debería lanzar error si la OT no está asignada al operario', async () => {
      mockClientQuery
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // UPDATE sin resultados

      await expect(OrdenTrabajo.iniciarTrabajo(1, 5)).rejects.toThrow('OT no encontrada, no asignada a este operario');
      expect(mockClientQuery).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('completarTrabajo', () => {
    it('debería completar el trabajo y actualizar reclamo', async () => {
      const ot = { ot_id: 1, empleado_id: 5, reclamo_id: 3, estado: 'COMPLETADA' };
      const validacion = {
        ot_id: 1,
        operario_asignado: 5,
        cuadrilla_asignada: 1,
        cuadrilla_operario: 1,
        estado: 'EN_PROCESO'
      };

      mockClientQuery
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [validacion] }) // Validación
        .mockResolvedValueOnce({ rows: [ot] }) // UPDATE OT
        .mockResolvedValueOnce({}) // UPDATE reclamo
        .mockResolvedValueOnce({}); // COMMIT

      const resultado = await OrdenTrabajo.completarTrabajo(1, 5, 'Trabajo completado exitosamente');

      expect(mockClientQuery).toHaveBeenNthCalledWith(2, expect.stringContaining('SELECT'), expect.any(Array));
      expect(mockClientQuery).toHaveBeenNthCalledWith(3, expect.stringContaining('UPDATE orden_trabajo'), expect.arrayContaining(['Trabajo completado exitosamente', 1]));
      expect(resultado).toEqual(ot);
    });

    it('debería lanzar error si las observaciones están vacías', async () => {
      await expect(OrdenTrabajo.completarTrabajo(1, 5, '')).rejects.toThrow('Las observaciones son requeridas');
    });

    it('debería lanzar error si las observaciones son solo espacios', async () => {
      await expect(OrdenTrabajo.completarTrabajo(1, 5, '   ')).rejects.toThrow('Las observaciones son requeridas');
    });
  });
});

