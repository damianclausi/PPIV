/**
 * Tests de Integración - OperarioController
 * 
 * Estos tests verifican el flujo completo de los endpoints de operarios
 * incluyendo la interacción con la base de datos real.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { createRequest, crearEmpleadoPrueba, crearSocioPrueba, loginYobtenerToken } from './setup/testHelpers.js';
import { queryTestDb, limpiarTablas } from './setup/dbSetup.js';

describe('OperarioController - Tests de Integración', () => {
  let operarioEmpleado;
  let operarioUsuario;
  let operarioToken;
  let socioPrueba;
  let cuentaPrueba;
  let reclamoPrueba;
  let tipoReclamoPrueba;
  let detalleTipoReclamoPrueba;
  let prioridadPrueba;
  // Los estados son strings directos, no necesitamos variables para estado_id

  beforeEach(async () => {
    // Limpiar datos antes de cada test
    await limpiarTablas(['usuario_rol', 'usuario', 'reclamo', 'orden_trabajo', 'cuenta', 'socio', 'empleado']);

    // Crear roles base si no existen
    await queryTestDb(`INSERT INTO rol (nombre, descripcion) VALUES ('OPERARIO', 'Operario') ON CONFLICT (nombre) DO NOTHING;`);

    // Los estados de reclamo son strings directos, no hay tabla estado_reclamo
    // Estados válidos: 'PENDIENTE', 'EN_PROCESO', 'RESUELTO', 'CERRADO'

    // Crear empleado operario
    operarioEmpleado = await crearEmpleadoPrueba({
      nombre: 'Pedro',
      apellido: 'García'
    });

    const { hashearPassword } = await import('../../_lib/utils/crypto.js');
    const hashPass = await hashearPassword('password123');
    const emailOperario = `operario_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@test.com`;

    const usuarioResult = await queryTestDb(
      `INSERT INTO usuario (email, hash_pass, activo, empleado_id)
       VALUES ($1, $2, $3, $4)
       RETURNING usuario_id, email, activo, empleado_id`,
      [emailOperario, hashPass, true, operarioEmpleado.empleado_id]
    );
    operarioUsuario = usuarioResult.rows[0];

    // Asignar rol OPERARIO
    await queryTestDb(
      `INSERT INTO usuario_rol (usuario_id, rol_id)
       SELECT $1, rol_id FROM rol WHERE nombre = 'OPERARIO'`,
      [operarioUsuario.usuario_id]
    );

    // Obtener token de autenticación
    operarioToken = await loginYobtenerToken(emailOperario, 'password123');

    // Crear datos adicionales para los tests
    // Crear socio y cuenta
    const emailSocio = `socio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@test.com`;
    socioPrueba = await crearSocioPrueba({ email: emailSocio });

    const servicioResult = await queryTestDb(
      `INSERT INTO servicio (nombre, descripcion, categoria, activo) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING RETURNING servicio_id`,
      ['Residencial', 'Servicio residencial', 'RESIDENCIAL', true]
    );
    const servicioId = servicioResult.rows[0]?.servicio_id || 
      (await queryTestDb(`SELECT servicio_id FROM servicio LIMIT 1`)).rows[0].servicio_id;

    const cuentaResult = await queryTestDb(
      `INSERT INTO cuenta (socio_id, servicio_id, numero_cuenta, direccion, localidad, activa)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (numero_cuenta) DO UPDATE SET numero_cuenta = EXCLUDED.numero_cuenta
       RETURNING cuenta_id, numero_cuenta`,
      [socioPrueba.socio_id, servicioId, `001-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 'Calle Test 123', 'Ugarte', true]
    );
    cuentaPrueba = cuentaResult.rows[0];

    // Crear tipo de reclamo y detalle
    const tipoReclamoResult = await queryTestDb(
      `INSERT INTO tipo_reclamo (nombre, descripcion) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING tipo_id`,
      ['TÉCNICO', 'Reclamos técnicos']
    );
    tipoReclamoPrueba = tipoReclamoResult.rows[0] || 
      (await queryTestDb(`SELECT tipo_id FROM tipo_reclamo LIMIT 1`)).rows[0];

    const detalleResult = await queryTestDb(
      `INSERT INTO detalle_tipo_reclamo (tipo_id, nombre) VALUES ($1, $2) RETURNING detalle_id`,
      [tipoReclamoPrueba.tipo_id, 'Corte de suministro']
    );
    detalleTipoReclamoPrueba = detalleResult.rows[0];

    // Crear prioridad (o usar existente)
    let prioridadResult = await queryTestDb(
      `SELECT prioridad_id FROM prioridad WHERE nombre = 'ALTA' LIMIT 1`
    );
    if (prioridadResult.rows.length === 0) {
      prioridadResult = await queryTestDb(
        `INSERT INTO prioridad (nombre, orden, color, activo) VALUES ($1, $2, $3, $4) RETURNING prioridad_id`,
        ['ALTA', 3, 'red', true]
      );
    }
    prioridadPrueba = prioridadResult.rows[0];

    // Crear reclamo
    const reclamoResult = await queryTestDb(
      `INSERT INTO reclamo (cuenta_id, detalle_id, descripcion, prioridad_id, estado, canal, fecha_alta)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING reclamo_id, descripcion, estado`,
      [
        cuentaPrueba.cuenta_id,
        detalleTipoReclamoPrueba.detalle_id,
        'Reclamo asignado al operario',
        prioridadPrueba.prioridad_id,
        'PENDIENTE', // Estado como string directo
        'WEB'
      ]
    );
    reclamoPrueba = reclamoResult.rows[0];

    // Crear OT asociada al reclamo y asignar al operario
    await queryTestDb(
      `INSERT INTO orden_trabajo (reclamo_id, empleado_id, estado, fecha_programada)
       VALUES ($1, $2, $3, NOW())`,
      [reclamoPrueba.reclamo_id, operarioEmpleado.empleado_id, 'ASIGNADA']
    );
  });

  describe('GET /api/operarios/perfil', () => {
    it('debería retornar el perfil del operario autenticado', async () => {
      const response = await createRequest()
        .get('/api/operarios/perfil')
        .set('Authorization', `Bearer ${operarioToken}`);

      expect(response.status).toBe(200);
      expect(response.body.exito).toBe(true);
      expect(response.body.datos).toHaveProperty('empleado_id', operarioEmpleado.empleado_id);
      expect(response.body.datos).toHaveProperty('nombre', 'Pedro');
      expect(response.body.datos).toHaveProperty('apellido', 'García');
    });

    it('debería retornar 401 sin token de autenticación', async () => {
      const response = await createRequest()
        .get('/api/operarios/perfil');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/operarios/dashboard', () => {
    it('debería retornar el dashboard del operario con estadísticas', async () => {
      const response = await createRequest()
        .get('/api/operarios/dashboard')
        .set('Authorization', `Bearer ${operarioToken}`);

      expect(response.status).toBe(200);
      expect(response.body.exito).toBe(true);
      expect(response.body.datos).toHaveProperty('reclamos');
      expect(response.body.datos.reclamos).toHaveProperty('pendientes');
      expect(response.body.datos.reclamos).toHaveProperty('en_proceso');
      expect(response.body.datos.reclamos).toHaveProperty('resueltos_hoy');
      expect(response.body.datos.reclamos).toHaveProperty('total');
      expect(response.body.datos).toHaveProperty('ultimos_reclamos');
    });
  });

  describe('GET /api/operarios/reclamos', () => {
    it('debería retornar los reclamos asignados al operario', async () => {
      const response = await createRequest()
        .get('/api/operarios/reclamos')
        .set('Authorization', `Bearer ${operarioToken}`);

      expect(response.status).toBe(200);
      expect(response.body.exito).toBe(true);
      expect(response.body.datos).toHaveProperty('reclamos');
      expect(Array.isArray(response.body.datos.reclamos)).toBe(true);
      // Debería incluir el reclamo que creamos
      expect(response.body.datos.reclamos.length).toBeGreaterThanOrEqual(1);
    });

    it('debería filtrar reclamos por estado', async () => {
      const response = await createRequest()
        .get('/api/operarios/reclamos?estado=PENDIENTE')
        .set('Authorization', `Bearer ${operarioToken}`);

      expect(response.status).toBe(200);
      expect(response.body.exito).toBe(true);
    });
  });

  describe('GET /api/operarios/reclamos/:id', () => {
    it('debería retornar el detalle de un reclamo asignado', async () => {
      const response = await createRequest()
        .get(`/api/operarios/reclamos/${reclamoPrueba.reclamo_id}`)
        .set('Authorization', `Bearer ${operarioToken}`);

      expect(response.status).toBe(200);
      expect(response.body.exito).toBe(true);
      expect(response.body.datos).toHaveProperty('reclamo_id', reclamoPrueba.reclamo_id);
      expect(response.body.datos).toHaveProperty('descripcion');
    });
  });

  describe('PATCH /api/operarios/reclamos/:id/estado', () => {
    it('debería actualizar el estado de un reclamo', async () => {
      const nuevoEstado = {
        estado: 'EN_PROCESO',
        observaciones: 'Iniciando trabajo en el reclamo'
      };

      const response = await createRequest()
        .patch(`/api/operarios/reclamos/${reclamoPrueba.reclamo_id}/estado`)
        .set('Authorization', `Bearer ${operarioToken}`)
        .send(nuevoEstado);

      expect(response.status).toBe(200);
      expect(response.body.exito).toBe(true);
      expect(response.body.datos).toHaveProperty('reclamo_id', reclamoPrueba.reclamo_id);
    });

    it('debería rechazar actualizar estado de reclamo no asignado', async () => {
      // Crear otro operario
      const otroOperario = await crearEmpleadoPrueba({});
      const { hashearPassword } = await import('../../_lib/utils/crypto.js');
      const hashPass = await hashearPassword('password123');
      const emailOtro = `otro_operario_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@test.com`;

      await queryTestDb(
        `INSERT INTO usuario (email, hash_pass, activo, empleado_id) VALUES ($1, $2, $3, $4) RETURNING usuario_id`,
        [emailOtro, hashPass, true, otroOperario.empleado_id]
      );

      await queryTestDb(
        `INSERT INTO usuario_rol (usuario_id, rol_id) SELECT $1, rol_id FROM rol WHERE nombre = 'OPERARIO'`,
        [(await queryTestDb(`SELECT usuario_id FROM usuario WHERE email = $1`, [emailOtro])).rows[0].usuario_id]
      );

      const tokenOtro = await loginYobtenerToken(emailOtro, 'password123');

      const nuevoEstado = {
        estado: 'EN_PROCESO',
        observaciones: 'Intentando actualizar reclamo ajeno'
      };

      const response = await createRequest()
        .patch(`/api/operarios/reclamos/${reclamoPrueba.reclamo_id}/estado`)
        .set('Authorization', `Bearer ${tokenOtro}`)
        .send(nuevoEstado);

      // Debería retornar 403 o 404 dependiendo de la implementación
      expect([403, 404]).toContain(response.status);
    });
  });
});

