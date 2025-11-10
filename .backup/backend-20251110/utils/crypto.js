import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Hashear contraseña
 */
export const hashearPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Comparar contraseña con hash
 */
export const compararPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};
