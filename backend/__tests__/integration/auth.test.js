import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../server.js';
import pool from '../../db.js';

describe('API de Autenticación', () => {
  let authToken;

  afterAll(async () => {
    await pool.end();
  });

  describe('POST /api/auth/login', () => {
    test('debe permitir login con credenciales válidas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'mariaelena.gonzalez@hotmail.com',
          password: 'password123'
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.exito).toBe(true);
      expect(response.body.datos).toHaveProperty('token');
      expect(response.body.datos).toHaveProperty('usuario');
      expect(response.body.datos.usuario.email).toBe('mariaelena.gonzalez@hotmail.com');

      authToken = response.body.datos.token;
    });

    test('debe rechazar login con credenciales inválidas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'mariaelena.gonzalez@hotmail.com',
          password: 'passwordincorrecto'
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.exito).toBe(false);
      expect(response.body.mensaje).toContain('Credenciales inválidas');
    });

    test('debe rechazar login sin email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'password123'
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.exito).toBe(false);
    });

    test('debe rechazar login sin password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'mariaelena.gonzalez@hotmail.com'
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.exito).toBe(false);
    });
  });

  describe('GET /api/auth/perfil', () => {
    beforeAll(async () => {
      // Obtener token válido
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'mariaelena.gonzalez@hotmail.com',
          password: 'password123'
        });
      authToken = response.body.datos.token;
    });

    test('debe obtener perfil con token válido', async () => {
      const response = await request(app)
        .get('/api/auth/perfil')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.exito).toBe(true);
      expect(response.body.datos).toHaveProperty('usuario_id');
      expect(response.body.datos).toHaveProperty('email');
      expect(response.body.datos).toHaveProperty('roles');
    });

    test('debe rechazar petición sin token', async () => {
      const response = await request(app)
        .get('/api/auth/perfil')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.exito).toBe(false);
    });

    test('debe rechazar petición con token inválido', async () => {
      const response = await request(app)
        .get('/api/auth/perfil')
        .set('Authorization', 'Bearer token_invalido')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.exito).toBe(false);
    });
  });

  describe('POST /api/auth/verificar', () => {
    test('debe verificar token válido', async () => {
      const response = await request(app)
        .post('/api/auth/verificar')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.exito).toBe(true);
      expect(response.body.datos.valido).toBe(true);
    });
  });
});
