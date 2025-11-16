import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockQuery = jest.fn();

jest.unstable_mockModule('../../../_lib/db.js', () => ({
  __esModule: true,
  default: {
    query: mockQuery
  }
}));

const { default: Socio } = await import('../../../_lib/models/Socio.js');

describe('Modelo Socio', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockReset();
  });

  describe('obtenerPerfil', () => {
    it('debería retornar el perfil del socio', async () => {
      const perfil = { socio_id: 1, nombre: 'Juan', apellido: 'Pérez', dni: '12345678' };
      mockQuery.mockResolvedValueOnce({ rows: [perfil] });

      const resultado = await Socio.obtenerPerfil(1);

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('WHERE s.socio_id = $1'), [1]);
      expect(resultado).toEqual(perfil);
    });

    it('debería retornar undefined si el socio no existe', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const resultado = await Socio.obtenerPerfil(999);

      expect(resultado).toBeUndefined();
    });
  });

  describe('obtenerCuentas', () => {
    it('debería retornar las cuentas del socio', async () => {
      const cuentas = [
        { cuenta_id: 1, numero_cuenta: '000001', direccion: 'Calle 123' },
        { cuenta_id: 2, numero_cuenta: '000002', direccion: 'Calle 456' }
      ];
      mockQuery.mockResolvedValueOnce({ rows: cuentas });

      const resultado = await Socio.obtenerCuentas(1);

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('WHERE c.socio_id = $1'), [1]);
      expect(resultado).toEqual(cuentas);
      expect(resultado).toHaveLength(2);
    });
  });

  describe('crear', () => {
    it('debería crear un nuevo socio', async () => {
      const datos = {
        nombre: 'María',
        apellido: 'González',
        dni: '87654321',
        email: 'maria@test.com',
        telefono: '1234567890',
        activo: true
      };
      const socioCreado = { socio_id: 5, ...datos };
      mockQuery.mockResolvedValueOnce({ rows: [socioCreado] });

      const resultado = await Socio.crear(datos);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO socio'),
        [datos.nombre, datos.apellido, datos.dni, datos.email, datos.telefono, datos.activo]
      );
      expect(resultado).toEqual(socioCreado);
    });

    it('debería usar activo=true por defecto', async () => {
      const datos = {
        nombre: 'Pedro',
        apellido: 'López',
        dni: '11223344',
        email: 'pedro@test.com',
        telefono: '0987654321'
      };
      const socioCreado = { socio_id: 6, ...datos, activo: true };
      mockQuery.mockResolvedValueOnce({ rows: [socioCreado] });

      const resultado = await Socio.crear(datos);

      const [, params] = mockQuery.mock.calls[0];
      expect(params[5]).toBe(true); // activo por defecto
      expect(resultado).toEqual(socioCreado);
    });
  });

  describe('actualizar', () => {
    it('debería actualizar los campos proporcionados', async () => {
      const datos = { nombre: 'Juan Carlos', telefono: '1111111111' };
      const socioActualizado = { socio_id: 1, ...datos };
      mockQuery.mockResolvedValueOnce({ rows: [socioActualizado] });

      const resultado = await Socio.actualizar(1, datos);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE socio'),
        expect.arrayContaining([datos.nombre, datos.telefono, 1])
      );
      expect(resultado).toEqual(socioActualizado);
    });

    it('debería actualizar múltiples campos', async () => {
      const datos = {
        nombre: 'Ana',
        apellido: 'Martínez',
        email: 'ana@test.com',
        telefono: '2222222222'
      };
      const socioActualizado = { socio_id: 2, ...datos };
      mockQuery.mockResolvedValueOnce({ rows: [socioActualizado] });

      const resultado = await Socio.actualizar(2, datos);

      const [, params] = mockQuery.mock.calls[0];
      expect(params).toHaveLength(5); // 4 campos + socio_id
      expect(resultado).toEqual(socioActualizado);
    });
  });

  describe('cambiarEstado', () => {
    it('debería activar el socio', async () => {
      const socio = { socio_id: 1, activo: true };
      mockQuery.mockResolvedValueOnce({ rows: [socio] });

      const resultado = await Socio.cambiarEstado(1, true);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE socio SET activo = $1'),
        [true, 1]
      );
      expect(resultado).toEqual(socio);
    });

    it('debería desactivar el socio', async () => {
      const socio = { socio_id: 1, activo: false };
      mockQuery.mockResolvedValueOnce({ rows: [socio] });

      const resultado = await Socio.cambiarEstado(1, false);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE socio SET activo = $1'),
        [false, 1]
      );
      expect(resultado).toEqual(socio);
    });
  });

  describe('listar', () => {
    it('debería listar socios con paginación por defecto', async () => {
      const socios = [
        { socio_id: 1, nombre: 'Juan', apellido: 'Pérez' },
        { socio_id: 2, nombre: 'María', apellido: 'González' }
      ];
      mockQuery.mockResolvedValueOnce({ rows: socios });

      const resultado = await Socio.listar({});

      const [, params] = mockQuery.mock.calls[0];
      expect(params).toEqual([50, 0]);
      expect(resultado).toEqual(socios);
    });

    it('debería aplicar filtros de activo y búsqueda', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await Socio.listar({ activo: true, busqueda: 'Juan', limite: 20, offset: 10 });

      const [, params] = mockQuery.mock.calls[0];
      expect(params).toEqual([true, '%Juan%', 20, 10]);
    });

    it('debería validar campos de orden permitidos', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await Socio.listar({ orden: 'nombre', direccion: 'DESC' });

      const [query] = mockQuery.mock.calls[0];
      expect(query).toContain('ORDER BY s.nombre DESC');
    });

    it('debería usar orden por defecto si el campo no es válido', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await Socio.listar({ orden: 'campo_invalido', direccion: 'DESC' });

      const [query] = mockQuery.mock.calls[0];
      expect(query).toContain('ORDER BY s.socio_id DESC');
    });
  });

  describe('eliminar', () => {
    it('debería eliminar el socio', async () => {
      const socioEliminado = { socio_id: 1 };
      mockQuery.mockResolvedValueOnce({ rows: [socioEliminado] });

      const resultado = await Socio.eliminar(1);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM socio'),
        [1]
      );
      expect(resultado).toEqual(socioEliminado);
    });
  });

  describe('obtenerEstadisticas', () => {
    it('debería retornar estadísticas de socios', async () => {
      const estadisticas = {
        total: '100',
        activos: '85',
        inactivos: '15',
        nuevos_ultimo_mes: '5'
      };
      mockQuery.mockResolvedValueOnce({ rows: [estadisticas] });

      const resultado = await Socio.obtenerEstadisticas();

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('FROM socio'));
      expect(resultado).toEqual(estadisticas);
    });
  });
});

