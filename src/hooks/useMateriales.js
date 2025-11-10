import { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export function useMateriales() {
  const [materiales, setMateriales] = useState([]);
  const [materialesUsados, setMaterialesUsados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Obtener lista de materiales disponibles
   */
  const listarMateriales = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/operarios/materiales`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', errorData);
        throw new Error(errorData.mensaje || 'Error al cargar materiales');
      }
      
      const data = await response.json();
      const materiales = data.datos || data.data || [];
      setMateriales(materiales);
      return { success: true, data: materiales };
    } catch (err) {
      const mensaje = err.message || 'Error al cargar materiales';
      console.error('Error en listarMateriales:', mensaje, err);
      setError(mensaje);
      return { success: false, error: mensaje };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Registrar materiales usados en una OT
   */
  const registrarMateriales = async (otId, materiales) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/operarios/ot/${otId}/materiales`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ materiales })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.mensaje || 'Error al registrar materiales');
      }
      
      const data = await response.json();
      const resultData = data.datos || data.data || [];
      return { success: true, data: resultData };
    } catch (err) {
      const mensaje = err.message || 'Error al registrar materiales';
      setError(mensaje);
      return { success: false, error: mensaje };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Obtener materiales usados en una OT
   */
  const obtenerMaterialesOT = async (otId) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/operarios/ot/${otId}/materiales`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar materiales usados');
      }
      
      const data = await response.json();
      const materialesData = data.datos || data.data || [];
      setMaterialesUsados(materialesData);
      return { success: true, data: materialesData };
    } catch (err) {
      const mensaje = err.message || 'Error al cargar materiales usados';
      setError(mensaje);
      return { success: false, error: mensaje };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Obtener materiales usados en un reclamo
   */
  const obtenerMaterialesReclamo = async (reclamoId) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/operarios/reclamos/${reclamoId}/materiales`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar materiales usados');
      }
      
      const data = await response.json();
      const materialesData = data.datos || data.data || [];
      setMaterialesUsados(materialesData);
      return { success: true, data: materialesData };
    } catch (err) {
      const mensaje = err.message || 'Error al cargar materiales usados';
      setError(mensaje);
      return { success: false, error: mensaje };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Eliminar un registro de uso de material
   */
  const eliminarUsoMaterial = async (usoMaterialId) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/operarios/materiales/${usoMaterialId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.mensaje || 'Error al eliminar material');
      }
      
      const data = await response.json();
      const resultData = data.datos || data.data || {};
      return { success: true, data: resultData };
    } catch (err) {
      const mensaje = err.message || 'Error al eliminar material';
      setError(mensaje);
      return { success: false, error: mensaje };
    } finally {
      setLoading(false);
    }
  };

  return {
    materiales,
    materialesUsados,
    loading,
    error,
    listarMateriales,
    registrarMateriales,
    obtenerMaterialesOT,
    obtenerMaterialesReclamo,
    eliminarUsoMaterial
  };
}
