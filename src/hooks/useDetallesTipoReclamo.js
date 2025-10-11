import { useState, useEffect } from 'react';
import detalleTipoReclamoService from '../services/detalleTipoReclamoService';

/**
 * Hook para obtener detalles de tipos de reclamo
 * @param {number} tipoId - (Opcional) ID del tipo para filtrar detalles
 * @returns {Object} { detalles, cargando, error, recargar }
 */
export const useDetallesTipoReclamo = (tipoId = null) => {
  const [detalles, setDetalles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargarDetalles = async () => {
    try {
      setCargando(true);
      setError(null);
      
      let data;
      if (tipoId) {
        data = await detalleTipoReclamoService.obtenerPorTipo(tipoId);
      } else {
        data = await detalleTipoReclamoService.obtenerTodos();
      }
      
      setDetalles(data || []);
    } catch (err) {
      console.error('Error al cargar detalles de tipos de reclamo:', err);
      setError(err.message || 'Error al cargar detalles');
      setDetalles([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDetalles();
  }, [tipoId]);

  return {
    detalles,
    cargando,
    error,
    recargar: cargarDetalles
  };
};

/**
 * Helper para obtener un detalle específico por ID del array de detalles
 * @param {Array} detalles - Array de detalles
 * @param {number} detalleId - ID del detalle a buscar
 * @returns {Object|null} Detalle encontrado o null
 */
export const obtenerDetallePorId = (detalles, detalleId) => {
  if (!detalles || !Array.isArray(detalles)) return null;
  return detalles.find(d => d.detalle_id === parseInt(detalleId)) || null;
};

/**
 * Helper para agrupar detalles por tipo
 * @param {Array} detalles - Array de detalles
 * @returns {Object} Objeto con detalles agrupados por tipo_nombre
 */
export const agruparDetallesPorTipo = (detalles) => {
  if (!detalles || !Array.isArray(detalles)) return {};
  
  return detalles.reduce((acc, detalle) => {
    const tipo = detalle.tipo_nombre || 'SIN_TIPO';
    if (!acc[tipo]) {
      acc[tipo] = [];
    }
    acc[tipo].push(detalle);
    return acc;
  }, {});
};
