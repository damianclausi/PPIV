import api from './api';

const otTecnicasService = {
  /**
   * Listar OTs técnicas con filtros
   */
  async listar(filtros = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filtros.estado) params.append('estado', filtros.estado);
      if (filtros.empleado_id) params.append('empleado_id', filtros.empleado_id);
      if (filtros.cuadrilla_id) params.append('cuadrilla_id', filtros.cuadrilla_id);
      if (filtros.limite) params.append('limite', filtros.limite);
      if (filtros.offset) params.append('offset', filtros.offset);

      const response = await api.get(`/ot-tecnicas?${params.toString()}`);
      return response; // Devolver el objeto completo { success, data, total }
    } catch (error) {
      console.error('Error al listar OTs técnicas:', error);
      throw error;
    }
  },

  /**
   * Obtener detalle de una OT técnica
   */
  async obtenerDetalle(otId) {
    try {
      const response = await api.get(`/ot-tecnicas/${otId}`);
      return response;
    } catch (error) {
      console.error('Error al obtener detalle de OT:', error);
      throw error;
    }
  },

  /**
   * Obtener mis OTs (operario autenticado)
   */
  async obtenerMisOTs(estado = null) {
    try {
      const params = estado ? `?estado=${estado}` : '';
      const response = await api.get(`/ot-tecnicas/mis-ots${params}`);
      return response;
    } catch (error) {
      console.error('Error al obtener mis OTs:', error);
      throw error;
    }
  },

  /**
   * Obtener OTs de un operario específico
   */
  async obtenerPorOperario(empleadoId, estado = null) {
    try {
      const params = estado ? `?estado=${estado}` : '';
      const response = await api.get(`/ot-tecnicas/operario/${empleadoId}${params}`);
      return response;
    } catch (error) {
      console.error('Error al obtener OTs del operario:', error);
      throw error;
    }
  },

  /**
   * Asignar operario a una OT PENDIENTE
   */
  async asignarOperario(otId, empleadoId) {
    try {
      const response = await api.put(`/ot-tecnicas/${otId}/asignar`, {
        empleado_id: empleadoId
      });
      return response;
    } catch (error) {
      console.error('Error al asignar operario:', error);
      throw error;
    }
  },

  /**
   * Iniciar trabajo (ASIGNADA → EN_PROCESO)
   */
  async iniciarTrabajo(otId) {
    try {
      const response = await api.put(`/ot-tecnicas/${otId}/iniciar`);
      return response;
    } catch (error) {
      console.error('Error al iniciar trabajo:', error);
      throw error;
    }
  },

  /**
   * Completar trabajo (EN_PROCESO → COMPLETADA)
   */
  async completarTrabajo(otId, observaciones) {
    try {
      const response = await api.put(`/ot-tecnicas/${otId}/completar`, {
        observaciones
      });
      return response;
    } catch (error) {
      console.error('Error al completar trabajo:', error);
      throw error;
    }
  },

  /**
   * Cancelar OT
   */
  async cancelar(otId, motivo) {
    try {
      const response = await api.put(`/ot-tecnicas/${otId}/cancelar`, {
        motivo
      });
      return response;
    } catch (error) {
      console.error('Error al cancelar OT:', error);
      throw error;
    }
  }
};

export default otTecnicasService;
