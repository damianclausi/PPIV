import apiClient from './api';

/**
 * Servicio para gestionar tipos de reclamo
 */
const tipoReclamoService = {
  /**
   * Obtener todos los tipos de reclamo disponibles
   * @returns {Promise<Array>} Lista de tipos de reclamo con tipo_id y nombre
   */
  async obtenerTodos() {
    const response = await apiClient.get('/api/tipos-reclamo');
    return response;
  },

  /**
   * Obtener un tipo de reclamo por ID
   * @param {number} id - ID del tipo de reclamo
   * @returns {Promise<Object>} Tipo de reclamo
   */
  async obtenerPorId(id) {
    const response = await apiClient.get(`/api/tipos-reclamo/${id}`);
    return response;
  }
};

export default tipoReclamoService;
