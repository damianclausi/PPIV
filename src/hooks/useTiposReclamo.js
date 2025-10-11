import { useState, useEffect } from 'react';
import tipoReclamoService from '../services/tipoReclamoService';

/**
 * Hook para obtener todos los tipos de reclamo disponibles
 * @returns {Object} { tipos, cargando, error }
 */
export const useTiposReclamo = () => {
  const [tipos, setTipos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarTipos = async () => {
      try {
        setCargando(true);
        const datos = await tipoReclamoService.obtenerTodos();
        setTipos(datos);
        setError(null);
      } catch (err) {
        console.error('Error al cargar tipos de reclamo:', err);
        setError(err.message || 'Error al cargar tipos de reclamo');
      } finally {
        setCargando(false);
      }
    };

    cargarTipos();
  }, []);

  return { tipos, cargando, error };
};

/**
 * Hook para obtener un tipo de reclamo por ID
 * @param {number} id - ID del tipo de reclamo
 * @returns {Object} { tipo, cargando, error }
 */
export const useTipoReclamo = (id) => {
  const [tipo, setTipo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      setCargando(false);
      return;
    }

    const cargarTipo = async () => {
      try {
        setCargando(true);
        const datos = await tipoReclamoService.obtenerPorId(id);
        setTipo(datos);
        setError(null);
      } catch (err) {
        console.error('Error al cargar tipo de reclamo:', err);
        setError(err.message || 'Error al cargar tipo de reclamo');
      } finally {
        setCargando(false);
      }
    };

    cargarTipo();
  }, [id]);

  return { tipo, cargando, error };
};

export default useTiposReclamo;
