import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockQuery = jest.fn();

jest.unstable_mockModule('../../../_lib/db.js', () => ({
  __esModule: true,
  default: {
    query: mockQuery
  }
}));

const { default: Cuadrilla } = await import('../../../_lib/models/Cuadrilla.js');

describe('Modelo Cuadrilla', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockReset();
    console.error = jest.fn();
  });

  describe('obtenerCuadrillasActivas', () => {
    it('debería retornar todas las cuadrillas activas con conteo de miembros', async () => {
      const cuadrillas = [
        { cuadrilla_id: 1, nombre: 'Cuadrilla Norte', zona: 'Norte', miembros_count: '3' },
        { cuadrilla_id: 2, nombre: 'Cuadrilla Sur', zona: 'Sur', miembros_count: '2' }
      ];
      mockQuery.mockResolvedValueOnce({ rows: cuadrillas });

      const resultado = await Cuadrilla.obtenerCuadrillasActivas();

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('FROM cuadrilla c'));
      expect(resultado).toEqual(cuadrillas);
      expect(resultado).toHaveLength(2);
    });

    it('debería manejar errores correctamente', async () => {
      const error = new Error('DB error');
      mockQuery.mockRejectedValueOnce(error);

      await expect(Cuadrilla.obtenerCuadrillasActivas()).rejects.toThrow('DB error');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('obtenerPorId', () => {
    it('debería retornar la cuadrilla por ID', async () => {
      const cuadrilla = { cuadrilla_id: 1, nombre: 'Cuadrilla Norte', zona: 'Norte', activa: true };
      mockQuery.mockResolvedValueOnce({ rows: [cuadrilla] });

      const resultado = await Cuadrilla.obtenerPorId(1);

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('WHERE cuadrilla_id = $1'), [1]);
      expect(resultado).toEqual(cuadrilla);
    });

    it('debería retornar null si la cuadrilla no existe', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const resultado = await Cuadrilla.obtenerPorId(999);

      expect(resultado).toBeNull();
    });

    it('debería manejar errores correctamente', async () => {
      const error = new Error('DB error');
      mockQuery.mockRejectedValueOnce(error);

      await expect(Cuadrilla.obtenerPorId(1)).rejects.toThrow('DB error');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('obtenerOperariosDeCuadrilla', () => {
    it('debería retornar los operarios activos de una cuadrilla', async () => {
      const operarios = [
        { empleado_id: 1, nombre: 'Juan', apellido: 'Pérez', nombre_completo: 'Juan Pérez' },
        { empleado_id: 2, nombre: 'Pedro', apellido: 'García', nombre_completo: 'Pedro García' }
      ];
      mockQuery.mockResolvedValueOnce({ rows: operarios });

      const resultado = await Cuadrilla.obtenerOperariosDeCuadrilla(1);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE ec.cuadrilla_id = $1'),
        [1]
      );
      expect(resultado).toEqual(operarios);
      expect(resultado).toHaveLength(2);
    });

    it('debería retornar array vacío si no hay operarios', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const resultado = await Cuadrilla.obtenerOperariosDeCuadrilla(1);

      expect(resultado).toEqual([]);
    });

    it('debería manejar errores correctamente', async () => {
      const error = new Error('DB error');
      mockQuery.mockRejectedValueOnce(error);

      await expect(Cuadrilla.obtenerOperariosDeCuadrilla(1)).rejects.toThrow('DB error');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('obtenerCuadrillaPorOperario', () => {
    it('debería retornar la cuadrilla activa del operario', async () => {
      const cuadrilla = { cuadrilla_id: 1, nombre: 'Cuadrilla Norte', zona: 'Norte' };
      mockQuery.mockResolvedValueOnce({ rows: [cuadrilla] });

      const resultado = await Cuadrilla.obtenerCuadrillaPorOperario(5);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE ec.empleado_id = $1'),
        [5]
      );
      expect(resultado).toEqual(cuadrilla);
    });

    it('debería retornar null si el operario no tiene cuadrilla', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const resultado = await Cuadrilla.obtenerCuadrillaPorOperario(999);

      expect(resultado).toBeNull();
    });

    it('debería manejar errores correctamente', async () => {
      const error = new Error('DB error');
      mockQuery.mockRejectedValueOnce(error);

      await expect(Cuadrilla.obtenerCuadrillaPorOperario(5)).rejects.toThrow('DB error');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('obtenerOperariosDisponibles', () => {
    it('debería retornar todos los operarios técnicos disponibles', async () => {
      const operarios = [
        { empleado_id: 1, nombre: 'Juan', apellido: 'Pérez', cuadrilla: 'Cuadrilla Norte' },
        { empleado_id: 2, nombre: 'Pedro', apellido: 'García', cuadrilla: 'Cuadrilla Sur' }
      ];
      mockQuery.mockResolvedValueOnce({ rows: operarios });

      const resultado = await Cuadrilla.obtenerOperariosDisponibles();

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('FROM empleado e'));
      expect(resultado).toEqual(operarios);
      expect(resultado).toHaveLength(2);
    });

    it('debería excluir administradores', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await Cuadrilla.obtenerOperariosDisponibles();

      const [query] = mockQuery.mock.calls[0];
      expect(query).toContain("e.rol_interno NOT LIKE '%ADMINISTRADOR%'");
    });

    it('debería manejar errores correctamente', async () => {
      const error = new Error('DB error');
      mockQuery.mockRejectedValueOnce(error);

      await expect(Cuadrilla.obtenerOperariosDisponibles()).rejects.toThrow('DB error');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('obtenerEstadisticas', () => {
    it('debería retornar estadísticas de la cuadrilla', async () => {
      const estadisticas = {
        cuadrilla_id: 1,
        cuadrilla: 'Cuadrilla Norte',
        zona: 'Norte',
        total_operarios: '3',
        ots_asignadas: '5',
        ots_en_proceso: '2',
        ots_completadas: '10'
      };
      mockQuery.mockResolvedValueOnce({ rows: [estadisticas] });

      const resultado = await Cuadrilla.obtenerEstadisticas(1);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE c.cuadrilla_id = $1'),
        [1]
      );
      expect(resultado).toEqual(estadisticas);
    });

    it('debería retornar null si la cuadrilla no existe', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const resultado = await Cuadrilla.obtenerEstadisticas(999);

      expect(resultado).toBeNull();
    });

    it('debería manejar errores correctamente', async () => {
      const error = new Error('DB error');
      mockQuery.mockRejectedValueOnce(error);

      await expect(Cuadrilla.obtenerEstadisticas(1)).rejects.toThrow('DB error');
      expect(console.error).toHaveBeenCalled();
    });
  });
});

