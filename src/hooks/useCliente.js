import { useState, useEffect, useCallback } from 'react';
import clienteService from '../services/clienteService';

/**
 * Hook para obtener el perfil del cliente
 */
export const usePerfil = () => {
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        setCargando(true);
        const datos = await clienteService.obtenerPerfil();
        setPerfil(datos);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    };

    cargarPerfil();
  }, []);

  return { perfil, cargando, error };
};

/**
 * Hook para obtener el dashboard del cliente
 */
export const useDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const recargar = async () => {
    try {
      setCargando(true);
      const datos = await clienteService.obtenerDashboard();
      setDashboard(datos);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    recargar();
  }, []);

  return { dashboard, cargando, error, recargar };
};

/**
 * Hook para obtener las facturas del cliente
 */
export const useFacturas = (params = {}) => {
  const [facturas, setFacturas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargarFacturas = async () => {
    try {
      setCargando(true);
      const datos = await clienteService.obtenerFacturas(params);
      setFacturas(datos);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarFacturas();
  }, [JSON.stringify(params)]);

  return { facturas, cargando, error, recargar: cargarFacturas };
};

/**
 * Hook para obtener una factura individual
 */
export const useFactura = (id) => {
  const [factura, setFactura] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargarFactura = async () => {
    try {
      setCargando(true);
      const datos = await clienteService.obtenerFactura(id);
      setFactura(datos);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (id) {
      cargarFactura();
    }
  }, [id]);

  return { factura, cargando, error, recargar: cargarFactura };
};

/**
 * Hook para obtener los reclamos del cliente
 */
export const useReclamos = (params = {}) => {
  const [reclamos, setReclamos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargarReclamos = useCallback(async () => {
    try {
      console.log('📥 Cargando reclamos del servidor...');
      setCargando(true);
      const datos = await clienteService.obtenerReclamos(params);
      console.log('✅ Reclamos cargados:', datos.length);
      setReclamos(datos);
      setError(null);
    } catch (err) {
      console.error('❌ Error al cargar reclamos:', err);
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [JSON.stringify(params)]); // Memoizar basado en params

  useEffect(() => {
    cargarReclamos();
  }, [cargarReclamos]);

  const crearReclamo = async (datos) => {
    try {
      const nuevoReclamo = await clienteService.crearReclamo(datos);
      await cargarReclamos(); // Recargar lista
      return nuevoReclamo;
    } catch (err) {
      throw err;
    }
  };

  return { reclamos, cargando, error, recargar: cargarReclamos, crearReclamo };
};

/**
 * Hook para obtener las cuentas del cliente
 */
export const useCuentas = () => {
  const [cuentas, setCuentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarCuentas = async () => {
      try {
        setCargando(true);
        const datos = await clienteService.obtenerCuentas();
        setCuentas(datos);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    };

    cargarCuentas();
  }, []);

  return { cuentas, cargando, error };
};
