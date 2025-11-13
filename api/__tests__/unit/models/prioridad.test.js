import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockQuery = jest.fn();

jest.unstable_mockModule('../../../_lib/db.js', () => ({
  __esModule: true,
  default: {
    query: mockQuery
  }
}));

const { default: Prioridad } = await import('../../../_lib/models/Prioridad.js');

describe('Modelo Prioridad', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockReset();
    console.error = jest.fn();
  });

  describe('obtenerTodas', () => {
    it('debería retornar todas las prioridades activas ordenadas', async () => {
      const prioridades = [
        { prioridad_id: 1, nombre: 'Alta', orden: 1, color: 'red', activo: true },
        { prioridad_id: 2, nombre: 'Media', orden: 2, color: 'yellow', activo: true },
        { prioridad_id: 3, nombre: 'Baja', orden: 3, color: 'green', activo: true }
      ];
      mockQuery.mockResolvedValueOnce({ rows: prioridades });

      const resultado = await Prioridad.obtenerTodas();

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('FROM prioridad'));
      expect(resultado).toEqual(prioridades);
      expect(resultado).toHaveLength(3);
    });

    it('debería manejar errores correctamente', async () => {
      const error = new Error('DB error');
      mockQuery.mockRejectedValueOnce(error);

      await expect(Prioridad.obtenerTodas()).rejects.toThrow('Error al obtener prioridades');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('obtenerPorId', () => {
    it('debería retornar la prioridad por ID', async () => {
      const prioridad = { prioridad_id: 1, nombre: 'Alta', orden: 1, color: 'red', activo: true };
      mockQuery.mockResolvedValueOnce({ rows: [prioridad] });

      const resultado = await Prioridad.obtenerPorId(1);

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('WHERE prioridad_id = $1'), [1]);
      expect(resultado).toEqual(prioridad);
    });

    it('debería lanzar error si la prioridad no existe', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(Prioridad.obtenerPorId(999)).rejects.toThrow('Prioridad no encontrada');
      expect(console.error).toHaveBeenCalled();
    });

    it('debería manejar errores de base de datos', async () => {
      const error = new Error('DB error');
      mockQuery.mockRejectedValueOnce(error);

      await expect(Prioridad.obtenerPorId(1)).rejects.toThrow('DB error');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('obtenerPorNombre', () => {
    it('debería retornar la prioridad por nombre (case insensitive)', async () => {
      const prioridad = { prioridad_id: 1, nombre: 'Alta', orden: 1, color: 'red', activo: true };
      mockQuery.mockResolvedValueOnce({ rows: [prioridad] });

      const resultado = await Prioridad.obtenerPorNombre('alta');

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('LOWER(nombre) = LOWER($1)'), ['alta']);
      expect(resultado).toEqual(prioridad);
    });

    it('debería funcionar con mayúsculas', async () => {
      const prioridad = { prioridad_id: 2, nombre: 'Media', orden: 2, color: 'yellow', activo: true };
      mockQuery.mockResolvedValueOnce({ rows: [prioridad] });

      const resultado = await Prioridad.obtenerPorNombre('MEDIA');

      expect(resultado).toEqual(prioridad);
    });

    it('debería lanzar error si la prioridad no existe', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(Prioridad.obtenerPorNombre('INEXISTENTE')).rejects.toThrow('Prioridad no encontrada');
      expect(console.error).toHaveBeenCalled();
    });

    it('debería manejar errores de base de datos', async () => {
      const error = new Error('DB error');
      mockQuery.mockRejectedValueOnce(error);

      await expect(Prioridad.obtenerPorNombre('Alta')).rejects.toThrow('DB error');
      expect(console.error).toHaveBeenCalled();
    });
  });
});

