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
  params.append('busqueda', filtros.busqueda ?? '');
    if (filtros.orden) params.append('orden', filtros.orden);
    if (filtros.direccion) params.append('direccion', filtros.direccion);
    
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
   * Crear un nuevo socio
   */
  async crearSocio(datos) {
    return apiClient.post('/api/administradores/socios', datos);
  }

  /**
   * Actualizar datos de un socio
   */
  async actualizarSocio(id, datos) {
    return apiClient.put(`/api/administradores/socios/${id}`, datos);
  }

  /**
   * Eliminar un socio (DELETE físico)
   */
  async eliminarSocio(id) {
    return apiClient.delete(`/api/administradores/socios/${id}`);
  }

  /**
   * Desactivar/Activar un socio (cambiar estado activo)
   */
  async cambiarEstadoSocio(id, activo) {
    return apiClient.patch(`/api/administradores/socios/${id}/estado`, { activo });
  }

  /**
   * Listar todos los reclamos
   */
  async listarReclamos(filtros = {}) {
    const params = new URLSearchParams();
    
    // Solo enviar estado si no es "todos"
    if (filtros.estado && filtros.estado !== 'todos') {
      params.append('estado', filtros.estado);
    }
    
    // Solo enviar prioridad si no es "todas"
    if (filtros.prioridad && filtros.prioridad !== 'todas') {
      params.append('prioridad', filtros.prioridad);
    }
    
    // Siempre enviar busqueda, incluso si está vacío
    params.append('busqueda', filtros.busqueda || '');
    if (filtros.tipo) params.append('tipo', filtros.tipo);
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
