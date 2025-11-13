import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockQuery = jest.fn();

jest.unstable_mockModule('../../../_lib/db.js', () => ({
  __esModule: true,
  default: {
    query: mockQuery
  }
}));

const { default: Material } = await import('../../../_lib/models/Material.js');

describe('Modelo Material', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockReset();
  });

  describe('obtenerStockBajo', () => {
    it('debería retornar materiales con stock bajo', async () => {
      const materiales = [
        { material_id: 1, codigo: 'MAT001', descripcion: 'Cable', stock_actual: 0, stock_minimo: 10, nivel_alerta: 'CRITICO' },
        { material_id: 2, codigo: 'MAT002', descripcion: 'Fusible', stock_actual: 5, stock_minimo: 10, nivel_alerta: 'BAJO' }
      ];
      mockQuery.mockResolvedValueOnce({ rows: materiales });

      const resultado = await Material.obtenerStockBajo();

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('FROM material'));
      expect(resultado).toEqual(materiales);
      expect(resultado).toHaveLength(2);
    });

    it('debería ordenar por nivel de alerta', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await Material.obtenerStockBajo();

      const [query] = mockQuery.mock.calls[0];
      expect(query).toContain('ORDER BY');
      expect(query).toContain('CASE');
    });
  });

  describe('listarTodos', () => {
    it('debería retornar todos los materiales activos', async () => {
      const materiales = [
        { material_id: 1, codigo: 'MAT001', descripcion: 'Cable', stock_actual: 100 },
        { material_id: 2, codigo: 'MAT002', descripcion: 'Fusible', stock_actual: 50 }
      ];
      mockQuery.mockResolvedValueOnce({ rows: materiales });

      const resultado = await Material.listarTodos();

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('FROM material'));
      expect(resultado).toEqual(materiales);
      expect(resultado).toHaveLength(2);
    });

    it('debería ordenar por descripción', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await Material.listarTodos();

      const [query] = mockQuery.mock.calls[0];
      expect(query).toContain('ORDER BY descripcion ASC');
    });
  });

  describe('obtenerResumenStock', () => {
    it('debería retornar resumen de stock', async () => {
      const resumen = {
        total_materiales: '50',
        con_stock_bajo: '5',
        sin_stock: '2',
        stock_normal: '43',
        valor_inventario_total: '150000'
      };
      mockQuery.mockResolvedValueOnce({ rows: [resumen] });

      const resultado = await Material.obtenerResumenStock();

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('FROM material'));
      expect(resultado).toEqual(resumen);
    });
  });

  describe('obtenerPorId', () => {
    it('debería retornar el material por ID', async () => {
      const material = {
        material_id: 1,
        codigo: 'MAT001',
        descripcion: 'Cable',
        unidad: 'metro',
        stock_actual: 100,
        stock_minimo: 10,
        costo_unitario: 50,
        activo: true
      };
      mockQuery.mockResolvedValueOnce({ rows: [material] });

      const resultado = await Material.obtenerPorId(1);

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('WHERE material_id = $1'), [1]);
      expect(resultado).toEqual(material);
    });

    it('debería retornar undefined si el material no existe', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const resultado = await Material.obtenerPorId(999);

      expect(resultado).toBeUndefined();
    });
  });

  describe('actualizarStock', () => {
    it('debería actualizar el stock del material', async () => {
      const materialActualizado = {
        material_id: 1,
        stock_actual: 150
      };
      mockQuery.mockResolvedValueOnce({ rows: [materialActualizado] });

      const resultado = await Material.actualizarStock(1, 150);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE material'),
        [1, 150]
      );
      expect(resultado).toEqual(materialActualizado);
    });

    it('debería permitir actualizar stock a cero', async () => {
      const materialActualizado = { material_id: 1, stock_actual: 0 };
      mockQuery.mockResolvedValueOnce({ rows: [materialActualizado] });

      const resultado = await Material.actualizarStock(1, 0);

      expect(resultado.stock_actual).toBe(0);
    });
  });
});

