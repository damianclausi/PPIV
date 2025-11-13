import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockQuery = jest.fn();

jest.unstable_mockModule('../../../_lib/db.js', () => ({
  __esModule: true,
  default: {
    query: mockQuery
  }
}));

const { default: TipoReclamo } = await import('../../../_lib/models/TipoReclamo.js');

describe('Modelo TipoReclamo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockReset();
    console.error = jest.fn();
  });

  describe('obtenerTodos', () => {
    it('debería retornar todos los tipos de reclamo activos', async () => {
      const tipos = [
        { tipo_id: 1, nombre: 'TECNICO', descripcion: 'Reclamos técnicos' },
        { tipo_id: 2, nombre: 'ADMINISTRATIVO', descripcion: 'Reclamos administrativos' }
      ];
      mockQuery.mockResolvedValueOnce({ rows: tipos });

      const resultado = await TipoReclamo.obtenerTodos();

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('FROM tipo_reclamo'));
      expect(resultado).toEqual(tipos);
      expect(resultado).toHaveLength(2);
    });

    it('debería manejar errores correctamente', async () => {
      const error = new Error('DB error');
      mockQuery.mockRejectedValueOnce(error);

      await expect(TipoReclamo.obtenerTodos()).rejects.toThrow('Error al obtener tipos de reclamo');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('obtenerPorId', () => {
    it('debería retornar el tipo de reclamo por ID', async () => {
      const tipo = { tipo_id: 1, nombre: 'TECNICO', descripcion: 'Reclamos técnicos' };
      mockQuery.mockResolvedValueOnce({ rows: [tipo] });

      const resultado = await TipoReclamo.obtenerPorId(1);

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('WHERE tipo_id = $1'), [1]);
      expect(resultado).toEqual(tipo);
    });

    it('debería lanzar error si el tipo no existe', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(TipoReclamo.obtenerPorId(999)).rejects.toThrow('Tipo de reclamo no encontrado');
      expect(console.error).toHaveBeenCalled();
    });

    it('debería manejar errores de base de datos', async () => {
      const error = new Error('DB error');
      mockQuery.mockRejectedValueOnce(error);

      await expect(TipoReclamo.obtenerPorId(1)).rejects.toThrow('DB error');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('obtenerPorNombre', () => {
    it('debería retornar el tipo por nombre (case insensitive)', async () => {
      const tipo = { tipo_id: 1, nombre: 'TECNICO', descripcion: 'Reclamos técnicos' };
      mockQuery.mockResolvedValueOnce({ rows: [tipo] });

      const resultado = await TipoReclamo.obtenerPorNombre('tecnico');

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('UPPER(nombre) = UPPER($1)'), ['tecnico']);
      expect(resultado).toEqual(tipo);
    });

    it('debería funcionar con mayúsculas', async () => {
      const tipo = { tipo_id: 2, nombre: 'ADMINISTRATIVO', descripcion: 'Reclamos administrativos' };
      mockQuery.mockResolvedValueOnce({ rows: [tipo] });

      const resultado = await TipoReclamo.obtenerPorNombre('ADMINISTRATIVO');

      expect(resultado).toEqual(tipo);
    });

    it('debería lanzar error si el tipo no existe', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(TipoReclamo.obtenerPorNombre('INEXISTENTE')).rejects.toThrow('Tipo de reclamo no encontrado');
      expect(console.error).toHaveBeenCalled();
    });

    it('debería manejar errores de base de datos', async () => {
      const error = new Error('DB error');
      mockQuery.mockRejectedValueOnce(error);

      await expect(TipoReclamo.obtenerPorNombre('TECNICO')).rejects.toThrow('DB error');
      expect(console.error).toHaveBeenCalled();
    });
  });
});

