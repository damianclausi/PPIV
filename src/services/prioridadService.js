import apiClient from './api';

/**
 * Servicio para gestionar prioridades de reclamos
 */
const prioridadService = {
  /**
   * Obtener todas las prioridades disponibles
   * @returns {Promise<Array>} Lista de prioridades con id, nombre, orden, color
   */
  async obtenerTodas() {
    const response = await apiClient.get('/api/prioridades');
    return response;
  },

  /**
   * Obtener una prioridad por ID
   * @param {number} id - ID de la prioridad
   * @returns {Promise<Object>} Prioridad
   */
  async obtenerPorId(id) {
    const response = await apiClient.get(`/api/prioridades/${id}`);
    return response;
  },

  /**
   * Obtener una prioridad por nombre
   * @param {string} nombre - Nombre de la prioridad (Alta, Media, Baja)
   * @returns {Promise<Object>} Prioridad
   */
  async obtenerPorNombre(nombre) {
    const response = await apiClient.get(`/api/prioridades/nombre/${nombre}`);
    return response;
  }
};

export default prioridadService;
