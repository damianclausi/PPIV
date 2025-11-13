/**
 * Configuración de base de datos para tests
 * Permite usar una base de datos de prueba separada
 */

import pg from 'pg';
const { Pool } = pg;

// URL de base de datos de prueba
// En desarrollo, usar la misma DB pero con transacciones
const TEST_DB_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

let testPool;

/**
 * Crear pool de conexión para tests
 */
export const createTestPool = () => {
  if (!testPool) {
    testPool = new Pool({
      connectionString: TEST_DB_URL,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  return testPool;
};

/**
 * Obtener pool de prueba
 */
export const getTestPool = () => {
  return testPool || createTestPool();
};

/**
 * Limpiar pool después de tests
 */
export const closeTestPool = async () => {
  if (testPool) {
    await testPool.end();
    testPool = null;
  }
};

/**
 * Ejecutar query en pool de prueba
 */
export const testQuery = async (text, params) => {
  const pool = getTestPool();
  return await pool.query(text, params);
};

/**
 * Limpiar tablas de prueba (usar con cuidado)
 */
export const cleanTestTables = async () => {
  // Solo limpiar si estamos en modo test
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('cleanTestTables solo puede usarse en modo test');
  }
  
  const pool = getTestPool();
  // Aquí puedes agregar queries para limpiar datos de prueba
  // Por ahora, no limpiamos nada para no afectar la DB real
};

export default {
  createTestPool,
  getTestPool,
  closeTestPool,
  testQuery,
  cleanTestTables
};

