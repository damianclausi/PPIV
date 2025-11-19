import api from './api';

/**
 * Servicio para gestión de itinerarios de cuadrillas
 */
const itinerarioService = {
  /**
   * Asignar una OT a una cuadrilla (admin)
   */
  async asignarOTaCuadrilla(ot_id, cuadrilla_id, fecha_programada) {
    try {
      const response = await api.post('/itinerario/asignar-cuadrilla', {
        ot_id,
        cuadrilla_id,
        fecha_programada
      });
      return response;
    } catch (error) {
      console.error('Error al asignar OT a cuadrilla:', error);
      throw error;
    }
  },

  /**
   * Obtener itinerario de una cuadrilla para una fecha
   */
  async obtenerItinerarioCuadrilla(cuadrillaId, fecha) {
    try {
      const response = await api.get(`/api/itinerario/cuadrilla/${cuadrillaId}?fecha=${fecha}`);
      return response;
    } catch (error) {
      console.error('Error al obtener itinerario de cuadrilla:', error);
      throw error;
    }
  },

  /**
   * Obtener mi itinerario (operario autenticado)
   */
  async obtenerMiItinerario(fecha) {
    try {
      const response = await api.get(`/api/itinerario/mi-itinerario?fecha=${fecha}`);
      return response;
    } catch (error) {
      console.error('Error al obtener mi itinerario:', error);
      throw error;
    }
  },

  /**
   * Obtener fechas con itinerarios disponibles (operario autenticado)
   */
  async obtenerFechasDisponibles() {
    try {
      const response = await api.get('/itinerario/fechas-disponibles');
      return response;
    } catch (error) {
      console.error('Error al obtener fechas disponibles:', error);
      throw error;
    }
  },

  /**
   * Tomar una OT del itinerario (operario)
   */
  async tomarOT(otId) {
    try {
      const response = await api.put(`/api/itinerario/tomar/${otId}`);
      return response;
    } catch (error) {
      console.error('Error al tomar OT:', error);
      throw error;
    }
  },

  /**
   * Obtener OTs pendientes sin asignar (admin)
   */
  async obtenerOTsPendientes(tipo_reclamo = 'TECNICO') {
    try {
      const response = await api.get(`/api/itinerario/ots-pendientes?tipo_reclamo=${tipo_reclamo}`);
      return response;
    } catch (error) {
      console.error('Error al obtener OTs pendientes:', error);
      throw error;
    }
  },

  /**
   * Quitar OT del itinerario (admin)
   */
  async quitarDelItinerario(otId) {
    try {
      const response = await api.delete(`/api/itinerario/quitar/${otId}`);
      return response;
    } catch (error) {
      console.error('Error al quitar OT del itinerario:', error);
      throw error;
    }
  }
};

export default itinerarioService;
