import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_muy_segura_cambiar_en_produccion';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';

/**
 * Generar token JWT
 */
export const generarToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
};

/**
 * Verificar token JWT
 */
export const verificarToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Decodificar token sin verificar (útil para debugging)
 */
export const decodificarToken = (token) => {
  return jwt.decode(token);
};
