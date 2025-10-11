import { useState, useCallback } from 'react';
import otTecnicasService from '../services/otTecnicasService';
import { toast } from 'sonner';

export const useOTsTecnicas = () => {
  const [ots, setOts] = useState([]);
  const [otDetalle, setOtDetalle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Listar OTs técnicas con filtros
   */
  const listarOTs = useCallback(async (filtros = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await otTecnicasService.listar(filtros);
      setOts(response.data || []);
      return response;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al cargar órdenes de trabajo';
      setError(errorMsg);
      toast.error(errorMsg);
      return { success: false, data: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener detalle de una OT
   */
  const obtenerDetalle = useCallback(async (otId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await otTecnicasService.obtenerDetalle(otId);
      setOtDetalle(response.data);
      return response;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al cargar detalle de la OT';
      setError(errorMsg);
      toast.error(errorMsg);
      return { success: false, data: null };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener mis OTs (operario autenticado)
   */
  const obtenerMisOTs = useCallback(async (estado = null) => {
    setLoading(true);
    setError(null);
    try {
      const response = await otTecnicasService.obtenerMisOTs(estado);
      setOts(response.data || []);
      return response;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al cargar tus órdenes de trabajo';
      setError(errorMsg);
      toast.error(errorMsg);
      return { success: false, data: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Asignar operario a una OT
   */
  const asignarOperario = useCallback(async (otId, empleadoId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await otTecnicasService.asignarOperario(otId, empleadoId);
      toast.success('Operario asignado correctamente');
      return response;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al asignar operario';
      setError(errorMsg);
      toast.error(errorMsg);
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Iniciar trabajo
   */
  const iniciarTrabajo = useCallback(async (otId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await otTecnicasService.iniciarTrabajo(otId);
      toast.success('Trabajo iniciado correctamente');
      return response;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al iniciar trabajo';
      setError(errorMsg);
      toast.error(errorMsg);
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Completar trabajo
   */
  const completarTrabajo = useCallback(async (otId, observaciones) => {
    setLoading(true);
    setError(null);
    try {
      const response = await otTecnicasService.completarTrabajo(otId, observaciones);
      toast.success('Trabajo completado correctamente');
      return response;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al completar trabajo';
      setError(errorMsg);
      toast.error(errorMsg);
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cancelar OT
   */
  const cancelarOT = useCallback(async (otId, motivo) => {
    setLoading(true);
    setError(null);
    try {
      const response = await otTecnicasService.cancelar(otId, motivo);
      toast.success('OT cancelada correctamente');
      return response;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al cancelar OT';
      setError(errorMsg);
      toast.error(errorMsg);
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    ots,
    otDetalle,
    loading,
    error,
    listarOTs,
    obtenerDetalle,
    obtenerOTPorId: obtenerDetalle, // Alias para claridad
    obtenerMisOTs,
    asignarOperario,
    iniciarTrabajo,
    completarTrabajo,
    cancelarOT
  };
};
