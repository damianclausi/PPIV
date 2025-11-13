/**
 * Funciones auxiliares para tests
 */

import { jest } from '@jest/globals';
import { generarToken } from '../../_lib/utils/jwt.js';

/**
 * Crear token JWT de prueba
 */
export const createTestToken = (payload = {}) => {
  const defaultPayload = {
    usuario_id: 1,
    email: 'test@example.com',
    roles: ['cliente']
  };
  
  return generarToken({ ...defaultPayload, ...payload });
};

/**
 * Crear headers con token de autenticación
 */
export const createAuthHeaders = (token) => {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

/**
 * Crear usuario de prueba (mock)
 */
export const createTestUser = (overrides = {}) => {
  return {
    usuario_id: 1,
    email: 'test@example.com',
    hash_pass: '$2b$10$hashedpassword',
    activo: true,
    socio_id: null,
    empleado_id: null,
    ...overrides
  };
};

/**
 * Crear cliente de prueba (mock)
 */
export const createTestCliente = (overrides = {}) => {
  return {
    socio_id: 1,
    nombre: 'Test Cliente',
    apellido: 'Test Apellido',
    email: 'cliente@test.com',
    activo: true,
    ...overrides
  };
};

/**
 * Crear operario de prueba (mock)
 */
export const createTestOperario = (overrides = {}) => {
  return {
    empleado_id: 1,
    nombre: 'Test Operario',
    apellido: 'Test Apellido',
    email: 'operario@test.com',
    cargo: 'Técnico Electricista',
    activo: true,
    ...overrides
  };
};

/**
 * Crear reclamo de prueba (mock)
 */
export const createTestReclamo = (overrides = {}) => {
  return {
    reclamo_id: 1,
    socio_id: 1,
    tipo_reclamo_id: 1,
    descripcion: 'Test reclamo',
    estado: 'Pendiente',
    fecha_creacion: new Date(),
    ...overrides
  };
};

/**
 * Esperar un tiempo (útil para tests asíncronos)
 */
export const wait = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Mock de respuesta Express
 */
export const createMockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
};

/**
 * Mock de request Express
 */
export const createMockRequest = (overrides = {}) => {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: null,
    ...overrides
  };
};

export default {
  createTestToken,
  createAuthHeaders,
  createTestUser,
  createTestCliente,
  createTestOperario,
  createTestReclamo,
  wait,
  createMockResponse,
  createMockRequest
};

