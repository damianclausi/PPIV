import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockQuery = jest.fn();

jest.unstable_mockModule('../../../_lib/db.js', () => ({
  __esModule: true,
  default: {
    query: mockQuery
  }
}));

const { default: DetalleTipoReclamo } = await import('../../../_lib/models/DetalleTipoReclamo.js');

describe('Modelo DetalleTipoReclamo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockReset();
    console.error = jest.fn();
  });

  describe('obtenerTodos', () => {
    it('debería retornar todos los detalles con su tipo', async () => {
      const detalles = [
        { detalle_id: 1, nombre: 'Falta de Suministro', tipo_id: 1, tipo_nombre: 'TECNICO' },
        { detalle_id: 2, nombre: 'Facturación', tipo_id: 2, tipo_nombre: 'ADMINISTRATIVO' }
      ];
      mockQuery.mockResolvedValueOnce({ rows: detalles });

      const resultado = await DetalleTipoReclamo.obtenerTodos();

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('FROM detalle_tipo_reclamo d'));
      expect(resultado).toEqual(detalles);
      expect(resultado).toHaveLength(2);
    });

    it('debería manejar errores correctamente', async () => {
      const error = new Error('DB error');
      mockQuery.mockRejectedValueOnce(error);

      await expect(DetalleTipoReclamo.obtenerTodos()).rejects.toThrow('DB error');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('obtenerPorTipo', () => {
    it('debería retornar detalles de un tipo específico', async () => {
      const detalles = [
        { detalle_id: 1, nombre: 'Falta de Suministro', tipo_id: 1 },
        { detalle_id: 3, nombre: 'Fluctuaciones de Tensión', tipo_id: 1 }
      ];
      mockQuery.mockResolvedValueOnce({ rows: detalles });

      const resultado = await DetalleTipoReclamo.obtenerPorTipo(1);

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('WHERE d.tipo_id = $1'), [1]);
      expect(resultado).toEqual(detalles);
      expect(resultado).toHaveLength(2);
    });

    it('debería retornar array vacío si no hay detalles del tipo', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const resultado = await DetalleTipoReclamo.obtenerPorTipo(999);

      expect(resultado).toEqual([]);
    });

    it('debería manejar errores correctamente', async () => {
      const error = new Error('DB error');
      mockQuery.mockRejectedValueOnce(error);

      await expect(DetalleTipoReclamo.obtenerPorTipo(1)).rejects.toThrow('DB error');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('obtenerPorId', () => {
    it('debería retornar el detalle con su tipo', async () => {
      const detalle = {
        detalle_id: 1,
        nombre: 'Falta de Suministro',
        tipo_id: 1,
        tipo_nombre: 'TECNICO'
      };
      mockQuery.mockResolvedValueOnce({ rows: [detalle] });

      const resultado = await DetalleTipoReclamo.obtenerPorId(1);

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('WHERE d.detalle_id = $1'), [1]);
      expect(resultado).toEqual(detalle);
    });

    it('debería retornar undefined si el detalle no existe', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const resultado = await DetalleTipoReclamo.obtenerPorId(999);

      expect(resultado).toBeUndefined();
    });

    it('debería manejar errores correctamente', async () => {
      const error = new Error('DB error');
      mockQuery.mockRejectedValueOnce(error);

      await expect(DetalleTipoReclamo.obtenerPorId(1)).rejects.toThrow('DB error');
      expect(console.error).toHaveBeenCalled();
    });
  });
});

