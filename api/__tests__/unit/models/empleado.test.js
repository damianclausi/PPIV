import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockQuery = jest.fn();

jest.unstable_mockModule('../../../_lib/db.js', () => ({
  __esModule: true,
  default: {
    query: mockQuery
  }
}));

const { default: Empleado } = await import('../../../_lib/models/Empleado.js');

describe('Modelo Empleado', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockReset();
  });

  describe('obtenerPerfil', () => {
    it('debería retornar el perfil completo del empleado', async () => {
      const perfil = {
        empleado_id: 1,
        nombre: 'Pedro',
        apellido: 'García',
        cargo: 'Técnico Electricista',
        email: 'pedro@cooperativa.com',
        activo: true
      };
      mockQuery.mockResolvedValueOnce({ rows: [perfil] });

      const resultado = await Empleado.obtenerPerfil(1);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('FROM empleado e'),
        [1]
      );
      expect(resultado).toEqual(perfil);
    });

    it('debería retornar undefined si el empleado no existe', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const resultado = await Empleado.obtenerPerfil(999);

      expect(resultado).toBeUndefined();
    });
  });

  describe('listar', () => {
    it('debería listar empleados con paginación', async () => {
      const empleados = [
        { empleado_id: 1, nombre: 'Pedro', total: '10' },
        { empleado_id: 2, nombre: 'Juan', total: '10' }
      ];
      mockQuery.mockResolvedValueOnce({ rows: empleados });

      const resultado = await Empleado.listar({ pagina: 1, limite: 10 });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY e.apellido, e.nombre'),
        [10, 0]
      );
      expect(resultado.empleados).toEqual(empleados);
      expect(resultado.total).toBe('10');
      expect(resultado.pagina).toBe(1);
      expect(resultado.totalPaginas).toBe(1);
    });

    it('debería aplicar filtro de activo', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await Empleado.listar({ activo: true, pagina: 2, limite: 5 });

      const [, params] = mockQuery.mock.calls[0];
      expect(params).toEqual([true, 5, 5]);
    });

    it('debería calcular correctamente el offset', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await Empleado.listar({ pagina: 3, limite: 10 });

      const [, params] = mockQuery.mock.calls[0];
      expect(params).toEqual([10, 20]); // (3-1) * 10 = 20
    });
  });

  describe('crear', () => {
    it('debería crear un nuevo empleado con todos los campos', async () => {
      const datos = {
        nombre: 'Luis',
        apellido: 'Martínez',
        dni: '12345678',
        telefono: '1234567890',
        direccion: 'Calle Principal 123',
        fecha_ingreso: new Date('2024-01-01'),
        cargo: 'Operario de Campo',
        activo: true
      };
      const empleadoCreado = { empleado_id: 5, ...datos };
      mockQuery.mockResolvedValueOnce({ rows: [empleadoCreado] });

      const resultado = await Empleado.crear(datos);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO empleado'),
        [
          datos.nombre,
          datos.apellido,
          datos.dni,
          datos.telefono,
          datos.direccion,
          datos.fecha_ingreso,
          datos.cargo,
          datos.activo
        ]
      );
      expect(resultado).toEqual(empleadoCreado);
    });

    it('debería usar valores por defecto para campos opcionales', async () => {
      const datos = {
        nombre: 'Ana',
        apellido: 'López',
        dni: '87654321'
      };
      const empleadoCreado = { empleado_id: 6, ...datos };
      mockQuery.mockResolvedValueOnce({ rows: [empleadoCreado] });

      const resultado = await Empleado.crear(datos);

      const [, params] = mockQuery.mock.calls[0];
      expect(params[3]).toBeNull(); // telefono
      expect(params[4]).toBeNull(); // direccion
      expect(params[6]).toBe('Empleado'); // cargo por defecto
      expect(params[7]).toBe(true); // activo por defecto
      expect(resultado).toEqual(empleadoCreado);
    });
  });

  describe('actualizar', () => {
    it('debería actualizar solo los campos proporcionados', async () => {
      const datos = { nombre: 'Pedro Carlos', telefono: '9999999999' };
      const empleadoActualizado = { empleado_id: 1, ...datos };
      mockQuery.mockResolvedValueOnce({ rows: [empleadoActualizado] });

      const resultado = await Empleado.actualizar(1, datos);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE empleado'),
        expect.arrayContaining([datos.nombre, datos.telefono, 1])
      );
      expect(resultado).toEqual(empleadoActualizado);
    });

    it('debería retornar null si no se proporcionan campos', async () => {
      const resultado = await Empleado.actualizar(1, {});

      expect(mockQuery).not.toHaveBeenCalled();
      expect(resultado).toBeNull();
    });

    it('debería actualizar múltiples campos', async () => {
      const datos = {
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '1111111111',
        direccion: 'Nueva Dirección',
        cargo: 'Supervisor'
      };
      const empleadoActualizado = { empleado_id: 2, ...datos };
      mockQuery.mockResolvedValueOnce({ rows: [empleadoActualizado] });

      const resultado = await Empleado.actualizar(2, datos);

      const [, params] = mockQuery.mock.calls[0];
      expect(params).toHaveLength(6); // 5 campos + empleado_id
      expect(resultado).toEqual(empleadoActualizado);
    });
  });

  describe('cambiarEstado', () => {
    it('debería activar el empleado', async () => {
      const empleado = { empleado_id: 1, activo: true };
      mockQuery.mockResolvedValueOnce({ rows: [empleado] });

      const resultado = await Empleado.cambiarEstado(1, true);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE empleado'),
        [true, 1]
      );
      expect(resultado).toEqual(empleado);
    });

    it('debería desactivar el empleado', async () => {
      const empleado = { empleado_id: 1, activo: false };
      mockQuery.mockResolvedValueOnce({ rows: [empleado] });

      const resultado = await Empleado.cambiarEstado(1, false);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE empleado'),
        [false, 1]
      );
      expect(resultado).toEqual(empleado);
    });
  });
});

