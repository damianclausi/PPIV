/**
 * Custom Hooks para Operarios
 */

import { useState, useEffect } from 'react';
import operarioService from '../services/operarioService.js';

/**
 * Hook para obtener perfil del operario
 */
export function usePerfil() {
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarPerfil();
  }, []);

  const cargarPerfil = async () => {
    try {
      setCargando(true);
      const data = await operarioService.obtenerPerfil();
      setPerfil(data.datos);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error al cargar perfil:', err);
    } finally {
      setCargando(false);
    }
  };

  return { perfil, cargando, error, recargar: cargarPerfil };
}

/**
 * Hook para obtener dashboard del operario
 */
export function useDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarDashboard();
  }, []);

  const cargarDashboard = async () => {
    try {
      setCargando(true);
      const data = await operarioService.obtenerDashboard();
      setDashboard(data.datos);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error al cargar dashboard:', err);
    } finally {
      setCargando(false);
    }
  };

  return { dashboard, cargando, error, recargar: cargarDashboard };
}

/**
 * Hook para obtener reclamos del operario
 */
export function useReclamos(filtros = {}) {
  const [reclamos, setReclamos] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarReclamos();
  }, [filtros.estado, filtros.pagina]);

  const cargarReclamos = async () => {
    try {
      setCargando(true);
      const data = await operarioService.obtenerReclamos(filtros);
      setReclamos(data.datos.reclamos);
      setTotal(data.datos.total);
      setPagina(data.datos.pagina);
      setTotalPaginas(data.datos.totalPaginas);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error al cargar reclamos:', err);
    } finally {
      setCargando(false);
    }
  };

  return { 
    reclamos, 
    total, 
    pagina, 
    totalPaginas, 
    cargando, 
    error, 
    recargar: cargarReclamos 
  };
}

/**
 * Hook para actualizar estado de un reclamo
 */
export function useActualizarReclamo() {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const actualizarEstado = async (id, estado, observaciones = null) => {
    try {
      setCargando(true);
      const data = await operarioService.actualizarEstadoReclamo(id, estado, observaciones);
      setError(null);
      return data.datos;
    } catch (err) {
      setError(err.message);
      console.error('Error al actualizar reclamo:', err);
      throw err;
    } finally {
      setCargando(false);
    }
  };

  return { actualizarEstado, cargando, error };
}
