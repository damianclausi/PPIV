/**
 * Setup global para tests
 * Se ejecuta antes de cada test suite
 */

import { jest } from '@jest/globals';

// Configurar variables de entorno para tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-jwt-testing-only';
process.env.JWT_EXPIRATION = '1h';

// Timeout global para tests
jest.setTimeout(10000);

// Setup de console para evitar logs en tests
global.console = {
  ...console,
  // Mantener solo errores y warnings
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: console.warn,
  error: console.error,
};

