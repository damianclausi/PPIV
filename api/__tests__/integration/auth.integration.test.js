/**
 * Tests de Integración - Autenticación
 * 
 * Estos tests verifican el flujo completo de autenticación
 * incluyendo la interacción con la base de datos real.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { createRequest, crearUsuarioPrueba, crearSocioPrueba, loginYobtenerToken, limpiarDatosPrueba } from './setup/testHelpers.js';
import { queryTestDb, limpiarTablas } from './setup/dbSetup.js';

describe('Auth - Tests de Integración', () => {
  let usuarioPrueba;
  let socioPrueba;

  beforeAll(async () => {
    // Limpiar datos antes de comenzar
    await limpiarTablas(['usuario', 'socio']);
  });

  afterAll(async () => {
    // Limpiar datos después de todos los tests
    await limpiarDatosPrueba({
      usuario_id: usuarioPrueba?.usuario_id,
      socio_id: socioPrueba?.socio_id
    });
  });

  beforeEach(async () => {
    // Limpiar datos antes de cada test
    // Importante: limpiar en orden correcto debido a foreign keys
    await limpiarTablas(['usuario_rol', 'usuario', 'socio']);
  });

  describe('POST /api/auth/login', () => {
    it('debería hacer login exitoso con credenciales válidas', async () => {
      // Crear usuario y socio de prueba con email único
      const emailUnico = `cliente_${Date.now()}@test.com`;
      socioPrueba = await crearSocioPrueba({
        email: emailUnico,
        nombre: 'Juan',
        apellido: 'Pérez'
      });

      const { hashearPassword } = await import('../../_lib/utils/crypto.js');
      const hashPass = await hashearPassword('password123');

      // Crear usuario asociado al socio
      const result = await queryTestDb(
        `INSERT INTO usuario (email, hash_pass, activo, socio_id)
         VALUES ($1, $2, $3, $4)
         RETURNING usuario_id, email, activo, socio_id`,
        [emailUnico, hashPass, true, socioPrueba.socio_id]
      );
      usuarioPrueba = result.rows[0];

      // Asignar rol CLIENTE
      await queryTestDb(
        `INSERT INTO usuario_rol (usuario_id, rol_id)
         SELECT $1, rol_id FROM rol WHERE nombre = 'CLIENTE'`,
        [usuarioPrueba.usuario_id]
      );

      // Intentar login
      const response = await createRequest()
        .post('/api/auth/login')
        .send({
          email: emailUnico,
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.exito).toBe(true);
      expect(response.body.datos).toHaveProperty('token');
      expect(response.body.datos).toHaveProperty('usuario');
      expect(response.body.datos.usuario.email).toBe(emailUnico);
      expect(response.body.datos.usuario.roles).toContain('CLIENTE');
    });

    it('debería rechazar login con credenciales inválidas', async () => {
      const response = await createRequest()
        .post('/api/auth/login')
        .send({
          email: 'noexiste@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.exito).toBe(false);
      expect(response.body.mensaje).toContain('Credenciales inválidas');
    });

    it('debería rechazar login con password incorrecto', async () => {
      // Crear usuario de prueba con email único
      const emailUnico = `test2_${Date.now()}@test.com`;
      socioPrueba = await crearSocioPrueba({ email: emailUnico });
      const { hashearPassword } = await import('../../_lib/utils/crypto.js');
      const hashPass = await hashearPassword('password123');

      const result = await queryTestDb(
        `INSERT INTO usuario (email, hash_pass, activo, socio_id)
         VALUES ($1, $2, $3, $4)
         RETURNING usuario_id`,
        [emailUnico, hashPass, true, socioPrueba.socio_id]
      );
      usuarioPrueba = result.rows[0];

      // Intentar login con password incorrecto
      const response = await createRequest()
        .post('/api/auth/login')
        .send({
          email: emailUnico,
          password: 'password_incorrecto'
        });

      expect(response.status).toBe(401);
      expect(response.body.exito).toBe(false);
    });

    it('debería rechazar login sin email o password', async () => {
      const response = await createRequest()
        .post('/api/auth/login')
        .send({
          email: 'test@test.com'
          // Falta password
        });

      expect(response.status).toBe(400);
      expect(response.body.exito).toBe(false);
      expect(response.body.mensaje).toContain('requeridos');
    });
  });

  describe('GET /api/auth/perfil', () => {
    it('debería retornar el perfil del usuario autenticado', async () => {
      // Crear usuario y socio con email único
      const emailUnico = `perfil_${Date.now()}@test.com`;
      socioPrueba = await crearSocioPrueba({
        email: emailUnico,
        nombre: 'María',
        apellido: 'García'
      });

      const { hashearPassword } = await import('../../_lib/utils/crypto.js');
      const hashPass = await hashearPassword('password123');

      const result = await queryTestDb(
        `INSERT INTO usuario (email, hash_pass, activo, socio_id)
         VALUES ($1, $2, $3, $4)
         RETURNING usuario_id`,
        [emailUnico, hashPass, true, socioPrueba.socio_id]
      );
      usuarioPrueba = result.rows[0];

      // Asignar rol
      await queryTestDb(
        `INSERT INTO usuario_rol (usuario_id, rol_id)
         SELECT $1, rol_id FROM rol WHERE nombre = 'CLIENTE'`,
        [usuarioPrueba.usuario_id]
      );

      // Hacer login para obtener token
      const token = await loginYobtenerToken(emailUnico, 'password123');

      // Obtener perfil
      const response = await createRequest()
        .get('/api/auth/perfil')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.exito).toBe(true);
      expect(response.body.datos).toHaveProperty('usuario_id');
      expect(response.body.datos).toHaveProperty('email', emailUnico);
      expect(response.body.datos).toHaveProperty('socio');
      expect(response.body.datos.socio.nombre).toBe('María');
    });

    it('debería retornar 401 sin token de autenticación', async () => {
      const response = await createRequest()
        .get('/api/auth/perfil');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/verificar', () => {
    it('debería verificar un token válido', async () => {
      // Crear usuario con email único
      const emailUnico = `verificar_${Date.now()}@test.com`;
      socioPrueba = await crearSocioPrueba({ email: emailUnico });
      const { hashearPassword } = await import('../../_lib/utils/crypto.js');
      const hashPass = await hashearPassword('password123');

      const result = await queryTestDb(
        `INSERT INTO usuario (email, hash_pass, activo, socio_id)
         VALUES ($1, $2, $3, $4)
         RETURNING usuario_id`,
        ['verificar@test.com', hashPass, true, socioPrueba.socio_id]
      );
      usuarioPrueba = result.rows[0];

      // Hacer login
      const token = await loginYobtenerToken('verificar@test.com', 'password123');

      // Verificar token
      const response = await createRequest()
        .post('/api/auth/verificar')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.exito).toBe(true);
      expect(response.body.datos.valido).toBe(true);
      expect(response.body.datos).toHaveProperty('usuario');
    });
  });
});

