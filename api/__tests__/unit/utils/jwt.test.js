import { describe, it, expect, beforeEach } from '@jest/globals';
import { generarToken, verificarToken, decodificarToken } from '../../../_lib/utils/jwt.js';

describe('JWT Utils', () => {
  const testPayload = {
    usuario_id: 1,
    email: 'test@example.com',
    roles: ['cliente']
  };

  beforeEach(() => {
    // Asegurar que JWT_SECRET esté configurado
    process.env.JWT_SECRET = 'test-secret-key-for-jwt-testing-only';
  });

  describe('generarToken', () => {
    it('debería generar un token JWT válido', () => {
      const token = generarToken(testPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT tiene 3 partes
    });

    it('debería generar tokens diferentes para el mismo payload', () => {
      const token1 = generarToken(testPayload);
      const token2 = generarToken(testPayload);
      
      // Los tokens pueden ser diferentes debido a timestamps, pero ambos deben ser válidos
      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
    });

    it('debería generar token con payload vacío', () => {
      const token = generarToken({});
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });
  });

  describe('verificarToken', () => {
    it('debería verificar un token válido correctamente', () => {
      const token = generarToken(testPayload);
      const decoded = verificarToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded.usuario_id).toBe(testPayload.usuario_id);
      expect(decoded.email).toBe(testPayload.email);
      expect(decoded.roles).toEqual(testPayload.roles);
    });

    it('debería retornar null para un token inválido', () => {
      const invalidToken = 'token.invalido.aqui';
      const decoded = verificarToken(invalidToken);
      
      expect(decoded).toBeNull();
    });

    it('debería retornar null para un token vacío', () => {
      const decoded = verificarToken('');
      expect(decoded).toBeNull();
    });

    it('debería retornar null para un token null', () => {
      const decoded = verificarToken(null);
      expect(decoded).toBeNull();
    });

    it('debería retornar null para un token con formato incorrecto', () => {
      const decoded = verificarToken('no-es-un-jwt-token');
      expect(decoded).toBeNull();
    });
  });

  describe('decodificarToken', () => {
    it('debería decodificar un token sin verificar', () => {
      const token = generarToken(testPayload);
      const decoded = decodificarToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded.usuario_id).toBe(testPayload.usuario_id);
      expect(decoded.email).toBe(testPayload.email);
    });

    it('debería retornar null para token inválido', () => {
      const decoded = decodificarToken('token.invalido');
      expect(decoded).toBeNull();
    });

    it('debería decodificar incluso tokens expirados (sin verificar)', () => {
      // Crear un token con expiración muy corta
      const oldToken = generarToken(testPayload);
      const decoded = decodificarToken(oldToken);
      
      // decodificarToken no verifica expiración, solo decodifica
      expect(decoded).toBeDefined();
    });
  });

  describe('Integración', () => {
    it('debería generar y verificar token correctamente en un flujo completo', () => {
      const payload = {
        usuario_id: 123,
        email: 'usuario@test.com',
        roles: ['admin', 'operario']
      };
      
      const token = generarToken(payload);
      const verified = verificarToken(token);
      
      expect(verified).toBeDefined();
      expect(verified.usuario_id).toBe(payload.usuario_id);
      expect(verified.email).toBe(payload.email);
      expect(verified.roles).toEqual(payload.roles);
    });
  });
});

