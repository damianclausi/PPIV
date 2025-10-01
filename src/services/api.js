const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Cliente HTTP base para realizar peticiones a la API
 */
class ApiClient {
  constructor() {
    this.baseURL = API_URL;
  }

  /**
   * Obtener token de autenticación del localStorage
   */
  getToken() {
    return localStorage.getItem('token');
  }

  /**
   * Guardar token en localStorage
   */
  setToken(token) {
    localStorage.setItem('token', token);
  }

  /**
   * Eliminar token del localStorage
   */
  removeToken() {
    localStorage.removeItem('token');
  }

  /**
   * Obtener headers comunes para todas las peticiones
   */
  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Realizar petición HTTP genérica
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(options.auth !== false),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw {
          status: response.status,
          message: data.mensaje || data.error || 'Error en la petición',
          details: data,
        };
      }

      return data;
    } catch (error) {
      if (error.status === 401) {
        // Token inválido o expirado
        this.removeToken();
        window.location.href = '/login';
      }
      throw error;
    }
  }

  /**
   * Realizar petición GET
   */
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return this.request(url, {
      method: 'GET',
    });
  }

  /**
   * Realizar petición POST
   */
  async post(endpoint, data = {}, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    });
  }

  /**
   * Realizar petición PUT
   */
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Realizar petición PATCH
   */
  async patch(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * Realizar petición DELETE
   */
  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }
}

// Exportar la clase para que otros servicios puedan extenderla
export { ApiClient };

// También exportar una instancia por defecto
const apiClient = new ApiClient();
export default apiClient;
