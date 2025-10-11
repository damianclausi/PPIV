import { useState, useEffect } from 'react';
import prioridadService from '../services/prioridadService';

/**
 * Hook para obtener todas las prioridades disponibles
 * @returns {Object} { prioridades, cargando, error }
 */
export const usePrioridades = () => {
  const [prioridades, setPrioridades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarPrioridades = async () => {
      try {
        setCargando(true);
        const datos = await prioridadService.obtenerTodas();
        setPrioridades(datos);
        setError(null);
      } catch (err) {
        console.error('Error al cargar prioridades:', err);
        setError(err.message || 'Error al cargar prioridades');
      } finally {
        setCargando(false);
      }
    };

    cargarPrioridades();
  }, []);

  /**
   * Obtener prioridad por ID
   * @param {number} id - ID de la prioridad
   * @returns {Object|null} Prioridad encontrada o null
   */
  const obtenerPorId = (id) => {
    return prioridades.find(p => p.prioridad_id === id) || null;
  };

  /**
   * Obtener prioridad por nombre
   * @param {string} nombre - Nombre de la prioridad
   * @returns {Object|null} Prioridad encontrada o null
   */
  const obtenerPorNombre = (nombre) => {
    return prioridades.find(p => p.nombre.toLowerCase() === nombre.toLowerCase()) || null;
  };

  /**
   * Obtener color de una prioridad
   * @param {number|string} idONombre - ID o nombre de la prioridad
   * @returns {string} Color hexadecimal de la prioridad
   */
  const obtenerColor = (idONombre) => {
    const prioridad = typeof idONombre === 'number' 
      ? obtenerPorId(idONombre)
      : obtenerPorNombre(idONombre);
    return prioridad?.color || '#808080';
  };

  return { 
    prioridades, 
    cargando, 
    error,
    obtenerPorId,
    obtenerPorNombre,
    obtenerColor
  };
};

/**
 * Hook para obtener una prioridad específica por ID
 * @param {number} id - ID de la prioridad
 * @returns {Object} { prioridad, cargando, error }
 */
export const usePrioridad = (id) => {
  const [prioridad, setPrioridad] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      setCargando(false);
      return;
    }

    const cargarPrioridad = async () => {
      try {
        setCargando(true);
        const datos = await prioridadService.obtenerPorId(id);
        setPrioridad(datos);
        setError(null);
      } catch (err) {
        console.error('Error al cargar prioridad:', err);
        setError(err.message || 'Error al cargar prioridad');
      } finally {
        setCargando(false);
      }
    };

    cargarPrioridad();
  }, [id]);

  return { prioridad, cargando, error };
};

export default usePrioridades;
