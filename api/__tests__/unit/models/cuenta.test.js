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

const { default: Cuenta } = await import('../../../_lib/models/Cuenta.js');

describe('Modelo Cuenta', () => {
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

  describe('generarNumeroCuenta', () => {
    it('debería generar el siguiente número de cuenta', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ siguiente: 42 }] });

      const resultado = await Cuenta.generarNumeroCuenta();

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('SELECT COALESCE(MAX'));
      expect(resultado).toBe('000042');
    });

    it('debería formatear con ceros a la izquierda', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ siguiente: 5 }] });

      const resultado = await Cuenta.generarNumeroCuenta();

      expect(resultado).toBe('000005');
    });
  });

  describe('generarNumeroMedidor', () => {
    it('debería generar el siguiente número de medidor', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ siguiente: 100 }] });

      const resultado = await Cuenta.generarNumeroMedidor();

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('FROM medidor'));
      expect(resultado).toBe('000100');
    });
  });

  describe('crear', () => {
    it('debería crear cuenta y medidor en transacción', async () => {
      const datos = {
        socio_id: 1,
        direccion: 'Calle Principal 123',
        servicio_id: 1,
        principal: true,
        activa: true
      };
      const cuentaCreada = { cuenta_id: 10, numero_cuenta: '000001', ...datos };
      const numeroCuenta = '000001';
      const numeroMedidor = '000001';

      mockQuery
        .mockResolvedValueOnce({ rows: [{ siguiente: 1 }] }) // generarNumeroCuenta
        .mockResolvedValueOnce({ rows: [{ siguiente: 1 }] }); // generarNumeroMedidor

      mockClientQuery
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [cuentaCreada] }) // INSERT cuenta
        .mockResolvedValueOnce({}) // INSERT medidor
        .mockResolvedValueOnce({}); // COMMIT

      const resultado = await Cuenta.crear(datos);

      expect(mockClientQuery).toHaveBeenNthCalledWith(1, 'BEGIN');
      expect(mockClientQuery).toHaveBeenNthCalledWith(2, expect.stringContaining('INSERT INTO cuenta'), [
        datos.socio_id,
        numeroCuenta,
        datos.direccion,
        'Gobernador Ugarte',
        datos.servicio_id,
        datos.principal,
        datos.activa
      ]);
      expect(mockClientQuery).toHaveBeenNthCalledWith(3, expect.stringContaining('INSERT INTO medidor'), [
        numeroMedidor,
        cuentaCreada.cuenta_id,
        true
      ]);
      expect(mockClientQuery).toHaveBeenNthCalledWith(4, 'COMMIT');
      expect(mockClientRelease).toHaveBeenCalled();
      expect(resultado).toEqual(cuentaCreada);
    });

    it('debería hacer rollback en caso de error', async () => {
      const datos = { socio_id: 1, direccion: 'Calle 123', servicio_id: 1 };
      const error = new Error('DB error');

      mockQuery
        .mockResolvedValueOnce({ rows: [{ siguiente: 1 }] })
        .mockResolvedValueOnce({ rows: [{ siguiente: 1 }] });

      mockClientQuery
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ cuenta_id: 1 }] }) // INSERT cuenta
        .mockRejectedValueOnce(error); // Error en INSERT medidor

      await expect(Cuenta.crear(datos)).rejects.toThrow('DB error');

      expect(mockClientQuery).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClientRelease).toHaveBeenCalled();
    });
  });

  describe('obtenerPorId', () => {
    it('debería retornar la cuenta con información relacionada', async () => {
      const cuenta = {
        cuenta_id: 1,
        numero_cuenta: '000001',
        direccion: 'Calle 123',
        servicio_nombre: 'Residencial',
        socio_nombre: 'Juan',
        socio_apellido: 'Pérez'
      };
      mockQuery.mockResolvedValueOnce({ rows: [cuenta] });

      const resultado = await Cuenta.obtenerPorId(1);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE c.cuenta_id = $1'),
        [1]
      );
      expect(resultado).toEqual(cuenta);
    });
  });

  describe('actualizar', () => {
    it('debería actualizar los campos proporcionados', async () => {
      const datos = { direccion: 'Nueva Dirección 456', principal: false };
      const cuentaActualizada = { cuenta_id: 1, ...datos };
      mockQuery.mockResolvedValueOnce({ rows: [cuentaActualizada] });

      const resultado = await Cuenta.actualizar(1, datos);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE cuenta'),
        expect.arrayContaining([datos.direccion, datos.principal, 1])
      );
      expect(resultado).toEqual(cuentaActualizada);
    });
  });

  describe('eliminar', () => {
    it('debería hacer soft delete (desactivar cuenta)', async () => {
      const cuentaDesactivada = { cuenta_id: 1, activa: false };
      mockQuery.mockResolvedValueOnce({ rows: [cuentaDesactivada] });

      const resultado = await Cuenta.eliminar(1);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE cuenta'),
        [1]
      );
      expect(resultado).toEqual(cuentaDesactivada);
    });
  });

  describe('listar', () => {
    it('debería listar cuentas con paginación', async () => {
      const cuentas = [
        { cuenta_id: 1, numero_cuenta: '000001' },
        { cuenta_id: 2, numero_cuenta: '000002' }
      ];
      mockQuery
        .mockResolvedValueOnce({ rows: cuentas }) // SELECT cuentas
        .mockResolvedValueOnce({ rows: [{ total: '2' }] }); // COUNT total

      const resultado = await Cuenta.listar({ limite: 10, offset: 0 });

      expect(resultado.cuentas).toEqual(cuentas);
      expect(resultado.total).toBe(2);
      expect(resultado.pagina).toBe(1);
      expect(resultado.totalPaginas).toBe(1);
    });

    it('debería aplicar filtros de activa y búsqueda', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] });

      await Cuenta.listar({ activa: true, busqueda: 'Juan', limite: 20, offset: 10 });

      const [, params1] = mockQuery.mock.calls[0];
      expect(params1).toEqual([true, '%Juan%', 20, 10]);

      const [, params2] = mockQuery.mock.calls[1];
      expect(params2).toEqual([true, '%Juan%']);
    });

    it('debería validar campos de orden permitidos', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] });

      await Cuenta.listar({ orden: 'direccion', direccion: 'DESC' });

      const [query] = mockQuery.mock.calls[0];
      expect(query).toContain('ORDER BY direccion DESC');
    });

    it('debería usar orden por defecto si el campo no es válido', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] });

      await Cuenta.listar({ orden: 'campo_invalido' });

      const [query] = mockQuery.mock.calls[0];
      expect(query).toContain('ORDER BY numero_cuenta ASC');
    });
  });
});

