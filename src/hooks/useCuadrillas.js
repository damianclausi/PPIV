import { useState, useCallback } from 'react';
import cuadrillasService from '../services/cuadrillasService';
import { toast } from 'sonner';

export const useCuadrillas = () => {
  const [cuadrillas, setCuadrillas] = useState([]);
  const [operarios, setOperarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Listar cuadrillas activas
   */
  const listarCuadrillas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await cuadrillasService.listar();
      console.log('🔍 Respuesta cuadrillas:', response);
      const cuadrillasData = response.data || [];
      console.log('👥 Cuadrillas a establecer:', cuadrillasData);
      setCuadrillas(cuadrillasData);
      return response;
    } catch (err) {
      console.error('❌ Error al cargar cuadrillas:', err);
      const errorMsg = err.response?.data?.message || 'Error al cargar cuadrillas';
      setError(errorMsg);
      toast.error(errorMsg);
      return { success: false, data: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener operarios de una cuadrilla
   */
  const obtenerOperarios = useCallback(async (cuadrillaId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await cuadrillasService.obtenerOperarios(cuadrillaId);
      setOperarios(response.data || []);
      return response;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al cargar operarios';
      setError(errorMsg);
      toast.error(errorMsg);
      return { success: false, data: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener todos los operarios técnicos disponibles
   */
  const obtenerOperariosDisponibles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await cuadrillasService.obtenerOperariosDisponibles();
      setOperarios(response.data || []);
      return response;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al cargar operarios disponibles';
      setError(errorMsg);
      toast.error(errorMsg);
      return { success: false, data: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener cuadrilla de un operario
   */
  const obtenerCuadrillaDeOperario = useCallback(async (empleadoId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await cuadrillasService.obtenerCuadrillaDeOperario(empleadoId);
      return response;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al obtener cuadrilla del operario';
      setError(errorMsg);
      return { success: false, data: null };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    cuadrillas,
    operarios,
    loading,
    error,
    listarCuadrillas,
    obtenerOperarios,
    obtenerOperariosDisponibles,
    obtenerCuadrillaDeOperario
  };
};
