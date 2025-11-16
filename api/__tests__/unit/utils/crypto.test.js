import { describe, it, expect } from '@jest/globals';
import { hashearPassword, compararPassword } from '../../../_lib/utils/crypto.js';

describe('Crypto Utils', () => {
  const testPassword = 'password123';
  const testPassword2 = 'otraPassword456';

  describe('hashearPassword', () => {
    it('debería generar un hash de contraseña', async () => {
      const hash = await hashearPassword(testPassword);
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
      // Bcrypt hash siempre empieza con $2b$
      expect(hash.startsWith('$2b$')).toBe(true);
    });

    it('debería generar hashes diferentes para la misma contraseña', async () => {
      const hash1 = await hashearPassword(testPassword);
      const hash2 = await hashearPassword(testPassword);
      
      // Los hashes deben ser diferentes debido al salt
      expect(hash1).not.toBe(hash2);
      expect(hash1).toBeDefined();
      expect(hash2).toBeDefined();
    });

    it('debería generar hash para contraseñas diferentes', async () => {
      const hash1 = await hashearPassword(testPassword);
      const hash2 = await hashearPassword(testPassword2);
      
      expect(hash1).not.toBe(hash2);
      expect(hash1).toBeDefined();
      expect(hash2).toBeDefined();
    });

    it('debería manejar contraseñas vacías', async () => {
      const hash = await hashearPassword('');
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
    });
  });

  describe('compararPassword', () => {
    it('debería verificar correctamente una contraseña válida', async () => {
      const hash = await hashearPassword(testPassword);
      const isValid = await compararPassword(testPassword, hash);
      
      expect(isValid).toBe(true);
    });

    it('debería rechazar una contraseña incorrecta', async () => {
      const hash = await hashearPassword(testPassword);
      const isValid = await compararPassword('passwordIncorrecto', hash);
      
      expect(isValid).toBe(false);
    });

    it('debería rechazar contraseña vacía cuando el hash es válido', async () => {
      const hash = await hashearPassword(testPassword);
      const isValid = await compararPassword('', hash);
      
      expect(isValid).toBe(false);
    });

    it('debería manejar hash inválido', async () => {
      const isValid = await compararPassword(testPassword, 'hash-invalido');
      
      expect(isValid).toBe(false);
    });

    it('debería manejar hash vacío', async () => {
      const isValid = await compararPassword(testPassword, '');
      
      expect(isValid).toBe(false);
    });
  });

  describe('Integración - Hash y Comparación', () => {
    it('debería hashear y comparar correctamente en un flujo completo', async () => {
      const password = 'miPasswordSecreta123';
      
      // Hashear
      const hash = await hashearPassword(password);
      expect(hash).toBeDefined();
      
      // Verificar correcta
      const isValidCorrect = await compararPassword(password, hash);
      expect(isValidCorrect).toBe(true);
      
      // Verificar incorrecta
      const isValidIncorrect = await compararPassword('passwordIncorrecta', hash);
      expect(isValidIncorrect).toBe(false);
    });

    it('debería funcionar con múltiples contraseñas', async () => {
      const passwords = ['pass1', 'pass2', 'pass3'];
      const hashes = [];
      
      // Hashear todas
      for (const pass of passwords) {
        const hash = await hashearPassword(pass);
        hashes.push(hash);
      }
      
      // Verificar que cada hash corresponde a su contraseña
      for (let i = 0; i < passwords.length; i++) {
        const isValid = await compararPassword(passwords[i], hashes[i]);
        expect(isValid).toBe(true);
        
        // Verificar que no corresponde a otras contraseñas
        for (let j = 0; j < passwords.length; j++) {
          if (i !== j) {
            const isValidOther = await compararPassword(passwords[j], hashes[i]);
            expect(isValidOther).toBe(false);
          }
        }
      }
    });
  });
});

