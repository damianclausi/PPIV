import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockQuery = jest.fn();

jest.unstable_mockModule('../../../_lib/db.js', () => ({
  __esModule: true,
  default: {
    query: mockQuery
  }
}));

const { default: Lectura } = await import('../../../_lib/models/Lectura.js');

describe('Modelo Lectura', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockReset();
  });

  describe('listarPorCuenta', () => {
    it('debería retornar lecturas de una cuenta con información relacionada', async () => {
      const lecturas = [
        {
          lectura_id: 1,
          fecha: '2024-01-15',
          estado_anterior: 1000,
          estado_actual: 1200,
          consumo: 200,
          numero_medidor: '000001'
        },
        {
          lectura_id: 2,
          fecha: '2024-02-15',
          estado_anterior: 1200,
          estado_actual: 1400,
          consumo: 200,
          numero_medidor: '000001'
        }
      ];
      mockQuery.mockResolvedValueOnce({ rows: lecturas });

      const resultado = await Lectura.listarPorCuenta(1);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE m.cuenta_id = $1'),
        [1]
      );
      expect(resultado).toEqual(lecturas);
      expect(resultado).toHaveLength(2);
    });

    it('debería limitar a 50 registros', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await Lectura.listarPorCuenta(1);

      const [query] = mockQuery.mock.calls[0];
      expect(query).toContain('LIMIT 50');
    });
  });

  describe('obtenerPorId', () => {
    it('debería retornar la lectura por ID', async () => {
      const lectura = {
        lectura_id: 1,
        cuenta_id: 5,
        fecha_lectura: '2024-01-15',
        lectura_anterior: 1000,
        lectura_actual: 1200,
        consumo_kwh: 200,
        numero_cuenta: '000001'
      };
      mockQuery.mockResolvedValueOnce({ rows: [lectura] });

      const resultado = await Lectura.obtenerPorId(1);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE l.lectura_id = $1'),
        [1]
      );
      expect(resultado).toEqual(lectura);
    });

    it('debería retornar undefined si la lectura no existe', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const resultado = await Lectura.obtenerPorId(999);

      expect(resultado).toBeUndefined();
    });
  });

  describe('crear', () => {
    it('debería crear una nueva lectura', async () => {
      const datos = {
        cuentaId: 1,
        fechaLectura: '2024-03-15',
        lecturaAnterior: 1400,
        lecturaActual: 1600,
        periodo: '2024-03',
        observaciones: 'Lectura normal'
      };
      const lecturaCreada = { lectura_id: 10, ...datos };
      mockQuery.mockResolvedValueOnce({ rows: [lecturaCreada] });

      const resultado = await Lectura.crear(datos);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO lectura'),
        [datos.cuentaId, datos.fechaLectura, datos.lecturaAnterior, datos.lecturaActual, datos.periodo, datos.observaciones]
      );
      expect(resultado).toEqual(lecturaCreada);
    });

    it('debería funcionar sin observaciones', async () => {
      const datos = {
        cuentaId: 1,
        fechaLectura: '2024-03-15',
        lecturaAnterior: 1400,
        lecturaActual: 1600,
        periodo: '2024-03',
        observaciones: null
      };
      const lecturaCreada = { lectura_id: 11, ...datos };
      mockQuery.mockResolvedValueOnce({ rows: [lecturaCreada] });

      const resultado = await Lectura.crear(datos);

      const [, params] = mockQuery.mock.calls[0];
      expect(params[5]).toBeNull(); // observaciones
      expect(resultado).toEqual(lecturaCreada);
    });
  });

  describe('obtenerEstadisticasPorCuenta', () => {
    it('debería retornar estadísticas de consumo', async () => {
      const estadisticas = {
        total_lecturas: '12',
        consumo_promedio: '200.5',
        consumo_maximo: '350',
        consumo_minimo: '150',
        consumo_total: '2406'
      };
      mockQuery.mockResolvedValueOnce({ rows: [estadisticas] });

      const resultado = await Lectura.obtenerEstadisticasPorCuenta(1);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE cuenta_id = $1'),
        [1]
      );
      expect(resultado).toEqual(estadisticas);
    });
  });
});

