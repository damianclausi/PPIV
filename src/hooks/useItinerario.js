import { useState, useCallback } from 'react';
import itinerarioService from '../services/itinerarioService';
import { toast } from 'sonner';

/**
 * Hook personalizado para gestión de itinerarios de cuadrillas
 */
export const useItinerario = () => {
  const [itinerario, setItinerario] = useState([]);
  const [fechasDisponibles, setFechasDisponibles] = useState([]);
  const [otsPendientes, setOtsPendientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Asignar OT a cuadrilla
   */
  const asignarOTaCuadrilla = useCallback(async (ot_id, cuadrilla_id, fecha_programada) => {
    setLoading(true);
    setError(null);
    try {
      const response = await itinerarioService.asignarOTaCuadrilla(ot_id, cuadrilla_id, fecha_programada);
      if (response.success) {
        toast.success('OT asignada a cuadrilla exitosamente');
        return response.data;
      } else {
        throw new Error(response.message || 'Error al asignar OT');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Error al asignar OT a cuadrilla';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener itinerario de cuadrilla
   */
  const obtenerItinerarioCuadrilla = useCallback(async (cuadrillaId, fecha) => {
    setLoading(true);
    setError(null);
    try {
      const response = await itinerarioService.obtenerItinerarioCuadrilla(cuadrillaId, fecha);
      if (response.success) {
        setItinerario(response.data);
        return response.data;
      } else {
        throw new Error(response.message || 'Error al obtener itinerario');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Error al obtener itinerario de cuadrilla';
      setError(errorMsg);
      toast.error(errorMsg);
      setItinerario([]);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener mi itinerario (operario autenticado)
   */
  const obtenerMiItinerario = useCallback(async (fecha) => {
    setLoading(true);
    setError(null);
    try {
      const response = await itinerarioService.obtenerMiItinerario(fecha);
      if (response.success) {
        setItinerario(response.data);
        return response.data;
      } else {
        throw new Error(response.message || 'Error al obtener mi itinerario');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Error al obtener mi itinerario';
      setError(errorMsg);
      toast.error(errorMsg);
      setItinerario([]);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener fechas con itinerarios disponibles
   */
  const obtenerFechasDisponibles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await itinerarioService.obtenerFechasDisponibles();
      if (response.success) {
        setFechasDisponibles(response.data);
        return response.data;
      } else {
        throw new Error(response.message || 'Error al obtener fechas disponibles');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Error al obtener fechas con itinerarios';
      setError(errorMsg);
      toast.error(errorMsg);
      setFechasDisponibles([]);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Tomar una OT del itinerario
   */
  const tomarOT = useCallback(async (otId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await itinerarioService.tomarOT(otId);
      if (response.success) {
        toast.success('OT tomada exitosamente');
        // Actualizar el itinerario local
        setItinerario(prevItinerario => 
          prevItinerario.map(ot => 
            ot.id === otId ? response.data : ot
          )
        );
        return response.data;
      } else {
        throw new Error(response.message || 'Error al tomar OT');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Error al tomar OT';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener OTs pendientes sin asignar
   */
  const obtenerOTsPendientes = useCallback(async (tipoReclamo = 'TECNICO') => {
    setLoading(true);
    setError(null);
    try {
      const response = await itinerarioService.obtenerOTsPendientes(tipoReclamo);
      if (response.success || response.exito) {
        const ots = response.data || [];
        setOtsPendientes(ots);
        return ots;
      } else {
        throw new Error(response.message || response.mensaje || 'Error al obtener OTs pendientes');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Error al obtener OTs pendientes';
      setError(errorMsg);
      toast.error(errorMsg);
      setOtsPendientes([]);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Quitar OT del itinerario
   */
  const quitarDelItinerario = useCallback(async (otId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await itinerarioService.quitarDelItinerario(otId);
      if (response.success) {
        toast.success('OT removida del itinerario');
        // Actualizar el itinerario local
        setItinerario(prevItinerario => 
          prevItinerario.filter(ot => ot.id !== otId)
        );
        return response.data;
      } else {
        throw new Error(response.message || 'Error al quitar OT');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Error al quitar OT del itinerario';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Limpiar itinerario
   */
  const limpiarItinerario = useCallback(() => {
    setItinerario([]);
    setOtsPendientes([]);
    setError(null);
  }, []);

  return {
    // Estados
    itinerario,
    fechasDisponibles,
    otsPendientes,
    loading,
    error,
    
    // Métodos
    asignarOTaCuadrilla,
    obtenerItinerarioCuadrilla,
    obtenerMiItinerario,
    obtenerFechasDisponibles,
    tomarOT,
    obtenerOTsPendientes,
    quitarDelItinerario,
    limpiarItinerario
  };
};
