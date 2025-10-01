import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'cooperativa_ugarte',
  user: process.env.DB_USER || 'cooperativa_user',
  password: process.env.DB_PASSWORD || 'cooperativa_pass'
});

async function setupRolesYUsuarios() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Configurando roles y usuarios...\n');
    
    await client.query('BEGIN');
    
    // 1. Limpiar roles existentes
    console.log('1️⃣ Limpiando roles antiguos...');
    await client.query('DELETE FROM usuario_rol');
    await client.query('DELETE FROM rol');
    
    // 2. Crear los 3 roles principales
    console.log('2️⃣ Creando roles principales...');
    await client.query(`
      INSERT INTO rol (rol_id, nombre, descripcion) VALUES
      (1, 'CLIENTE', 'Cliente o socio de la cooperativa'),
      (2, 'OPERARIO', 'Operario técnico de la cooperativa'),
      (3, 'ADMIN', 'Administrador del sistema')
    `);
    
    // 3. Hashear password para todos los usuarios
    const password = 'password123';
    const hashPassword = await bcrypt.hash(password, 10);
    
    console.log('3️⃣ Actualizando contraseñas...');
    await client.query('UPDATE usuario SET hash_pass = $1', [hashPassword]);
    
    // 4. Asignar roles a los usuarios
    console.log('4️⃣ Asignando roles...');
    
    // CLIENTES (usuario_id 1-6)
    for (let i = 1; i <= 6; i++) {
      await client.query(
        'INSERT INTO usuario_rol (usuario_id, rol_id) VALUES ($1, 1)',
        [i]
      );
    }
    
    // OPERARIOS (usuario_id 7-8, 11)
    const operarios = [7, 8, 11];
    for (const id of operarios) {
      await client.query(
        'INSERT INTO usuario_rol (usuario_id, rol_id) VALUES ($1, 2)',
        [id]
      );
    }
    
    // ADMINISTRADORES (usuario_id 9-10)
    const admins = [9, 10];
    for (const id of admins) {
      await client.query(
        'INSERT INTO usuario_rol (usuario_id, rol_id) VALUES ($1, 3)',
        [id]
      );
    }
    
    await client.query('COMMIT');
    
    console.log('\n✅ Configuración completada!\n');
    
    // Mostrar resumen
    console.log('📋 RESUMEN DE USUARIOS:\n');
    
    const result = await client.query(`
      SELECT 
        u.usuario_id,
        u.email,
        COALESCE(s.nombre || ' ' || s.apellido, e.nombre || ' ' || e.apellido) as nombre_completo,
        r.nombre as rol
      FROM usuario u
      LEFT JOIN socio s ON u.socio_id = s.socio_id
      LEFT JOIN empleado e ON u.empleado_id = e.empleado_id
      LEFT JOIN usuario_rol ur ON u.usuario_id = ur.usuario_id
      LEFT JOIN rol r ON ur.rol_id = r.rol_id
      ORDER BY r.rol_id, u.usuario_id
    `);
    
    console.log('CLIENTES:');
    result.rows.filter(r => r.rol === 'CLIENTE').forEach(u => {
      console.log(`  ✓ ${u.email}`);
      console.log(`    Nombre: ${u.nombre_completo}`);
      console.log(`    Password: password123\n`);
    });
    
    console.log('OPERARIOS:');
    result.rows.filter(r => r.rol === 'OPERARIO').forEach(u => {
      console.log(`  ✓ ${u.email}`);
      console.log(`    Nombre: ${u.nombre_completo}`);
      console.log(`    Password: password123\n`);
    });
    
    console.log('ADMINISTRADORES:');
    result.rows.filter(r => r.rol === 'ADMIN').forEach(u => {
      console.log(`  ✓ ${u.email}`);
      console.log(`    Nombre: ${u.nombre_completo}`);
      console.log(`    Password: password123\n`);
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

setupRolesYUsuarios().catch(console.error);
