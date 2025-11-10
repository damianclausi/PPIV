import OrdenTrabajo from '../models/OrdenTrabajo.js';
import Cuadrilla from '../models/Cuadrilla.js';

/**
 * Controlador para gestión de itinerarios de cuadrillas
 * Sistema híbrido: coexiste con asignación directa de operarios
 */
class ItinerarioController {
  /**
   * POST /api/itinerario/asignar-cuadrilla
   * Asignar una OT a una cuadrilla (sin operario específico aún)
   */
  async asignarOTaCuadrilla(req, res) {
    try {
      const { ot_id, cuadrilla_id, fecha_programada } = req.body;


      // Convertir cuadrilla_id a número
      const cuadrillaIdNum = parseInt(cuadrilla_id);

      // Validar que la cuadrilla existe y está activa
      const cuadrilla = await Cuadrilla.obtenerPorId(cuadrillaIdNum);
      if (!cuadrilla) {
        return res.status(404).json({
          success: false,
          message: 'Cuadrilla no encontrada'
        });
      }

      // Validar que la cuadrilla tiene operarios activos
      const operarios = await Cuadrilla.obtenerOperariosDeCuadrilla(cuadrillaIdNum);
      if (operarios.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'La cuadrilla no tiene operarios activos asignados'
        });
      }

      // Asignar OT a cuadrilla (empleado_id = NULL)
      const resultado = await OrdenTrabajo.asignarACuadrilla(
        ot_id,
        cuadrillaIdNum,
        fecha_programada
      );

