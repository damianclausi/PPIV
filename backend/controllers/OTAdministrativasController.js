import OrdenTrabajo from '../models/OrdenTrabajo.js';
import { respuestaExitosa, respuestaError, respuestaNoEncontrado } from '../utils/respuestas.js';

/**
 * Controlador para gestionar Órdenes de Trabajo ADMINISTRATIVAS
 * (Sin empleado asignado, gestionadas por administrador)
 */
class OTAdministrativasController {
  /**
   * Listar todas las OTs administrativas con filtros
   * GET /api/administradores/ots/administrativas
   */
  static async listar(req, res) {
    try {
      const { estado, pagina = 1, limite = 20 } = req.query;
      
      const offset = (parseInt(pagina) - 1) * parseInt(limite);
      const ots = await OrdenTrabajo.listarAdministrativas({
        estado,
        limite: parseInt(limite),
        offset
      });
      
      const contadores = await OrdenTrabajo.contarAdministrativas();
      
      return respuestaExitosa(res, {
        ots,
        contadores,
        paginacion: {
          pagina: parseInt(pagina),
          limite: parseInt(limite),
          total: contadores.total,
          totalPaginas: Math.ceil(contadores.total / parseInt(limite))
        }
      }, 'OTs administrativas obtenidas exitosamente');
    } catch (error) {
      console.error('Error al listar OTs administrativas:', error);
      return respuestaError(res, 'Error al listar OTs administrativas');
    }
  }

  /**
   * Obtener detalle completo de una OT administrativa
   * GET /api/administradores/ots/administrativas/:id
   */
  static async obtenerDetalle(req, res) {
    try {
      const { id } = req.params;
      
      const ot = await OrdenTrabajo.obtenerAdministrativaPorId(id);
      
      if (!ot) {
        return respuestaNoEncontrado(res, 'OT administrativa no encontrada');
      }
      
      return respuestaExitosa(res, ot, 'OT administrativa obtenida exitosamente');
    } catch (error) {
      console.error('Error al obtener OT administrativa:', error);
      return respuestaError(res, 'Error al obtener OT administrativa');
    }
  }

  /**
   * Marcar OT administrativa como EN_PROCESO
   * PATCH /api/administradores/ots/administrativas/:id/en-proceso
   */
  static async marcarEnProceso(req, res) {
    try {
      const { id } = req.params;
      const { observaciones } = req.body;
      
      const ot = await OrdenTrabajo.marcarEnProcesoAdministrativa(id, observaciones);
      
      return respuestaExitosa(res, ot, 'OT administrativa marcada como en proceso');
    } catch (error) {
      console.error('Error al marcar OT como en proceso:', error);
      
      if (error.message.includes('no encontrada') || error.message.includes('no está pendiente')) {
        return respuestaNoEncontrado(res, error.message);
      }
      
      return respuestaError(res, error.message || 'Error al marcar OT como en proceso');
    }
  }

  /**
   * Cerrar OT administrativa con resolución
   * PATCH /api/administradores/ots/administrativas/:id/cerrar
   */
  static async cerrar(req, res) {
    try {
      const { id } = req.params;
      const { observaciones } = req.body;
      
      // Validar observaciones obligatorias
      if (!observaciones || observaciones.trim() === '') {
        return respuestaError(res, 'Las observaciones de resolución son obligatorias', 400);
      }
      
      const ot = await OrdenTrabajo.cerrarAdministrativa(id, {
        observaciones: observaciones.trim()
      });
      
      return respuestaExitosa(res, ot, 'OT administrativa cerrada exitosamente');
    } catch (error) {
      console.error('Error al cerrar OT administrativa:', error);
      
      if (error.message === 'OT administrativa no encontrada') {
        return respuestaNoEncontrado(res, error.message);
      }
      
      return respuestaError(res, error.message || 'Error al cerrar OT administrativa');
    }
  }

  /**
   * Obtener resumen/estadísticas de OTs administrativas
   * GET /api/administradores/ots/administrativas/resumen
   */
  static async obtenerResumen(req, res) {
    try {
      const contadores = await OrdenTrabajo.contarAdministrativas();
      
      return respuestaExitosa(res, contadores, 'Resumen de OTs administrativas obtenido exitosamente');
    } catch (error) {
      console.error('Error al obtener resumen de OTs administrativas:', error);
      return respuestaError(res, 'Error al obtener resumen de OTs administrativas');
    }
  }
}

export default OTAdministrativasController;
