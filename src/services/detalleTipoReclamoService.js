import apiClient from './api';

/**
 * Servicio para gestionar detalles de tipos de reclamo
 */
const detalleTipoReclamoService = {
  /**
   * Obtener todos los detalles de tipos de reclamo disponibles
   * @returns {Promise<Array>} Lista de detalles con detalle_id, nombre, tipo_id y tipo_nombre
   */
  async obtenerTodos() {
    const response = await apiClient.get('/detalles-tipo-reclamo');
    return response;
  },

  /**
   * Obtener detalles por tipo de reclamo (TECNICO=1, ADMINISTRATIVO=2)
   * @param {number} tipoId - ID del tipo de reclamo
   * @returns {Promise<Array>} Lista de detalles del tipo especificado
   */
  async obtenerPorTipo(tipoId) {
    const response = await apiClient.get(`/api/detalles-tipo-reclamo/tipo/${tipoId}`);
    return response;
  },

  /**
   * Obtener un detalle específico por ID
   * @param {number} detalleId - ID del detalle
   * @returns {Promise<Object>} Detalle de tipo de reclamo
   */
  async obtenerPorId(detalleId) {
    const response = await apiClient.get(`/api/detalles-tipo-reclamo/${detalleId}`);
    return response;
  }
};

export default detalleTipoReclamoService;
