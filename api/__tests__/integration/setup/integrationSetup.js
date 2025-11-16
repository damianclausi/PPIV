/**
 * Setup Global para Tests de Integración
 * 
 * Este archivo se ejecuta antes y después de todos los tests de integración.
 * Configura el entorno y limpia recursos.
 */

import { jest, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { setupTestDb, teardownTestDb } from './dbSetup.js';

// Timeout global para tests de integración (más largo que unitarios)
jest.setTimeout(30000); // 30 segundos

/**
 * Setup antes de todos los tests
 */
beforeAll(async () => {
  console.log('🚀 Iniciando setup de tests de integración...');
  
  // Configurar variables de entorno para tests
  process.env.NODE_ENV = 'test';
  
  // Verificar que DATABASE_URL esté configurada
  if (!process.env.DATABASE_URL && !process.env.TEST_DATABASE_URL) {
    console.warn('⚠️  ADVERTENCIA: DATABASE_URL no está configurada.');
    console.warn('   Los tests de integración requieren una base de datos.');
    console.warn('   Configura TEST_DATABASE_URL o DATABASE_URL en tu .env');
  }

  try {
    await setupTestDb();
  } catch (error) {
    console.error('❌ Error en setup de tests de integración:', error);
    throw error;
  }
});

/**
 * Teardown después de todos los tests
 */
afterAll(async () => {
  console.log('🧹 Finalizando tests de integración...');
  
  try {
    await teardownTestDb();
  } catch (error) {
    console.error('❌ Error en teardown de tests de integración:', error);
  }
});

/**
 * Setup antes de cada test (opcional, se puede sobrescribir en tests individuales)
 */
beforeEach(() => {
  // Limpiar mocks si es necesario
  jest.clearAllMocks();
});

/**
 * Teardown después de cada test (opcional)
 */
afterEach(() => {
  // Limpiar datos si es necesario (se puede hacer en tests individuales)
});

