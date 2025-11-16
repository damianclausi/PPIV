/**
 * Helpers para Tests de Integración
 * 
 * Funciones auxiliares para facilitar la escritura de tests de integración
 */

import request from 'supertest';
import { app } from '../../../index.js';

/**
 * Crear un request de Supertest con la app configurada
 */
export function createRequest() {
  return request(app);
}

/**
 * Crear un token JWT de prueba
 */
export async function crearTokenPrueba(payload = {}) {
  const { generarToken } = await import('../../../_lib/utils/jwt.js');
  
  const defaultPayload = {
    usuario_id: 1,
    email: 'test@test.com',
    roles: ['CLIENTE'],
    ...payload
  };

  return generarToken(defaultPayload);
}

/**
 * Crear headers de autenticación
 */
export async function crearHeadersAutenticados(payload = {}) {
  const token = await crearTokenPrueba(payload);
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

/**
 * Helper para hacer login y obtener token real
 */
export async function loginYobtenerToken(email, password) {
  const response = await createRequest()
    .post('/api/auth/login')
    .send({ email, password });

  if (response.status === 200 && response.body.exito) {
    return response.body.datos.token;
  }

  throw new Error(`Login falló: ${response.body.mensaje || 'Error desconocido'}`);
}

/**
 * Helper para crear un usuario de prueba en la base de datos
 */
export async function crearUsuarioPrueba(datos = {}) {
  const { queryTestDb } = await import('./dbSetup.js');
  const { hashearPassword } = await import('../../_lib/utils/crypto.js');

  const usuarioDefault = {
    email: `test_${Date.now()}@test.com`,
    hash_pass: await hashearPassword('password123'),
    activo: true,
    ...datos
  };

  const result = await queryTestDb(
    `INSERT INTO usuario (email, hash_pass, activo, socio_id, empleado_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING usuario_id, email, activo`,
    [
      usuarioDefault.email,
      usuarioDefault.hash_pass,
      usuarioDefault.activo,
      usuarioDefault.socio_id || null,
      usuarioDefault.empleado_id || null
    ]
  );

  return result.rows[0];
}

/**
 * Helper para crear un socio de prueba
 */
export async function crearSocioPrueba(datos = {}) {
  const { queryTestDb } = await import('./dbSetup.js');

  const socioDefault = {
    nombre: 'Test',
    apellido: 'Usuario',
    dni: `${Date.now()}${Math.floor(Math.random() * 1000)}`, // DNI único usando timestamp
    email: `socio_${Date.now()}@test.com`,
    telefono: '1234567890',
    activo: true,
    ...datos
  };

  const result = await queryTestDb(
    `INSERT INTO socio (nombre, apellido, dni, email, telefono, activo)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING socio_id, nombre, apellido, dni, email, activo`,
    [
      socioDefault.nombre,
      socioDefault.apellido,
      socioDefault.dni,
      socioDefault.email,
      socioDefault.telefono,
      socioDefault.activo
    ]
  );

  return result.rows[0];
}

/**
 * Helper para crear un empleado de prueba
 */
export async function crearEmpleadoPrueba(datos = {}) {
  const { queryTestDb } = await import('./dbSetup.js');

  const empleadoDefault = {
    nombre: 'Test',
    apellido: 'Empleado',
    legajo: `LEG${Date.now()}`,
    fecha_ingreso: new Date(),
    activo: true,
    ...datos
  };

  const result = await queryTestDb(
    `INSERT INTO empleado (nombre, apellido, legajo, fecha_ingreso, activo)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING empleado_id, nombre, apellido, activo`,
    [
      empleadoDefault.nombre,
      empleadoDefault.apellido,
      empleadoDefault.legajo,
      empleadoDefault.fecha_ingreso,
      empleadoDefault.activo
    ]
  );

  return result.rows[0];
}

/**
 * Helper para limpiar datos de prueba después de un test
 */
export async function limpiarDatosPrueba(ids = {}) {
  const { queryTestDb } = await import('./dbSetup.js');

  if (ids.usuario_id) {
    await queryTestDb('DELETE FROM usuario WHERE usuario_id = $1', [ids.usuario_id]);
  }
  if (ids.socio_id) {
    await queryTestDb('DELETE FROM socio WHERE socio_id = $1', [ids.socio_id]);
  }
  if (ids.empleado_id) {
    await queryTestDb('DELETE FROM empleado WHERE empleado_id = $1', [ids.empleado_id]);
  }
}

/**
 * Esperar un tiempo (útil para tests asíncronos)
 */
export function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

