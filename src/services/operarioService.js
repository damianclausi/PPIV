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
   * Obtener reclamos asignados al operario
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
   * Normaliza EN_CURSO a EN_PROCESO para el backend
   */
  async actualizarEstadoReclamo(id, estado, observaciones = null) {
    // Normalizar estado del frontend al backend
    const estadoNormalizado = estado === 'en_curso' || estado === 'EN_CURSO' 
      ? 'EN_PROCESO' 
      : estado.toUpperCase();
    
    return apiClient.patch(`/api/operarios/reclamos/${id}/estado`, { 
      estado: estadoNormalizado, 
      observaciones 
    });
  }
}

export default new OperarioService();
