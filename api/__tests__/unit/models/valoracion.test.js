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

const { default: Valoracion } = await import('../../../_lib/models/Valoracion.js');

describe('Modelo Valoracion', () => {
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
    console.error = jest.fn();
  });

  describe('crear', () => {
    it('debería crear una valoración válida', async () => {
      const datos = {
        reclamoId: 1,
        socioId: 5,
        calificacion: 5,
        comentario: 'Excelente servicio'
      };
      const reclamo = { reclamo_id: 1, estado: 'RESUELTO', socio_id: 5 };
      const valoracionCreada = { valoracion_id: 10, ...datos };

      mockClientQuery
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [reclamo] }) // Verificar reclamo
        .mockResolvedValueOnce({ rows: [] }) // Verificar valoración existente
        .mockResolvedValueOnce({ rows: [valoracionCreada] }) // INSERT valoración
        .mockResolvedValueOnce({}); // COMMIT

      const resultado = await Valoracion.crear(datos);

      expect(mockClientQuery).toHaveBeenNthCalledWith(1, 'BEGIN');
      expect(mockClientQuery).toHaveBeenNthCalledWith(2, expect.stringContaining('SELECT r.reclamo_id'), [1]);
      expect(mockClientQuery).toHaveBeenNthCalledWith(3, expect.stringContaining('SELECT valoracion_id'), [1, 5]);
      expect(mockClientQuery).toHaveBeenNthCalledWith(4, expect.stringContaining('INSERT INTO valoracion'), [1, 5, 5, 'Excelente servicio']);
      expect(mockClientQuery).toHaveBeenNthCalledWith(5, 'COMMIT');
      expect(mockClientRelease).toHaveBeenCalled();
      expect(resultado).toEqual(valoracionCreada);
    });

    it('debería rechazar reclamo no encontrado', async () => {
      mockClientQuery
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [] }); // Reclamo no existe

      await expect(Valoracion.crear({ reclamoId: 999, socioId: 5, calificacion: 5 })).rejects.toThrow('Reclamo no encontrado');
      expect(mockClientQuery).toHaveBeenCalledWith('ROLLBACK');
    });

    it('debería rechazar reclamo no resuelto', async () => {
      const reclamo = { reclamo_id: 1, estado: 'PENDIENTE', socio_id: 5 };
      mockClientQuery
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [reclamo] }); // Reclamo pendiente

      await expect(Valoracion.crear({ reclamoId: 1, socioId: 5, calificacion: 5 })).rejects.toThrow('Solo se pueden valorar reclamos resueltos o cerrados');
      expect(mockClientQuery).toHaveBeenCalledWith('ROLLBACK');
    });

    it('debería rechazar si el socio no es dueño del reclamo', async () => {
      const reclamo = { reclamo_id: 1, estado: 'RESUELTO', socio_id: 5 };
      mockClientQuery
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [reclamo] }); // Reclamo de otro socio

      await expect(Valoracion.crear({ reclamoId: 1, socioId: 10, calificacion: 5 })).rejects.toThrow('No tienes permiso para valorar este reclamo');
      expect(mockClientQuery).toHaveBeenCalledWith('ROLLBACK');
    });

    it('debería rechazar calificación inválida', async () => {
      const reclamo = { reclamo_id: 1, estado: 'RESUELTO', socio_id: 5 };
      mockClientQuery
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [reclamo] }); // Reclamo válido

      await expect(Valoracion.crear({ reclamoId: 1, socioId: 5, calificacion: 6 })).rejects.toThrow('La calificación debe estar entre 1 y 5');
      expect(mockClientQuery).toHaveBeenCalledWith('ROLLBACK');
    });

    it('debería rechazar si ya existe una valoración', async () => {
      const reclamo = { reclamo_id: 1, estado: 'RESUELTO', socio_id: 5 };
      mockClientQuery
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [reclamo] }) // Reclamo válido
        .mockResolvedValueOnce({ rows: [{ valoracion_id: 1 }] }); // Ya existe valoración

      await expect(Valoracion.crear({ reclamoId: 1, socioId: 5, calificacion: 5 })).rejects.toThrow('Ya has valorado este reclamo');
      expect(mockClientQuery).toHaveBeenCalledWith('ROLLBACK');
    });

    it('debería funcionar sin comentario', async () => {
      const datos = { reclamoId: 1, socioId: 5, calificacion: 4 };
      const reclamo = { reclamo_id: 1, estado: 'RESUELTO', socio_id: 5 };
      const valoracionCreada = { valoracion_id: 11, ...datos, comentario: null };

      mockClientQuery
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [reclamo] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [valoracionCreada] })
        .mockResolvedValueOnce({});

      const resultado = await Valoracion.crear(datos);

      const [, params] = mockClientQuery.mock.calls[3];
      expect(params[3]).toBeNull(); // comentario
      expect(resultado).toEqual(valoracionCreada);
    });
  });

  describe('obtenerPorReclamo', () => {
    it('debería retornar la valoración del reclamo', async () => {
      const valoracion = {
        valoracion_id: 1,
        reclamo_id: 5,
        calificacion: 5,
        socio_nombre: 'Juan',
        socio_apellido: 'Pérez'
      };
      mockQuery.mockResolvedValueOnce({ rows: [valoracion] });

      const resultado = await Valoracion.obtenerPorReclamo(5);

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('WHERE v.reclamo_id = $1'), [5]);
      expect(resultado).toEqual(valoracion);
    });

    it('debería retornar null si no hay valoración', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const resultado = await Valoracion.obtenerPorReclamo(999);

      expect(resultado).toBeNull();
    });

    it('debería manejar errores correctamente', async () => {
      const error = new Error('DB error');
      mockQuery.mockRejectedValueOnce(error);

      await expect(Valoracion.obtenerPorReclamo(5)).rejects.toThrow('DB error');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('obtenerPorSocio', () => {
    it('debería retornar todas las valoraciones del socio', async () => {
      const valoraciones = [
        { valoracion_id: 1, reclamo_id: 1, calificacion: 5 },
        { valoracion_id: 2, reclamo_id: 2, calificacion: 4 }
      ];
      mockQuery.mockResolvedValueOnce({ rows: valoraciones });

      const resultado = await Valoracion.obtenerPorSocio(5);

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('WHERE v.socio_id = $1'), [5]);
      expect(resultado).toEqual(valoraciones);
      expect(resultado).toHaveLength(2);
    });

    it('debería manejar errores correctamente', async () => {
      const error = new Error('DB error');
      mockQuery.mockRejectedValueOnce(error);

      await expect(Valoracion.obtenerPorSocio(5)).rejects.toThrow('DB error');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('actualizar', () => {
    it('debería actualizar la valoración del socio', async () => {
      const valoracion = { valoracion_id: 1, socio_id: 5 };
      const valoracionActualizada = { valoracion_id: 1, calificacion: 4, comentario: 'Actualizado' };

      mockClientQuery
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [valoracion] }) // Verificar valoración
        .mockResolvedValueOnce({ rows: [valoracionActualizada] }) // UPDATE
        .mockResolvedValueOnce({}); // COMMIT

      const resultado = await Valoracion.actualizar(1, 5, { calificacion: 4, comentario: 'Actualizado' });

      expect(mockClientQuery).toHaveBeenNthCalledWith(2, expect.stringContaining('SELECT valoracion_id'), [1]);
      expect(mockClientQuery).toHaveBeenNthCalledWith(3, expect.stringContaining('UPDATE valoracion'), [4, 'Actualizado', 1]);
      expect(resultado).toEqual(valoracionActualizada);
    });

    it('debería rechazar si la valoración no existe', async () => {
      mockClientQuery
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [] }); // Valoración no existe

      await expect(Valoracion.actualizar(999, 5, { calificacion: 5, comentario: 'Test' })).rejects.toThrow('Valoración no encontrada');
      expect(mockClientQuery).toHaveBeenCalledWith('ROLLBACK');
    });

    it('debería rechazar si el socio no es dueño', async () => {
      const valoracion = { valoracion_id: 1, socio_id: 5 };
      mockClientQuery
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [valoracion] }); // Valoración de otro socio

      await expect(Valoracion.actualizar(1, 10, { calificacion: 5, comentario: 'Test' })).rejects.toThrow('No tienes permiso para modificar esta valoración');
      expect(mockClientQuery).toHaveBeenCalledWith('ROLLBACK');
    });

    it('debería rechazar calificación inválida', async () => {
      const valoracion = { valoracion_id: 1, socio_id: 5 };
      mockClientQuery
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [valoracion] }); // Valoración válida

      await expect(Valoracion.actualizar(1, 5, { calificacion: 0, comentario: 'Test' })).rejects.toThrow('La calificación debe estar entre 1 y 5');
      expect(mockClientQuery).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('eliminar', () => {
    it('debería eliminar la valoración del socio', async () => {
      const valoracion = { valoracion_id: 1, socio_id: 5 };

      mockClientQuery
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [valoracion] }) // Verificar valoración
        .mockResolvedValueOnce({}) // DELETE
        .mockResolvedValueOnce({}); // COMMIT

      const resultado = await Valoracion.eliminar(1, 5);

      expect(mockClientQuery).toHaveBeenNthCalledWith(2, expect.stringContaining('SELECT valoracion_id'), [1]);
      expect(mockClientQuery).toHaveBeenNthCalledWith(3, expect.stringContaining('DELETE FROM valoracion'), [1]);
      expect(resultado).toBe(true);
    });

    it('debería rechazar si la valoración no existe', async () => {
      mockClientQuery
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [] }); // Valoración no existe

      await expect(Valoracion.eliminar(999, 5)).rejects.toThrow('Valoración no encontrada');
      expect(mockClientQuery).toHaveBeenCalledWith('ROLLBACK');
    });

    it('debería rechazar si el socio no es dueño', async () => {
      const valoracion = { valoracion_id: 1, socio_id: 5 };
      mockClientQuery
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [valoracion] }); // Valoración de otro socio

      await expect(Valoracion.eliminar(1, 10)).rejects.toThrow('No tienes permiso para eliminar esta valoración');
      expect(mockClientQuery).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('obtenerEstadisticas', () => {
    it('debería retornar estadísticas de valoraciones', async () => {
      const estadisticas = {
        total_valoraciones: '100',
        promedio_calificacion: '4.5',
        cinco_estrellas: '50',
        cuatro_estrellas: '30',
        tres_estrellas: '10',
        dos_estrellas: '5',
        una_estrella: '5',
        con_comentario: '80'
      };
      mockQuery.mockResolvedValueOnce({ rows: [estadisticas] });

      const resultado = await Valoracion.obtenerEstadisticas();

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('FROM valoracion'));
      expect(resultado).toEqual(estadisticas);
    });

    it('debería manejar errores correctamente', async () => {
      const error = new Error('DB error');
      mockQuery.mockRejectedValueOnce(error);

      await expect(Valoracion.obtenerEstadisticas()).rejects.toThrow('DB error');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('obtenerRecientes', () => {
    it('debería retornar valoraciones recientes con límite', async () => {
      const valoraciones = [
        { valoracion_id: 1, calificacion: 5, fecha_valoracion: '2024-01-15' },
        { valoracion_id: 2, calificacion: 4, fecha_valoracion: '2024-01-14' }
      ];
      mockQuery.mockResolvedValueOnce({ rows: valoraciones });

      const resultado = await Valoracion.obtenerRecientes(10);

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('ORDER BY v.fecha_valoracion DESC'), [10]);
      expect(resultado).toEqual(valoraciones);
    });

    it('debería usar límite por defecto', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await Valoracion.obtenerRecientes();

      const [, params] = mockQuery.mock.calls[0];
      expect(params).toEqual([10]);
    });

    it('debería manejar errores correctamente', async () => {
      const error = new Error('DB error');
      mockQuery.mockRejectedValueOnce(error);

      await expect(Valoracion.obtenerRecientes(5)).rejects.toThrow('DB error');
      expect(console.error).toHaveBeenCalled();
    });
  });
});

