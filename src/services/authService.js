import apiClient from './api';

/**
 * Servicio de autenticación
 */
const authService = {
  /**
   * Iniciar sesión
   */
  async login(email, password) {
    const response = await apiClient.post('/auth/login', { email, password }, { auth: false });
    
    if (response.datos && response.datos.token) {
      apiClient.setToken(response.datos.token);
    }
    
    return response.datos;
  },

  /**
   * Cerrar sesión
   */
  logout() {
    apiClient.removeToken();
  },

  /**
   * Obtener perfil del usuario autenticado
   */
  async obtenerPerfil() {
    const response = await apiClient.get('/auth/perfil');
    return response.datos;
  },

  /**
   * Verificar si el token es válido
   */
  async verificarToken() {
    try {
      const response = await apiClient.post('/auth/verificar');
      return response.datos;
    } catch (error) {
      return null;
    }
  },

  /**
   * Verificar si el usuario está autenticado
   */
  estaAutenticado() {
    return !!apiClient.getToken();
  },
};

export default authService;
