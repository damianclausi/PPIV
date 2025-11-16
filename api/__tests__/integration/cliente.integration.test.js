/**
 * Tests de Integración - ClienteController
 * 
 * Estos tests verifican el flujo completo de los endpoints de clientes
 * incluyendo la interacción con la base de datos real.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createRequest, crearUsuarioPrueba, crearSocioPrueba, loginYobtenerToken } from './setup/testHelpers.js';
import { queryTestDb, limpiarTablas } from './setup/dbSetup.js';

describe('ClienteController - Tests de Integración', () => {
  let socioPrueba;
  let usuarioPrueba;
  let clienteToken;
  let cuentaPrueba;
  let tipoReclamoPrueba;
  let detalleTipoReclamoPrueba;
  let prioridadPrueba;

  beforeEach(async () => {
    // Limpiar datos antes de cada test
    await limpiarTablas(['usuario_rol', 'usuario', 'reclamo', 'factura', 'cuenta', 'socio', 'empleado']);

    // Crear roles base si no existen
    await queryTestDb(`INSERT INTO rol (nombre, descripcion) VALUES ('CLIENTE', 'Cliente') ON CONFLICT (nombre) DO NOTHING;`);

    // Crear socio y usuario de prueba
    const emailUnico = `cliente_${Date.now()}@test.com`;
    socioPrueba = await crearSocioPrueba({
      email: emailUnico,
      nombre: 'Juan',
      apellido: 'Pérez'
    });

    const { hashearPassword } = await import('../../_lib/utils/crypto.js');
    const hashPass = await hashearPassword('password123');

    const usuarioResult = await queryTestDb(
      `INSERT INTO usuario (email, hash_pass, activo, socio_id)
       VALUES ($1, $2, $3, $4)
       RETURNING usuario_id, email, activo, socio_id`,
      [emailUnico, hashPass, true, socioPrueba.socio_id]
    );
    usuarioPrueba = usuarioResult.rows[0];

    // Asignar rol CLIENTE
    await queryTestDb(
      `INSERT INTO usuario_rol (usuario_id, rol_id)
       SELECT $1, rol_id FROM rol WHERE nombre = 'CLIENTE'`,
      [usuarioPrueba.usuario_id]
    );

    // Obtener token de autenticación
    clienteToken = await loginYobtenerToken(emailUnico, 'password123');

    // Crear datos adicionales necesarios para los tests
    // Crear servicio
    const servicioResult = await queryTestDb(
      `INSERT INTO servicio (nombre, descripcion, categoria, activo) VALUES ($1, $2, $3, $4) RETURNING servicio_id`,
      ['Residencial', 'Servicio residencial', 'RESIDENCIAL', true]
    );
    const servicioId = servicioResult.rows[0].servicio_id;

    // Crear cuenta de prueba
    const cuentaResult = await queryTestDb(
      `INSERT INTO cuenta (socio_id, servicio_id, numero_cuenta, direccion, localidad, activa)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING cuenta_id, numero_cuenta, direccion, activa`,
      [socioPrueba.socio_id, servicioId, `001-${Date.now()}`, 'Calle Test 123', 'Ugarte', true]
    );
    cuentaPrueba = cuentaResult.rows[0];

    // Crear tipo de reclamo (o usar existente)
    const tipoReclamoResult = await queryTestDb(
      `INSERT INTO tipo_reclamo (nombre, descripcion) VALUES ($1, $2) ON CONFLICT (nombre) DO NOTHING RETURNING tipo_id`,
      ['TÉCNICO', 'Reclamos técnicos']
    );
    tipoReclamoPrueba = tipoReclamoResult.rows[0] || 
      (await queryTestDb(`SELECT tipo_id FROM tipo_reclamo WHERE nombre = 'TÉCNICO' LIMIT 1`)).rows[0];

    // Crear detalle de tipo de reclamo
    const detalleResult = await queryTestDb(
      `INSERT INTO detalle_tipo_reclamo (tipo_id, nombre) VALUES ($1, $2) RETURNING detalle_id`,
      [tipoReclamoPrueba.tipo_id, 'Corte de suministro']
    );
    detalleTipoReclamoPrueba = detalleResult.rows[0];

    // Crear prioridad (o usar existente)
    let prioridadResult = await queryTestDb(
      `SELECT prioridad_id FROM prioridad WHERE nombre = 'MEDIA' LIMIT 1`
    );
    if (prioridadResult.rows.length === 0) {
      prioridadResult = await queryTestDb(
        `INSERT INTO prioridad (nombre, orden, color, activo) VALUES ($1, $2, $3, $4) RETURNING prioridad_id`,
        ['MEDIA', 2, 'yellow', true]
      );
    }
    prioridadPrueba = prioridadResult.rows[0];
  });

  afterEach(async () => {
    // Limpieza adicional si es necesaria
  });

  describe('GET /api/clientes/perfil', () => {
    it('debería retornar el perfil del cliente autenticado', async () => {
      const response = await createRequest()
        .get('/api/clientes/perfil')
        .set('Authorization', `Bearer ${clienteToken}`);

      expect(response.status).toBe(200);
      expect(response.body.exito).toBe(true);
      expect(response.body.datos).toHaveProperty('socio_id', socioPrueba.socio_id);
      expect(response.body.datos).toHaveProperty('nombre', 'Juan');
      expect(response.body.datos).toHaveProperty('apellido', 'Pérez');
      expect(response.body.datos).toHaveProperty('cuentas');
      expect(Array.isArray(response.body.datos.cuentas)).toBe(true);
    });

    it('debería retornar 401 sin token de autenticación', async () => {
      const response = await createRequest()
        .get('/api/clientes/perfil');

      expect(response.status).toBe(401);
    });

    it('debería retornar 403 si el usuario no es un socio', async () => {
      // Crear un empleado (no socio)
      const empleado = await queryTestDb(
        `INSERT INTO empleado (nombre, apellido, legajo, fecha_ingreso, activo) VALUES ($1, $2, $3, NOW(), $4) RETURNING empleado_id`,
        ['Test', 'Empleado', `LEG${Date.now()}`, true]
      );
      
      const { hashearPassword } = await import('../../_lib/utils/crypto.js');
      const hashPass = await hashearPassword('password123');
      const emailEmpleado = `empleado_${Date.now()}@test.com`;

      await queryTestDb(
        `INSERT INTO usuario (email, hash_pass, activo, empleado_id) VALUES ($1, $2, $3, $4) RETURNING usuario_id`,
        [emailEmpleado, hashPass, true, empleado.rows[0].empleado_id]
      );

      const tokenEmpleado = await loginYobtenerToken(emailEmpleado, 'password123');

      const response = await createRequest()
        .get('/api/clientes/perfil')
        .set('Authorization', `Bearer ${tokenEmpleado}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/clientes/cuentas', () => {
    it('debería retornar las cuentas del cliente', async () => {
      const response = await createRequest()
        .get('/api/clientes/cuentas')
        .set('Authorization', `Bearer ${clienteToken}`);

      expect(response.status).toBe(200);
      expect(response.body.exito).toBe(true);
      expect(Array.isArray(response.body.datos)).toBe(true);
      expect(response.body.datos.length).toBeGreaterThanOrEqual(1);
      expect(response.body.datos[0]).toHaveProperty('cuenta_id');
      expect(response.body.datos[0]).toHaveProperty('numero_cuenta');
    });
  });

  describe('GET /api/clientes/dashboard', () => {
    it('debería retornar el dashboard del cliente con estadísticas', async () => {
      const response = await createRequest()
        .get('/api/clientes/dashboard')
        .set('Authorization', `Bearer ${clienteToken}`);

      expect(response.status).toBe(200);
      expect(response.body.exito).toBe(true);
      expect(response.body.datos).toHaveProperty('cuentas');
      expect(response.body.datos).toHaveProperty('facturas');
      expect(response.body.datos).toHaveProperty('reclamos');
      expect(response.body.datos.cuentas).toHaveProperty('total');
      expect(response.body.datos.facturas).toHaveProperty('pendientes');
      expect(response.body.datos.reclamos).toHaveProperty('pendientes');
    });
  });

  describe('GET /api/clientes/facturas', () => {
    it('debería retornar las facturas del cliente', async () => {
      // Crear una factura de prueba
      await queryTestDb(
        `INSERT INTO factura (cuenta_id, periodo, importe, vencimiento, estado)
         VALUES ($1, DATE_TRUNC('month', CURRENT_DATE), $2, NOW() + INTERVAL '30 days', $3) RETURNING factura_id`,
        [cuentaPrueba.cuenta_id, 5000.00, 'PENDIENTE']
      );

      const response = await createRequest()
        .get('/api/clientes/facturas')
        .set('Authorization', `Bearer ${clienteToken}`);

      expect(response.status).toBe(200);
      expect(response.body.exito).toBe(true);
      expect(Array.isArray(response.body.datos)).toBe(true);
    });

    it('debería filtrar facturas por estado', async () => {
      const response = await createRequest()
        .get('/api/clientes/facturas?estado=PENDIENTE')
        .set('Authorization', `Bearer ${clienteToken}`);

      expect(response.status).toBe(200);
      expect(response.body.exito).toBe(true);
    });
  });

  describe('GET /api/clientes/reclamos', () => {
    it('debería retornar los reclamos del cliente', async () => {
      // Crear un reclamo de prueba
      await queryTestDb(
        `INSERT INTO reclamo (cuenta_id, detalle_id, descripcion, prioridad_id, estado, canal, fecha_alta)
         VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING reclamo_id`,
        [cuentaPrueba.cuenta_id, detalleTipoReclamoPrueba.detalle_id, 'Test reclamo', prioridadPrueba.prioridad_id, 'PENDIENTE', 'WEB']
      );

      const response = await createRequest()
        .get('/api/clientes/reclamos')
        .set('Authorization', `Bearer ${clienteToken}`);

      expect(response.status).toBe(200);
      expect(response.body.exito).toBe(true);
      expect(Array.isArray(response.body.datos)).toBe(true);
    });
  });

  describe('POST /api/clientes/reclamos', () => {
    it('debería crear un nuevo reclamo', async () => {
      // Los estados son strings directos, no necesitamos obtener estado_id

      const nuevoReclamo = {
        cuenta_id: cuentaPrueba.cuenta_id,
        detalle_id: detalleTipoReclamoPrueba.detalle_id,
        descripcion: 'Nuevo reclamo de prueba',
        prioridad_id: prioridadPrueba.prioridad_id
      };

      const response = await createRequest()
        .post('/api/clientes/reclamos')
        .set('Authorization', `Bearer ${clienteToken}`)
        .send(nuevoReclamo);

      expect(response.status).toBe(201);
      expect(response.body.exito).toBe(true);
      expect(response.body.datos).toHaveProperty('reclamo_id');
      expect(response.body.datos).toHaveProperty('descripcion', 'Nuevo reclamo de prueba');
    });

    it('debería rechazar crear reclamo sin campos requeridos', async () => {
      const response = await createRequest()
        .post('/api/clientes/reclamos')
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({
          cuenta_id: cuentaPrueba.cuenta_id
          // Faltan detalle_id y descripcion
        });

      expect(response.status).toBe(400);
      expect(response.body.exito).toBe(false);
    });

    it('debería rechazar crear reclamo con cuenta que no pertenece al socio', async () => {
      // Crear otro socio y cuenta
      const otroSocio = await crearSocioPrueba({ email: `otro_${Date.now()}@test.com` });
      const servicioResult = await queryTestDb(`SELECT servicio_id FROM servicio LIMIT 1`);
      const otraCuenta = await queryTestDb(
        `INSERT INTO cuenta (socio_id, servicio_id, numero_cuenta, direccion, localidad, activa)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING cuenta_id`,
        [otroSocio.socio_id, servicioResult.rows[0].servicio_id, `002-${Date.now()}`, 'Otra dirección', 'Ugarte', true]
      );

      const response = await createRequest()
        .post('/api/clientes/reclamos')
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({
          cuenta_id: otraCuenta.rows[0].cuenta_id,
          detalle_id: detalleTipoReclamoPrueba.detalle_id,
          descripcion: 'Reclamo con cuenta ajena',
          prioridad_id: prioridadPrueba.prioridad_id
        });

      expect(response.status).toBe(403);
      expect(response.body.exito).toBe(false);
    });
  });
});

