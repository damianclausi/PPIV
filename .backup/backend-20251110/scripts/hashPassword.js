import { hashearPassword } from '../utils/crypto.js';
import pool from '../db.js';

const actualizarPassword = async () => {
  try {
    const password = 'password123';
    const hash = await hashearPassword(password);
    
    console.log('Password hasheado:', hash);
    
    // Actualizar usuario de prueba
    const resultado = await pool.query(
      'UPDATE usuario SET hash_pass = $1 WHERE email = $2 RETURNING usuario_id, email',
      [hash, 'mariaelena.gonzalez@hotmail.com']
    );
    
    console.log('Usuario actualizado:', resultado.rows[0]);
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

actualizarPassword();
