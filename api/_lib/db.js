import pg from 'pg';
import dotenv from 'dotenv';

// Cargar variables de entorno solo en desarrollo
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '../.env' });
}

const { Pool } = pg;

// Validar que DATABASE_URL esté presente (excepto en tests unitarios)
if (!process.env.DATABASE_URL && process.env.NODE_ENV !== 'test') {
  console.error('ERROR CRITICO: DATABASE_URL no esta definida');
  console.error('Environment variables disponibles:', Object.keys(process.env).filter(k => k.includes('DB') || k.includes('DATABASE')));
  throw new Error('DATABASE_URL no esta configurada en las variables de entorno');
}

// Limpiar la URL (remover espacios, saltos de línea, etc)
const databaseUrl = process.env.DATABASE_URL ? process.env.DATABASE_URL.trim() : 'postgresql://localhost:5432/test';

console.log('🔍 DATABASE_URL detectada:', {
  length: databaseUrl.length,
  starts: databaseUrl.substring(0, 20),
  protocol: databaseUrl.split(':')[0],
  hasSpaces: databaseUrl.includes(' '),
  hasNewlines: databaseUrl.includes('\n') || databaseUrl.includes('\r')
});

// Intentar parsear manualmente para mejores mensajes de error
let poolConfig;
try {
  // Para Supabase, usar configuración directa
  if (databaseUrl.includes('supabase') || databaseUrl.includes('pooler')) {
    console.log('🔧 Detectada conexión Supabase, usando configuración específica');
    poolConfig = {
      connectionString: databaseUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl: { rejectUnauthorized: false }
    };
  } else {
    poolConfig = {
      connectionString: databaseUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    };
  }
  
  console.log('✅ Configuración del pool preparada');
} catch (error) {
  console.error('❌ Error al preparar configuración:', error);
  throw error;
}

// Configuración de conexión a PostgreSQL/Supabase
let pool;
try {
  console.log('🔨 Creando pool de conexiones...');
  pool = new Pool(poolConfig);
  console.log('✅ Pool creado exitosamente');
} catch (error) {
  console.error('❌ ERROR al crear pool:', error);
  console.error('Config usada:', { ...poolConfig, connectionString: '***hidden***' });
  throw error;
}

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
