/**
 * Setup de Base de Datos para Tests de Integración
 * 
 * Este archivo configura y gestiona la conexión a la base de datos de prueba.
 * Se recomienda usar una base de datos separada para tests.
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Pool } = pg;

// Cargar variables de entorno desde .env
// Buscar .env en la raíz del proyecto
// dbSetup.js está en: api/__tests__/integration/setup/
// Necesitamos subir 4 niveles para llegar a la raíz: ../../../../.env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '../../../../.env');

// Intentar cargar .env
const result = dotenv.config({ path: envPath });
if (result.error && result.error.code !== 'ENOENT') {
  console.warn('⚠️  Advertencia al cargar .env:', result.error.message);
}

// URL de conexión para tests
// Por defecto usa la misma base de datos pero con un schema de prueba
// O puedes usar una base de datos completamente separada
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

if (!TEST_DATABASE_URL) {
  console.error('❌ Variables de entorno disponibles:', {
    hasDATABASE_URL: !!process.env.DATABASE_URL,
    hasTEST_DATABASE_URL: !!process.env.TEST_DATABASE_URL,
    envPath,
    NODE_ENV: process.env.NODE_ENV
  });
  throw new Error('TEST_DATABASE_URL o DATABASE_URL debe estar configurada para tests de integración');
}

// Pool de conexiones para tests
let testPool = null;

/**
 * Obtener o crear el pool de conexiones de prueba
 */
export function getTestPool() {
  if (!testPool) {
    testPool = new Pool({
      connectionString: TEST_DATABASE_URL,
      max: 5, // Menos conexiones para tests
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    // Manejo de errores
    testPool.on('error', (err) => {
      console.error('❌ Error inesperado en el pool de tests:', err);
    });
  }

  return testPool;
}

/**
 * Cerrar todas las conexiones del pool
 */
export async function closeTestPool() {
  if (testPool) {
    await testPool.end();
    testPool = null;
  }
}

/**
 * Ejecutar una query en la base de datos de prueba
 */
export async function queryTestDb(query, params = []) {
  const pool = getTestPool();
  return await pool.query(query, params);
}

/**
 * Limpiar tablas específicas (útil para resetear datos entre tests)
 * 
 * IMPORTANTE: Solo limpia datos, no elimina tablas ni estructura
 */
export async function limpiarTablas(tablas = []) {
  const pool = getTestPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Desactivar temporalmente las foreign keys (PostgreSQL)
    // Nota: PostgreSQL no tiene "foreign keys" desactivables como MySQL,
    // así que debemos eliminar en el orden correcto (primero las tablas dependientes)
    const ordenEliminacion = [
      'valoracion',              // Depende de: reclamo, socio
      'uso_material',            // Depende de: orden_trabajo, material
      'orden_trabajo',           // Depende de: reclamo, empleado
      'reclamo',                 // Depende de: cuenta, detalle_tipo_reclamo, prioridad, empleado
      'factura',                 // Depende de: cuenta
      'lectura',                 // Depende de: medidor
      'medidor',                 // Depende de: cuenta
      'cuenta',                  // Depende de: socio, servicio
      'itinerario_det',          // Depende de: itinerario, orden_trabajo
      'itinerario',              // Depende de: cuadrilla
      'cuadrilla',               // Depende de: empleado (a través de empleado_cuadrilla)
      'usuario_rol',            // Tabla de relación N:N
      'empleado_cuadrilla',      // Tabla de relación N:N
      'usuario',                 // Depende de: socio, empleado
      'empleado',                // No tiene dependencias directas
      'socio',                   // No tiene dependencias directas
      'material',                // No tiene dependencias directas
      'servicio',                // No tiene dependencias directas
      'detalle_tipo_reclamo',    // Depende de: tipo_reclamo
      'tipo_reclamo',           // No tiene dependencias directas
      'prioridad'                // No tiene dependencias directas
    ];

    // Si se especifican tablas, usar ese orden, sino usar el orden por defecto
    const tablasALimpiar = tablas.length > 0 ? tablas : ordenEliminacion;

    for (const tabla of tablasALimpiar) {
      try {
        await client.query(`DELETE FROM ${tabla} CASCADE`);
      } catch (error) {
        // Ignorar errores si la tabla no existe
        if (!error.message.includes('does not exist')) {
          console.warn(`⚠️  No se pudo limpiar la tabla ${tabla}:`, error.message);
        }
      }
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Resetear secuencias de auto-incremento
 */
export async function resetearSecuencias() {
  const pool = getTestPool();
  
  // Obtener todas las secuencias
  const result = await pool.query(`
    SELECT sequence_name 
    FROM information_schema.sequences 
    WHERE sequence_schema = 'public'
  `);

  for (const row of result.rows) {
    try {
      await pool.query(`ALTER SEQUENCE ${row.sequence_name} RESTART WITH 1`);
    } catch (error) {
      console.warn(`⚠️  No se pudo resetear secuencia ${row.sequence_name}:`, error.message);
    }
  }
}

/**
 * Verificar que la base de datos está disponible
 */
export async function verificarConexion() {
  try {
    const pool = getTestPool();
    const result = await pool.query('SELECT NOW()');
    return result.rows[0].now;
  } catch (error) {
    throw new Error(`No se pudo conectar a la base de datos de prueba: ${error.message}`);
  }
}

/**
 * Setup global antes de todos los tests de integración
 */
export async function setupTestDb() {
  console.log('🔧 Configurando base de datos de prueba...');
  
  try {
    await verificarConexion();
    console.log('✅ Base de datos de prueba conectada');
  } catch (error) {
    console.error('❌ Error al conectar a la base de datos de prueba:', error);
    throw error;
  }
}

/**
 * Teardown global después de todos los tests de integración
 */
export async function teardownTestDb() {
  console.log('🧹 Limpiando conexiones de prueba...');
  await closeTestPool();
  console.log('✅ Conexiones cerradas');
}

