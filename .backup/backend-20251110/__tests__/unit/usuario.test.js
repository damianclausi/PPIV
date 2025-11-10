import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import Usuario from '../../models/Usuario.js';
import pool from '../../db.js';

describe('Modelo Usuario', () => {
  let testUsuarioId;

  afterAll(async () => {
    // Limpiar datos de prueba
    if (testUsuarioId) {
      await pool.query('DELETE FROM usuario WHERE usuario_id = $1', [testUsuarioId]);
    }
    await pool.end();
  });

  describe('buscarPorEmail', () => {
    test('debe encontrar un usuario existente por email', async () => {
      const usuario = await Usuario.buscarPorEmail('mariaelena.gonzalez@hotmail.com');
      
      expect(usuario).toBeDefined();
      expect(usuario.email).toBe('mariaelena.gonzalez@hotmail.com');
      expect(usuario.usuario_id).toBeDefined();
    });

    test('debe retornar undefined si el usuario no existe', async () => {
      const usuario = await Usuario.buscarPorEmail('noexiste@test.com');
      
      expect(usuario).toBeUndefined();
    });
  });

  describe('buscarPorId', () => {
    test('debe encontrar un usuario por ID con información completa', async () => {
      const usuario = await Usuario.buscarPorId(2);
      
      expect(usuario).toBeDefined();
      expect(usuario.usuario_id).toBe(2);
      expect(usuario.email).toBeDefined();
    });
  });

  describe('obtenerRoles', () => {
    test('debe obtener los roles de un usuario', async () => {
      const roles = await Usuario.obtenerRoles(2);
      
      expect(Array.isArray(roles)).toBe(true);
      if (roles.length > 0) {
        expect(roles[0]).toHaveProperty('rol_id');
        expect(roles[0]).toHaveProperty('nombre');
      }
    });
  });

  describe('tieneRol', () => {
    test('debe verificar correctamente si un usuario tiene un rol', async () => {
      const tieneRolCliente = await Usuario.tieneRol(2, 'Cliente');
      
      expect(typeof tieneRolCliente).toBe('boolean');
    });
  });
});
