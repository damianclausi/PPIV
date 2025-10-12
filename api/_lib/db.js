import pg from 'pg';
import dotenv from 'dotenv';

// Cargar variables de entorno solo en desarrollo
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '../.env' });
}

const { Pool } = pg;

// Validar que DATABASE_URL esté presente
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR CRÍTICO: DATABASE_URL no está definida');
  console.error('Environment variables disponibles:', Object.keys(process.env).filter(k => k.includes('DB') || k.includes('DATABASE')));
  throw new Error('DATABASE_URL no está configurada en las variables de entorno');
}

console.log('🔍 DATABASE_URL detectada:', {
  length: process.env.DATABASE_URL.length,
  starts: process.env.DATABASE_URL.substring(0, 20),
  protocol: process.env.DATABASE_URL.split(':')[0]
});

// Configuración de conexión a PostgreSQL/Supabase
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Test de conexión
pool.on('connect', () => {
  console.log('✅ Conectado a PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Error en la conexión a PostgreSQL:', err);
});

// Función helper para queries
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Ejecutada query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Error en query:', error);
    throw error;
  }
};

export default pool;
