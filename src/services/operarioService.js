/**
 * Servicio de API para Operarios
 */

import apiClient from './api.js';

class OperarioService {
  /**
   * Obtener perfil del operario autenticado
   */
  async obtenerPerfil() {
    return apiClient.get('/api/operarios/perfil');
  }

  /**
   * Obtener dashboard con estadísticas
   */
  async obtenerDashboard() {
    return apiClient.get('/api/operarios/dashboard');
  }

  /**
   * Obtener reclamos asignados
   */
  async obtenerReclamos(filtros = {}) {
    const params = new URLSearchParams();
    
    if (filtros.estado) params.append('estado', filtros.estado);
    if (filtros.pagina) params.append('pagina', filtros.pagina);
    if (filtros.limite) params.append('limite', filtros.limite);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get(`/api/operarios/reclamos${query}`);
  }

  /**
   * Obtener un reclamo específico
   */
  async obtenerReclamo(id) {
    return apiClient.get(`/api/operarios/reclamos/${id}`);
  }

  /**
   * Actualizar estado de un reclamo
   */
  async actualizarEstadoReclamo(id, estado, observaciones = null) {
    return apiClient.patch(`/api/operarios/reclamos/${id}/estado`, { estado, observaciones });
  }
}

export default new OperarioService();
