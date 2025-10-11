import api from './api';

const cuadrillasService = {
  /**
   * Listar cuadrillas activas
   */
  async listar() {
    try {
      const response = await api.get('/api/cuadrillas');
      return response;
    } catch (error) {
      console.error('Error al listar cuadrillas:', error);
      throw error;
    }
  },

  /**
   * Obtener detalle de una cuadrilla
   */
  async obtenerDetalle(cuadrillaId) {
    try {
      const response = await api.get(`/api/cuadrillas/${cuadrillaId}`);
      return response;
    } catch (error) {
      console.error('Error al obtener detalle de cuadrilla:', error);
      throw error;
    }
  },

  /**
   * Obtener operarios de una cuadrilla
   */
  async obtenerOperarios(cuadrillaId) {
    try {
      const response = await api.get(`/api/cuadrillas/${cuadrillaId}/operarios`);
      return response;
    } catch (error) {
      console.error('Error al obtener operarios de cuadrilla:', error);
      throw error;
    }
  },

  /**
   * Obtener estadísticas de una cuadrilla
   */
  async obtenerEstadisticas(cuadrillaId) {
    try {
      const response = await api.get(`/api/cuadrillas/${cuadrillaId}/estadisticas`);
      return response;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw error;
    }
  },

  /**
   * Obtener todos los operarios técnicos disponibles
   */
  async obtenerOperariosDisponibles() {
    try {
      const response = await api.get('/api/cuadrillas/operarios/disponibles');
      return response;
    } catch (error) {
      console.error('Error al obtener operarios disponibles:', error);
      throw error;
    }
  },

  /**
   * Obtener cuadrilla activa de un operario
   */
  async obtenerCuadrillaDeOperario(empleadoId) {
    try {
      const response = await api.get(`/api/cuadrillas/operario/${empleadoId}/cuadrilla`);
      return response;
    } catch (error) {
      console.error('Error al obtener cuadrilla del operario:', error);
      throw error;
    }
  }
};

export default cuadrillasService;
