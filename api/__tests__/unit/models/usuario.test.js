import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockQuery = jest.fn();

jest.unstable_mockModule('../../../_lib/db.js', () => ({
  __esModule: true,
  default: {
    query: mockQuery
  }
}));

const { default: Usuario } = await import('../../../_lib/models/Usuario.js');

describe('Modelo Usuario', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockReset();
  });

  describe('buscarPorEmail', () => {
    it('debería retornar el usuario encontrado', async () => {
      const mockUsuario = { usuario_id: 1, email: 'test@example.com' };
      mockQuery.mockResolvedValueOnce({ rows: [mockUsuario] });

      const resultado = await Usuario.buscarPorEmail('test@example.com');

      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('WHERE u.email = $1'), ['test@example.com']);
      expect(resultado).toEqual(mockUsuario);
    });

    it('debería retornar undefined cuando no encuentra usuario', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const resultado = await Usuario.buscarPorEmail('no-existe@example.com');

      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(resultado).toBeUndefined();
    });
  });

  describe('buscarPorId', () => {
    it('debería retornar el usuario por ID', async () => {
      const mockUsuario = { usuario_id: 5, email: 'id@example.com' };
      mockQuery.mockResolvedValueOnce({ rows: [mockUsuario] });

      const resultado = await Usuario.buscarPorId(5);

      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('WHERE u.usuario_id = $1'), [5]);
      expect(resultado).toEqual(mockUsuario);
    });

    it('debería retornar undefined si el ID no existe', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const resultado = await Usuario.buscarPorId(999);

      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(resultado).toBeUndefined();
    });
  });

  describe('obtenerRoles', () => {
    it('debería retornar la lista de roles', async () => {
      const mockRoles = [
        { rol_id: 1, nombre: 'ADMIN' },
        { rol_id: 2, nombre: 'OPERARIO' }
      ];
      mockQuery.mockResolvedValueOnce({ rows: mockRoles });

      const resultado = await Usuario.obtenerRoles(3);

      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('FROM usuario_rol'), [3]);
      expect(resultado).toEqual(mockRoles);
    });
  });

  describe('actualizarUltimoLogin', () => {
    it('debería ejecutar la actualización del último login', async () => {
      mockQuery.mockResolvedValueOnce({});

      await Usuario.actualizarUltimoLogin(7);

      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockQuery).toHaveBeenCalledWith('UPDATE usuario SET ultimo_login = NOW() WHERE usuario_id = $1', [7]);
    });
  });

  describe('crear', () => {
    it('debería crear un nuevo usuario y retornar el registro', async () => {
      const datos = {
        email: 'nuevo@example.com',
        hashPass: 'hash123',
        socioId: 10,
        empleadoId: null
      };
      const mockUsuario = { usuario_id: 20, email: datos.email };
      mockQuery.mockResolvedValueOnce({ rows: [mockUsuario] });

      const resultado = await Usuario.crear(datos);

      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO usuario'), [datos.email, datos.hashPass, datos.socioId, datos.empleadoId]);
      expect(resultado).toEqual(mockUsuario);
    });
  });

  describe('tieneRol', () => {
    it('debería retornar true si el usuario tiene el rol', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ tiene_rol: true }] });

      const resultado = await Usuario.tieneRol(1, 'ADMIN');

      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('EXISTS'), [1, 'ADMIN']);
      expect(resultado).toBe(true);
    });

    it('debería retornar false si el usuario no tiene el rol', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ tiene_rol: false }] });

      const resultado = await Usuario.tieneRol(2, 'CLIENTE');

      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('EXISTS'), [2, 'CLIENTE']);
      expect(resultado).toBe(false);
    });
  });
});
