/**
 * Servicio de API para Administradores
 */

import apiClient from './api.js';

class AdministradorService {
  /**
   * Obtener perfil del administrador autenticado
   */
  async obtenerPerfil() {
    return apiClient.get('/api/administradores/perfil');
  }

  /**
   * Obtener dashboard con estadísticas generales
   */
  async obtenerDashboard() {
    return apiClient.get('/api/administradores/dashboard');
  }

  /**
   * Listar todos los socios
   */
  async listarSocios(filtros = {}) {
    const params = new URLSearchParams();
    
    if (filtros.activo !== undefined) params.append('activo', filtros.activo);
    if (filtros.pagina) params.append('pagina', filtros.pagina);
    if (filtros.limite) params.append('limite', filtros.limite);
    if (filtros.buscar) params.append('buscar', filtros.buscar);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get(`/api/administradores/socios${query}`);
  }

  /**
   * Obtener un socio específico
   */
  async obtenerSocio(id) {
    return apiClient.get(`/api/administradores/socios/${id}`);
  }

  /**
   * Actualizar datos de un socio
   */
  async actualizarSocio(id, datos) {
    return apiClient.put(`/api/administradores/socios/${id}`, datos);
  }

  /**
   * Listar todos los reclamos
   */
  async listarReclamos(filtros = {}) {
    const params = new URLSearchParams();
    
    if (filtros.estado) params.append('estado', filtros.estado);
    if (filtros.pagina) params.append('pagina', filtros.pagina);
    if (filtros.limite) params.append('limite', filtros.limite);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get(`/api/administradores/reclamos${query}`);
  }

  /**
   * Obtener un reclamo específico
   */
  async obtenerReclamo(id) {
    return apiClient.get(`/api/administradores/reclamos/${id}`);
  }

  /**
   * Asignar operario a un reclamo
   */
  async asignarOperarioReclamo(reclamoId, operarioId) {
    return apiClient.patch(`/api/administradores/reclamos/${reclamoId}/asignar`, { operario_id: operarioId });
  }

  /**
   * Listar todos los empleados
   */
  async listarEmpleados(filtros = {}) {
    const params = new URLSearchParams();
    
    if (filtros.activo !== undefined) params.append('activo', filtros.activo);
    if (filtros.pagina) params.append('pagina', filtros.pagina);
    if (filtros.limite) params.append('limite', filtros.limite);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get(`/api/administradores/empleados${query}`);
  }
}

export default new AdministradorService();
