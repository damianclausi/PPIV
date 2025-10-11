/**
 * Custom Hooks para Administradores
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import administradorService from '../services/administradorService.js';

/**
 * Hook para obtener perfil del administrador
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
      const data = await administradorService.obtenerPerfil();
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
 * Hook para obtener dashboard del administrador
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
      const data = await administradorService.obtenerDashboard();
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
 * Hook para listar socios
 */
export function useSocios(filtros = {}) {
  const [socios, setSocios] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarSocios();
  }, [filtros.activo, filtros.pagina, filtros.busqueda, filtros.orden, filtros.direccion]);

  const cargarSocios = async () => {
    try {
      setCargando(true);
      const data = await administradorService.listarSocios(filtros);
      setSocios(data.datos.socios || data.datos);
      setTotal(data.datos.total || 0);
      setPagina(data.datos.pagina || 1);
      setTotalPaginas(data.datos.totalPaginas || 0);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error al cargar socios:', err);
    } finally {
      setCargando(false);
    }
  };

  return { 
    socios, 
    total, 
    pagina, 
    totalPaginas, 
    cargando, 
    error, 
    recargar: cargarSocios 
  };
}

/**
 * Hook para listar reclamos
 */
export function useReclamos(filtros = {}) {
  const [reclamos, setReclamos] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Memoizar los filtros stringified para evitar re-ejecuciones innecesarias
  const filtrosMemo = useMemo(() => JSON.stringify(filtros), [filtros]);

  const cargarReclamos = useCallback(async () => {
    try {
      setCargando(true);
      const data = await administradorService.listarReclamos(filtros);
      setReclamos(data.datos.reclamos || data.datos);
      setTotal(data.datos.total || 0);
      setPagina(data.datos.pagina || 1);
      setTotalPaginas(data.datos.totalPaginas || 0);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error al cargar reclamos:', err);
    } finally {
      setCargando(false);
    }
  }, [filtrosMemo]);

  useEffect(() => {
    cargarReclamos();
  }, [cargarReclamos]);

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
 * Hook para listar empleados
 */
export function useEmpleados(filtros = {}) {
  const [empleados, setEmpleados] = useState([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarEmpleados();
  }, [filtros.activo, filtros.pagina]);

  const cargarEmpleados = async () => {
    try {
      setCargando(true);
      const data = await administradorService.listarEmpleados(filtros);
      setEmpleados(data.datos.empleados || data.datos);
      setTotal(data.datos.total || 0);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error al cargar empleados:', err);
    } finally {
      setCargando(false);
    }
  };

  return { 
    empleados, 
    total, 
    cargando, 
    error, 
    recargar: cargarEmpleados 
  };
}

/**
 * Hook para obtener métricas avanzadas del sistema
 */
export function useMetricasAvanzadas() {
  const [metricas, setMetricas] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarMetricas();
  }, []);

  const cargarMetricas = async () => {
    try {
      setCargando(true);
      const data = await administradorService.obtenerMetricasAvanzadas();
      setMetricas(data.datos);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error al cargar métricas avanzadas:', err);
    } finally {
      setCargando(false);
    }
  };

  return { metricas, cargando, error, recargar: cargarMetricas };
}
