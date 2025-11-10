import { describe, test, expect, afterAll } from '@jest/globals';
import Socio from '../../models/Socio.js';
import pool from '../../db.js';

describe('Modelo Socio', () => {
  afterAll(async () => {
    await pool.end();
  });

  describe('obtenerPerfil', () => {
    test('debe obtener el perfil de un socio existente', async () => {
      const perfil = await Socio.obtenerPerfil(2);
      
      expect(perfil).toBeDefined();
      expect(perfil.socio_id).toBe(2);
      expect(perfil.nombre).toBeDefined();
      expect(perfil.apellido).toBeDefined();
      expect(perfil.dni).toBeDefined();
    });

    test('debe retornar undefined para un socio inexistente', async () => {
      const perfil = await Socio.obtenerPerfil(999999);
      
      expect(perfil).toBeUndefined();
    });
  });

  describe('obtenerCuentas', () => {
    test('debe obtener las cuentas de un socio', async () => {
      const cuentas = await Socio.obtenerCuentas(2);
      
      expect(Array.isArray(cuentas)).toBe(true);
      if (cuentas.length > 0) {
        expect(cuentas[0]).toHaveProperty('cuenta_id');
        expect(cuentas[0]).toHaveProperty('numero_cuenta');
        expect(cuentas[0]).toHaveProperty('direccion');
      }
    });
  });

  describe('listar', () => {
    test('debe listar socios con paginación', async () => {
      const socios = await Socio.listar({ limite: 5, offset: 0 });
      
      expect(Array.isArray(socios)).toBe(true);
      expect(socios.length).toBeLessThanOrEqual(5);
      if (socios.length > 0) {
        expect(socios[0]).toHaveProperty('socio_id');
        expect(socios[0]).toHaveProperty('nombre');
        expect(socios[0]).toHaveProperty('apellido');
      }
    });

    test('debe filtrar socios por estado activo', async () => {
      const socios = await Socio.listar({ limite: 10, activo: true });
      
      expect(Array.isArray(socios)).toBe(true);
      socios.forEach(socio => {
        expect(socio.activo).toBe(true);
      });
    });
  });
});
