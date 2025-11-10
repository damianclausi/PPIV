/**
 * Controlador de Operarios
 * Maneja la lógica de negocio para operarios técnicos
 */

import Empleado from '../models/Empleado.js';
import Reclamo from '../models/Reclamo.js';
import Cuadrilla from '../models/Cuadrilla.js';
import UsoMaterial from '../models/UsoMaterial.js';
import { respuestaExitosa, respuestaError, respuestaNoEncontrado } from '../utils/respuestas.js';

export default class OperarioController {
  /**
   * Verificar si un operario tiene permisos para acceder a un reclamo
   * Permite acceso si:
   * 1. El reclamo está asignado directamente al operario
   * 2. El reclamo está en el itinerario de la cuadrilla del operario
   */
  static async verificarPermisosReclamo(empleadoId, reclamoId) {
    // Verificar asignación directa
    const reclamo = await Reclamo.obtenerPorId(reclamoId);
    if (!reclamo) {
      return false;
    }

    if (reclamo.operario_asignado_id === empleadoId) {
      return true;
    }

    // Verificar si está en el itinerario de la cuadrilla del operario
    const cuadrilla = await Cuadrilla.obtenerCuadrillaPorOperario(empleadoId);
    if (!cuadrilla) {
      return false;
    }

    // Verificar si la OT del reclamo está en el itinerario de la cuadrilla
    const pool = (await import('../db.js')).default;
    const result = await pool.query(`
      SELECT 1
      FROM orden_trabajo ot
      INNER JOIN itinerario_det id ON ot.ot_id = id.ot_id
      INNER JOIN itinerario i ON id.itinerario_id = i.itinerario_id
      WHERE ot.reclamo_id = $1
        AND i.cuadrilla_id = $2
      LIMIT 1
    `, [reclamoId, cuadrilla.cuadrilla_id]);

    return result.rows.length > 0;
  }
  static async obtenerPerfil(req, res) {
    try {
      const empleadoId = req.usuario.empleado_id;
      
      const perfil = await Empleado.obtenerPerfil(empleadoId);
      
      if (!perfil) {
        return respuestaNoEncontrado(res, 'Perfil de operario no encontrado');
      }
      
      return respuestaExitosa(res, perfil, 'Perfil de operario obtenido exitosamente');
    } catch (error) {
      console.error('Error al obtener perfil de operario:', error);
      return respuestaError(res, 'Error al obtener perfil de operario');
    }
  }

  /**
   * Obtener dashboard con estadísticas del operario
   */
  static async obtenerDashboard(req, res) {
    try {
      const empleadoId = req.usuario.empleado_id;
      
      // Obtener resumen de reclamos asignados
      const resumenReclamos = await Reclamo.obtenerResumenPorOperario(empleadoId);
      
      // Obtener últimos reclamos asignados
      const { reclamos: ultimosReclamos } = await Reclamo.obtenerPorOperario(
        empleadoId,
        { limite: 5, pagina: 1 }
      );
      
      const dashboard = {
        reclamos: {
          pendientes: resumenReclamos.pendientes || 0,
          en_proceso: resumenReclamos.en_proceso || 0,
          resueltos_hoy: resumenReclamos.resueltos_hoy || 0,
          total: resumenReclamos.total || 0
        },
        ultimos_reclamos: ultimosReclamos
      };
      
      return respuestaExitosa(res, dashboard, 'Dashboard de operario obtenido exitosamente');
    } catch (error) {
      console.error('Error al obtener dashboard de operario:', error);
      return respuestaError(res, 'Error al obtener dashboard de operario');
    }
  }

  /**
   * Obtener todos los reclamos asignados al operario
   */
  static async obtenerReclamos(req, res) {
    try {
      const empleadoId = req.usuario.empleado_id;
      const { estado, pagina = 1, limite = 10 } = req.query;
      
      const resultado = await Reclamo.obtenerPorOperario(empleadoId, {
        estado,
        pagina: parseInt(pagina),
        limite: parseInt(limite)
      });
      
      return respuestaExitosa(res, resultado, 'Reclamos obtenidos exitosamente');
    } catch (error) {
      console.error('Error al obtener reclamos de operario:', error);
      return respuestaError(res, 'Error al obtener reclamos');
    }
  }

  /**
   * Obtener un reclamo específico
   */
  static async obtenerReclamo(req, res) {
    try {
      const { id } = req.params;
      const empleadoId = req.usuario.empleado_id;
      
      const reclamo = await Reclamo.obtenerPorId(id);
      
      if (!reclamo) {
        return respuestaNoEncontrado(res, 'Reclamo no encontrado');
      }
      
      // Verificar permisos (asignación directa o itinerario de cuadrilla)
      const tienePermisos = await OperarioController.verificarPermisosReclamo(empleadoId, id);
      if (!tienePermisos) {
        return respuestaError(res, 'No tienes permiso para ver este reclamo', 403);
      }
      
      return respuestaExitosa(res, reclamo, 'Reclamo obtenido exitosamente');
    } catch (error) {
      console.error('Error al obtener reclamo:', error);
      return respuestaError(res, 'Error al obtener reclamo');
    }
  }