      res.json({
        success: true,
        message: 'OT asignada a cuadrilla exitosamente',
        data: resultado
      });
    } catch (error) {
      console.error('❌ Error al asignar OT a cuadrilla:', error);
      res.status(500).json({
        success: false,
        message: 'Error al asignar orden de trabajo a cuadrilla',
        error: error.message
      });
    }
  }

  /**
   * GET /api/itinerario/cuadrilla/:cuadrillaId
   * Obtener itinerario de una cuadrilla para una fecha (o todas si no se especifica)
   * Query params: fecha (YYYY-MM-DD) - opcional
   */
  async obtenerItinerarioCuadrilla(req, res) {
    try {
      const { cuadrillaId } = req.params;
      const { fecha } = req.query;


      let itinerario;
      
      if (fecha) {
        // Obtener itinerario para una fecha específica
        itinerario = await OrdenTrabajo.listarItinerarioCuadrilla(
          parseInt(cuadrillaId),
          fecha
        );
      } else {
        // Obtener TODOS los itinerarios de la cuadrilla
        itinerario = await OrdenTrabajo.listarTodosItinerariosCuadrilla(
          parseInt(cuadrillaId)
        );
      }

      res.json({
        success: true,
        data: itinerario,
        total: itinerario.length,
        cuadrilla_id: parseInt(cuadrillaId),
        fecha: fecha || 'todas'
      });
    } catch (error) {
      console.error('❌ Error al obtener itinerario:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener itinerario de cuadrilla',
        error: error.message
      });
    }
  }

  /**
   * GET /api/itinerario/mi-itinerario
   * Obtener itinerario del operario autenticado (de su cuadrilla)
   * Query params: fecha (YYYY-MM-DD)
   */
  async obtenerMiItinerario(req, res) {
    try {
      const empleado_id = req.usuario.empleado_id;
      const { fecha } = req.query;

      if (!fecha) {
        return res.status(400).json({
          success: false,
          message: 'Fecha requerida (formato: YYYY-MM-DD)'
        });
      }


      // Obtener cuadrilla del operario
      const cuadrilla = await Cuadrilla.obtenerCuadrillaPorOperario(empleado_id);
      
      if (!cuadrilla) {
        return res.json({
          success: true,
          message: 'No perteneces a ninguna cuadrilla activa',
          data: [],
          total: 0
        });
      }

      // Obtener itinerario de la cuadrilla
      const itinerario = await OrdenTrabajo.listarItinerarioCuadrilla(
        cuadrilla.cuadrilla_id,
        fecha
      );

      res.json({
        success: true,
        data: itinerario,
        total: itinerario.length,
        cuadrilla: cuadrilla,
        fecha: fecha
      });
    } catch (error) {
      console.error('❌ Error al obtener mi itinerario:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener tu itinerario',
        error: error.message
      });
    }
  }

  /**
   * PUT /api/itinerario/tomar/:otId
   * Operario "toma" una OT del itinerario de su cuadrilla
   */
  async tomarOT(req, res) {
    try {
      const { otId } = req.params;
      const empleado_id = req.usuario.empleado_id;


      // Validar que el operario pertenece a una cuadrilla
      const cuadrilla = await Cuadrilla.obtenerCuadrillaPorOperario(empleado_id);
      
      if (!cuadrilla) {
        return res.status(400).json({
          success: false,
          message: 'No perteneces a ninguna cuadrilla activa'
        });
      }

      // Tomar la OT (empleado_id NULL → empleado_id del operario)
      const resultado = await OrdenTrabajo.tomarOTDeItinerario(
        parseInt(otId),
        empleado_id,
        cuadrilla.cuadrilla_id
      );

      res.json({
        success: true,
        message: 'OT tomada exitosamente',
        data: resultado
      });
    } catch (error) {
      console.error('❌ Error al tomar OT:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al tomar orden de trabajo',
        error: error.message
      });
    }
  }

  /**
   * GET /api/itinerario/ots-pendientes
   * Obtener OTs pendientes disponibles para asignar a itinerario
   * Query params: tipo_reclamo (TECNICO por defecto)
   */
  async obtenerOTsPendientes(req, res) {
    try {
      const { tipo_reclamo = 'TECNICO' } = req.query;

      const ots = await OrdenTrabajo.listarPendientesSinAsignar(tipo_reclamo);

      res.json({
        success: true,
        data: ots,
        total: ots.length
      });
    } catch (error) {
      console.error('❌ Error al obtener OTs pendientes:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener órdenes pendientes',
        error: error.message
      });
    }
  }

  /**
   * DELETE /api/itinerario/quitar/:otId
   * Quitar una OT del itinerario (vuelve a PENDIENTE sin cuadrilla)
   */
  async quitarDelItinerario(req, res) {
    try {
      const { otId } = req.params;


      const resultado = await OrdenTrabajo.quitarDeItinerario(parseInt(otId));

      res.json({
        success: true,
        message: 'OT quitada del itinerario',
        data: resultado
      });
    } catch (error) {
      console.error('❌ Error al quitar OT del itinerario:', error);
      res.status(500).json({
        success: false,
        message: 'Error al quitar OT del itinerario',
        error: error.message
      });
    }
  }

  /**
   * GET /api/itinerario/fechas-disponibles
   * Obtener lista de fechas con itinerarios disponibles para el operario
   */
  async obtenerFechasDisponibles(req, res) {
    try {
      const empleado_id = req.usuario.empleado_id;


      // Obtener cuadrilla del operario
      const cuadrilla = await Cuadrilla.obtenerCuadrillaPorOperario(empleado_id);
      
      if (!cuadrilla) {
        return res.json({
          success: true,
          message: 'No perteneces a ninguna cuadrilla activa',
          data: []
        });
      }

      // Obtener fechas con itinerarios asignados a este operario específico
      const fechas = await OrdenTrabajo.obtenerFechasConItinerario(
        cuadrilla.cuadrilla_id,
        empleado_id
      );

      res.json({
        success: true,
        data: fechas,
        total: fechas.length,
        cuadrilla: cuadrilla
      });
    } catch (error) {
      console.error('❌ Error al obtener fechas con itinerarios:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener fechas disponibles',
        error: error.message
      });
    }
  }
}

export default new ItinerarioController();
