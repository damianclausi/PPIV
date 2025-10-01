import apiClient from './api';

/**
 * Servicio de cliente (socio)
 */
const clienteService = {
  /**
   * Obtener perfil del cliente
   */
  async obtenerPerfil() {
    const response = await apiClient.get('/api/clientes/perfil');
    return response.datos;
  },

  /**
   * Obtener cuentas del cliente
   */
  async obtenerCuentas() {
    const response = await apiClient.get('/api/clientes/cuentas');
    return response.datos;
  },

  /**
   * Obtener dashboard con resumen
   */
  async obtenerDashboard() {
    const response = await apiClient.get('/api/clientes/dashboard');
    return response.datos;
  },

  /**
   * Obtener facturas del cliente
   */
  async obtenerFacturas(params = {}) {
    const response = await apiClient.get('/api/clientes/facturas', params);
    return response.datos;
  },

  /**
   * Obtener detalle de una factura
   */
  async obtenerFactura(id) {
    const response = await apiClient.get(`/api/clientes/facturas/${id}`);
    return response.datos;
  },

  /**
   * Obtener reclamos del cliente
   */
  async obtenerReclamos(params = {}) {
    const response = await apiClient.get('/api/clientes/reclamos', params);
    return response.datos;
  },

  /**
   * Obtener detalle de un reclamo
   */
  async obtenerReclamo(id) {
    const response = await apiClient.get(`/api/clientes/reclamos/${id}`);
    return response.datos;
  },

  /**
   * Crear nuevo reclamo
   */
  async crearReclamo(datos) {
    const response = await apiClient.post('/api/clientes/reclamos', datos);
    return response.datos;
  },
};

export default clienteService;