  /**
   * Actualizar estado de un reclamo
   */
  static async actualizarEstadoReclamo(req, res) {
    try {
      const { id } = req.params;
      const { estado, observaciones } = req.body;
      const empleadoId = req.usuario.empleado_id;
      
      // Validar campos requeridos
      if (!estado) {
        return respuestaError(res, 'El estado es requerido', 400);
      }
      
      // Verificar que el reclamo existe y el operario tiene permisos
      const reclamo = await Reclamo.obtenerPorId(id);
      
      if (!reclamo) {
        return respuestaNoEncontrado(res, 'Reclamo no encontrado');
      }
      
      // Verificar permisos (asignación directa o itinerario de cuadrilla)
      const tienePermisos = await OperarioController.verificarPermisosReclamo(empleadoId, id);
      if (!tienePermisos) {
        return respuestaError(res, 'No tienes permiso para actualizar este reclamo', 403);
      }
      
      // Actualizar estado
      const reclamoActualizado = await Reclamo.actualizarEstado(id, estado, observaciones);
      
      return respuestaExitosa(
        res,
        reclamoActualizado,
        'Estado del reclamo actualizado exitosamente'
      );
    } catch (error) {
      console.error('Error al actualizar estado de reclamo:', error);
      return respuestaError(res, 'Error al actualizar estado de reclamo');
    }
  }

  /**
   * Listar materiales disponibles
   */
  static async listarMateriales(req, res) {
    try {
      const materiales = await UsoMaterial.listarMateriales();
      return respuestaExitosa(res, materiales, 'Materiales obtenidos exitosamente');
    } catch (error) {
      console.error('Error al listar materiales:', error);
      return respuestaError(res, 'Error al listar materiales');
    }
  }

  /**
   * Registrar uso de materiales en una OT
   */
  static async registrarMateriales(req, res) {
    try {
      const { otId } = req.params;
      const { materiales } = req.body;
      const empleadoId = req.usuario.empleado_id;

      if (!Array.isArray(materiales) || materiales.length === 0) {
        return respuestaError(res, 'Debe proporcionar al menos un material', 400);
      }

      // Validar que cada material tenga los campos requeridos
      for (const mat of materiales) {
        if (!mat.material_id || !mat.cantidad) {
          return respuestaError(res, 'Cada material debe tener material_id y cantidad', 400);
        }
      }

      const resultado = await UsoMaterial.registrarMateriales(otId, empleadoId, materiales);
      
      return respuestaExitosa(
        res,
        resultado,
        'Materiales registrados exitosamente'
      );
    } catch (error) {
      console.error('Error al registrar materiales:', error);
      return respuestaError(res, error.message || 'Error al registrar materiales');
    }
  }

  /**
   * Obtener materiales usados en una OT
   */
  static async obtenerMaterialesOT(req, res) {
    try {
      const { otId } = req.params;
      const materiales = await UsoMaterial.obtenerPorOT(otId);
      
      return respuestaExitosa(
        res,
        materiales,
        'Materiales de la OT obtenidos exitosamente'
      );
    } catch (error) {
      console.error('Error al obtener materiales de OT:', error);
      return respuestaError(res, 'Error al obtener materiales de OT');
    }
  }

  /**
   * Obtener materiales usados en un reclamo
   */
  static async obtenerMaterialesReclamo(req, res) {
    try {
      const { id } = req.params;
      const materiales = await UsoMaterial.obtenerPorReclamo(id);
      
      return respuestaExitosa(
        res,
        materiales,
        'Materiales del reclamo obtenidos exitosamente'
      );
    } catch (error) {
      console.error('Error al obtener materiales de reclamo:', error);
      return respuestaError(res, 'Error al obtener materiales de reclamo');
    }
  }

  /**
   * Eliminar un registro de uso de material
   */
  static async eliminarUsoMaterial(req, res) {
    try {
      const { id } = req.params;
      const empleadoId = req.usuario.empleado_id;
      
      const resultado = await UsoMaterial.eliminar(id, empleadoId);
      
      return respuestaExitosa(
        res,
        resultado,
        'Uso de material eliminado exitosamente'
      );
    } catch (error) {
      console.error('Error al eliminar uso de material:', error);
      return respuestaError(res, error.message || 'Error al eliminar uso de material');
    }
  }
}
