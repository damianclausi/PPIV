import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockQuery = jest.fn();

jest.unstable_mockModule('../../../_lib/db.js', () => ({
  __esModule: true,
  default: {
    query: mockQuery
  }
}));

const { default: Servicio } = await import('../../../_lib/models/Servicio.js');

describe('Modelo Servicio', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockReset();
  });

  describe('listar', () => {
    it('debería retornar todos los servicios activos', async () => {
      const servicios = [
        { servicio_id: 1, nombre: 'Residencial', descripcion: 'Servicio residencial', activo: true },
        { servicio_id: 2, nombre: 'Comercial', descripcion: 'Servicio comercial', activo: true }
      ];
      mockQuery.mockResolvedValueOnce({ rows: servicios });

      const resultado = await Servicio.listar();

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('FROM servicio'));
      expect(resultado).toEqual(servicios);
      expect(resultado).toHaveLength(2);
    });

    it('debería ordenar por nombre', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await Servicio.listar();

      const [query] = mockQuery.mock.calls[0];
      expect(query).toContain('ORDER BY nombre');
    });

    it('debería filtrar solo servicios activos', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await Servicio.listar();

      const [query] = mockQuery.mock.calls[0];
      expect(query).toContain('WHERE activo = true');
    });
  });

  describe('obtenerPorId', () => {
    it('debería retornar el servicio por ID', async () => {
      const servicio = {
        servicio_id: 1,
        nombre: 'Residencial',
        descripcion: 'Servicio residencial',
        activo: true
      };
      mockQuery.mockResolvedValueOnce({ rows: [servicio] });

      const resultado = await Servicio.obtenerPorId(1);

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('WHERE servicio_id = $1'), [1]);
      expect(resultado).toEqual(servicio);
    });

    it('debería retornar undefined si el servicio no existe', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const resultado = await Servicio.obtenerPorId(999);

      expect(resultado).toBeUndefined();
    });
  });
});

