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

const { default: UsoMaterial } = await import('../../../_lib/models/UsoMaterial.js');

describe('Modelo UsoMaterial', () => {
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

  describe('registrarMateriales', () => {
    it('debería registrar materiales y descontar stock en transacción', async () => {
      const ot = { ot_id: 1, reclamo_id: 5 };
      const materiales = [
        { material_id: 1, cantidad: 5 },
        { material_id: 2, cantidad: 3 }
      ];
      const stock1 = { stock_actual: 100 };
      const stock2 = { stock_actual: 50 };
      const uso1 = { uso_id: 1, ot_id: 1, material_id: 1, cantidad: 5 };
      const uso2 = { uso_id: 2, ot_id: 1, material_id: 2, cantidad: 3 };

      mockClientQuery
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [ot] }) // Verificar OT
        .mockResolvedValueOnce({ rows: [stock1] }) // Verificar stock material 1
        .mockResolvedValueOnce({ rows: [uso1] }) // INSERT uso material 1
        .mockResolvedValueOnce({}) // UPDATE stock material 1
        .mockResolvedValueOnce({ rows: [stock2] }) // Verificar stock material 2
        .mockResolvedValueOnce({ rows: [uso2] }) // INSERT uso material 2
        .mockResolvedValueOnce({}) // UPDATE stock material 2
        .mockResolvedValueOnce({}); // COMMIT

      const resultado = await UsoMaterial.registrarMateriales(1, 5, materiales);

      expect(mockClientQuery).toHaveBeenNthCalledWith(1, 'BEGIN');
      expect(mockClientQuery).toHaveBeenNthCalledWith(2, expect.stringContaining('SELECT ot_id'), [1, 5]);
      expect(mockClientQuery).toHaveBeenNthCalledWith(3, expect.stringContaining('SELECT stock_actual'), [1]);
      expect(mockClientQuery).toHaveBeenNthCalledWith(4, expect.stringContaining('INSERT INTO uso_material'), [1, 1, 5]);
      expect(mockClientQuery).toHaveBeenNthCalledWith(5, expect.stringContaining('UPDATE material SET stock_actual'), [5, 1]);
      expect(mockClientQuery).toHaveBeenNthCalledWith(9, 'COMMIT');
      expect(mockClientRelease).toHaveBeenCalled();
      expect(resultado).toHaveLength(2);
      expect(resultado[0]).toEqual(uso1);
      expect(resultado[1]).toEqual(uso2);
    });

    it('debería rechazar si la OT no está asignada al empleado', async () => {
      mockClientQuery
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [] }); // OT no encontrada

      await expect(UsoMaterial.registrarMateriales(1, 5, [{ material_id: 1, cantidad: 5 }])).rejects.toThrow('Orden de trabajo no encontrada o no asignada al empleado');
      expect(mockClientQuery).toHaveBeenCalledWith('ROLLBACK');
    });

    it('debería rechazar si el material no existe', async () => {
      const ot = { ot_id: 1, reclamo_id: 5 };
      mockClientQuery
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [ot] }) // Verificar OT
        .mockResolvedValueOnce({ rows: [] }); // Material no encontrado

      await expect(UsoMaterial.registrarMateriales(1, 5, [{ material_id: 999, cantidad: 5 }])).rejects.toThrow('Material 999 no encontrado');
      expect(mockClientQuery).toHaveBeenCalledWith('ROLLBACK');
    });

    it('debería rechazar si no hay stock suficiente', async () => {
      const ot = { ot_id: 1, reclamo_id: 5 };
      const stock = { stock_actual: 3 };
      mockClientQuery
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [ot] }) // Verificar OT
        .mockResolvedValueOnce({ rows: [stock] }); // Stock insuficiente

      await expect(UsoMaterial.registrarMateriales(1, 5, [{ material_id: 1, cantidad: 5 }])).rejects.toThrow('Stock insuficiente');
      expect(mockClientQuery).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('obtenerPorOT', () => {
    it('debería retornar materiales usados en una OT', async () => {
      const materiales = [
        { uso_material_id: 1, ot_id: 1, material_id: 1, cantidad: 5, material_nombre: 'Cable' },
        { uso_material_id: 2, ot_id: 1, material_id: 2, cantidad: 3, material_nombre: 'Fusible' }
      ];
      mockQuery.mockResolvedValueOnce({ rows: materiales });

      const resultado = await UsoMaterial.obtenerPorOT(1);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE um.ot_id = $1'),
        [1]
      );
      expect(resultado).toEqual(materiales);
      expect(resultado).toHaveLength(2);
    });
  });

  describe('obtenerPorReclamo', () => {
    it('debería retornar materiales usados en un reclamo', async () => {
      const materiales = [
        { uso_material_id: 1, reclamo_id: 5, material_id: 1, cantidad: 5 }
      ];
      mockQuery.mockResolvedValueOnce({ rows: materiales });

      const resultado = await UsoMaterial.obtenerPorReclamo(5);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE ot.reclamo_id = $1'),
        [5]
      );
      expect(resultado).toEqual(materiales);
    });
  });

  describe('listarMateriales', () => {
    it('debería retornar todos los materiales disponibles', async () => {
      const materiales = [
        { material_id: 1, codigo: 'MAT001', nombre: 'Cable', stock_actual: 100 },
        { material_id: 2, codigo: 'MAT002', nombre: 'Fusible', stock_actual: 50 }
      ];
      mockQuery.mockResolvedValueOnce({ rows: materiales });

      const resultado = await UsoMaterial.listarMateriales();

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('FROM material'));
      expect(resultado).toEqual(materiales);
      expect(resultado).toHaveLength(2);
    });
  });

  describe('eliminar', () => {
    it('debería eliminar un registro de uso de material', async () => {
      const usoMaterial = { uso_id: 1, ot_id: 1, material_id: 1, cantidad: 5 };

      mockClientQuery
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [usoMaterial] }) // Verificar uso
        .mockResolvedValueOnce({}) // DELETE
        .mockResolvedValueOnce({}); // COMMIT

      const resultado = await UsoMaterial.eliminar(1, 5);

      expect(mockClientQuery).toHaveBeenNthCalledWith(1, 'BEGIN');
      expect(mockClientQuery).toHaveBeenNthCalledWith(2, expect.stringContaining('SELECT'), [1]);
      expect(mockClientQuery).toHaveBeenNthCalledWith(3, expect.stringContaining('DELETE FROM uso_material'), [1]);
      expect(mockClientQuery).toHaveBeenNthCalledWith(4, 'COMMIT');
      expect(mockClientRelease).toHaveBeenCalled();
      expect(resultado.success).toBe(true);
    });

    it('debería rechazar si el uso de material no existe', async () => {
      mockClientQuery
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [] }); // Uso no encontrado

      await expect(UsoMaterial.eliminar(999, 5)).rejects.toThrow('Uso de material no encontrado');
      expect(mockClientQuery).toHaveBeenCalledWith('ROLLBACK');
    });
  });
});

