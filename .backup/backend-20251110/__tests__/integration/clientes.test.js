import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../server.js';
import pool from '../../db.js';

describe('API de Clientes', () => {
  let authToken;

  beforeAll(async () => {
    // Obtener token de autenticación
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'mariaelena.gonzalez@hotmail.com',
        password: 'password123'
      });
    authToken = response.body.datos.token;
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('GET /api/clientes/perfil', () => {
    test('debe obtener perfil del cliente autenticado', async () => {
      const response = await request(app)
        .get('/api/clientes/perfil')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.exito).toBe(true);
      expect(response.body.datos).toHaveProperty('socio_id');
      expect(response.body.datos).toHaveProperty('nombre');
      expect(response.body.datos).toHaveProperty('apellido');
      expect(response.body.datos).toHaveProperty('dni');
    });

    test('debe rechazar petición sin autenticación', async () => {
      const response = await request(app)
        .get('/api/clientes/perfil')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.exito).toBe(false);
    });
  });

  describe('GET /api/clientes/cuentas', () => {
    test('debe obtener cuentas del cliente', async () => {
      const response = await request(app)
        .get('/api/clientes/cuentas')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.exito).toBe(true);
      expect(Array.isArray(response.body.datos)).toBe(true);
      if (response.body.datos.length > 0) {
        expect(response.body.datos[0]).toHaveProperty('cuenta_id');
        expect(response.body.datos[0]).toHaveProperty('numero_cuenta');
      }
    });
  });

  describe('GET /api/clientes/dashboard', () => {
    test('debe obtener dashboard con resumen', async () => {
      const response = await request(app)
        .get('/api/clientes/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.exito).toBe(true);
      expect(response.body.datos).toHaveProperty('cuentas');
      expect(response.body.datos).toHaveProperty('facturas');
      expect(response.body.datos).toHaveProperty('reclamos');
    });
  });

  describe('GET /api/clientes/facturas', () => {
    test('debe obtener facturas del cliente', async () => {
      const response = await request(app)
        .get('/api/clientes/facturas')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.exito).toBe(true);
      expect(Array.isArray(response.body.datos)).toBe(true);
    });

    test('debe filtrar facturas por estado', async () => {
      const response = await request(app)
        .get('/api/clientes/facturas?estado=PENDIENTE')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.exito).toBe(true);
      expect(Array.isArray(response.body.datos)).toBe(true);
      if (response.body.datos.length > 0) {
        response.body.datos.forEach(factura => {
          expect(factura.estado).toBe('PENDIENTE');
        });
      }
    });

    test('debe respetar límite de paginación', async () => {
      const response = await request(app)
        .get('/api/clientes/facturas?limite=3')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.exito).toBe(true);
      expect(response.body.datos.length).toBeLessThanOrEqual(3);
    });
  });

  describe('GET /api/clientes/reclamos', () => {
    test('debe obtener reclamos del cliente', async () => {
      const response = await request(app)
        .get('/api/clientes/reclamos')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.exito).toBe(true);
      expect(Array.isArray(response.body.datos)).toBe(true);
    });
  });

  describe('POST /api/clientes/reclamos', () => {
    test('debe crear un nuevo reclamo', async () => {
      const response = await request(app)
        .post('/api/clientes/reclamos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cuenta_id: 2,
          tipo_id: 1,
          descripcion: 'Test de reclamo desde Jest',
          prioridad_id: 2
        })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.exito).toBe(true);
      expect(response.body.datos).toHaveProperty('reclamo_id');
      expect(response.body.datos.descripcion).toBe('Test de reclamo desde Jest');
    });

    test('debe rechazar reclamo sin campos requeridos', async () => {
      const response = await request(app)
        .post('/api/clientes/reclamos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cuenta_id: 2
          // Falta tipo_id y descripcion
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.exito).toBe(false);
    });
  });
});
