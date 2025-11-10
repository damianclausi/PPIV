import OrdenTrabajo from '../models/OrdenTrabajo.js';
import Cuadrilla from '../models/Cuadrilla.js';

class OTTecnicasController {
  /**
   * GET /api/ot-tecnicas
   * Listar todas las OTs técnicas con filtros
   */
  async listar(req, res) {
    try {
      console.log('🔍 OTTecnicasController.listar - Query params:', req.query);
      const { estado, empleado_id, cuadrilla_id, limite = 50, offset = 0 } = req.query;

      console.log('📞 Llamando a OrdenTrabajo.listarTecnicas con:', {
        estado,
        empleadoId: empleado_id ? parseInt(empleado_id) : null,
        cuadrillaId: cuadrilla_id ? parseInt(cuadrilla_id) : null,
        limite: parseInt(limite),
        offset: parseInt(offset)
      });

      const ots = await OrdenTrabajo.listarTecnicas({
        estado,
        empleadoId: empleado_id ? parseInt(empleado_id) : null,
        cuadrillaId: cuadrilla_id ? parseInt(cuadrilla_id) : null,
        limite: parseInt(limite),
        offset: parseInt(offset)
      });

      console.log('✅ OTs obtenidas:', ots.length);

      res.json({
        success: true,
        data: ots,
        total: ots.length
      });
    } catch (error) {
      console.error('❌ Error al listar OTs técnicas:', error);
      console.error('Stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Error al listar órdenes de trabajo técnicas',
        error: error.message
      });
    }
  }

  /**
   * GET /api/ot-tecnicas/:id
   * Obtener detalle de una OT técnica
   */
  async obtenerDetalle(req, res) {
    try {
      const { id } = req.params;
      const ot = await OrdenTrabajo.obtenerDetalleTecnica(parseInt(id));

      if (!ot) {
        return res.status(404).json({
          success: false,
          message: 'Orden de trabajo no encontrada'
        });
      }

      res.json({
        success: true,
        data: ot
      });
    } catch (error) {
      console.error('Error al obtener detalle de OT:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener detalle de la orden de trabajo',
        error: error.message
      });
    }
  }

  /**
   * PUT /api/ot-tecnicas/:id/asignar
   * Asignar operario a una OT PENDIENTE
   * Body: { empleado_id: number }
   */
  async asignarOperario(req, res) {
    try {
      const { id } = req.params;
      const { empleado_id } = req.body;

      if (!empleado_id) {
        return res.status(400).json({
          success: false,
          message: 'El empleado_id es requerido'
        });
      }

      const ot = await OrdenTrabajo.asignarOperario(
        parseInt(id),
        parseInt(empleado_id)
      );

      res.json({
        success: true,
        message: 'Operario asignado correctamente',
        data: ot
      });
    } catch (error) {
      console.error('Error al asignar operario:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al asignar operario',
        error: error.message
      });
    }
  }

  /**
   * PUT /api/ot-tecnicas/:id/iniciar
   * Operario inicia el trabajo (ASIGNADA → EN_PROCESO)
   * Requiere autenticación del operario
   */
  async iniciarTrabajo(req, res) {
    try {
      const { id } = req.params;
      const empleado_id = req.usuario?.empleado_id; // Desde middleware auth

      if (!empleado_id) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado o no es operario'
        });
      }

      const ot = await OrdenTrabajo.iniciarTrabajo(
        parseInt(id),
        parseInt(empleado_id)
      );

      res.json({
        success: true,
        message: 'Trabajo iniciado correctamente',
        data: ot
      });
    } catch (error) {
      console.error('Error al iniciar trabajo:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al iniciar trabajo',
        error: error.message
      });
    }
  }

  /**
   * PUT /api/ot-tecnicas/:id/completar
   * Operario completa el trabajo (EN_PROCESO → COMPLETADA)
   * Body: { observaciones: string }
   * Requiere autenticación del operario
   */
  async completarTrabajo(req, res) {
    try {
      const { id } = req.params;
      const { observaciones } = req.body;
      const empleado_id = req.usuario?.empleado_id; // Desde middleware auth

      if (!empleado_id) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado o no es operario'
        });
      }

      if (!observaciones || observaciones.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Las observaciones son requeridas para completar el trabajo'
        });
      }

      const ot = await OrdenTrabajo.completarTrabajo(
        parseInt(id),
        parseInt(empleado_id),
        observaciones
      );

      res.json({
        success: true,
        message: 'Trabajo completado correctamente',
        data: ot
      });
    } catch (error) {
      console.error('Error al completar trabajo:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al completar trabajo',
        error: error.message
      });
    }
  }

  /**
   * PUT /api/ot-tecnicas/:id/cancelar
   * Cancelar OT técnica (solo PENDIENTE o ASIGNADA)
   * Body: { motivo: string }
   */
  async cancelar(req, res) {
    try {
      const { id } = req.params;
      const { motivo } = req.body;

      if (!motivo || motivo.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'El motivo de cancelación es requerido'
        });
      }

      const result = await OrdenTrabajo.cancelarTecnica(
        parseInt(id),
        motivo
      );

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Error al cancelar OT:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al cancelar orden de trabajo',
        error: error.message
      });
    }
  }

  /**
   * GET /api/ot-tecnicas/operario/:empleadoId
   * Obtener OTs asignadas a un operario específico
   */
  async obtenerPorOperario(req, res) {
    try {
      const { empleadoId } = req.params;
      const { estado } = req.query;

      const ots = await OrdenTrabajo.listarTecnicas({
        empleadoId: parseInt(empleadoId),
        estado,
        limite: 100,
        offset: 0
      });

      res.json({
        success: true,
        data: ots,
        total: ots.length
      });
    } catch (error) {
      console.error('Error al obtener OTs del operario:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener órdenes de trabajo del operario',
        error: error.message
      });
    }
  }

  /**
   * GET /api/ot-tecnicas/mis-ots
   * Obtener OTs del operario autenticado
   */
  async obtenerMisOts(req, res) {
    try {
      const empleado_id = req.usuario?.empleado_id;

      if (!empleado_id) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado o no es operario'
        });
      }

      const { estado } = req.query;

      const ots = await OrdenTrabajo.listarTecnicas({
        empleadoId: parseInt(empleado_id),
        estado,
        limite: 100,
        offset: 0
      });

      res.json({
        success: true,
        data: ots,
        total: ots.length
      });
    } catch (error) {
      console.error('Error al obtener mis OTs:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener tus órdenes de trabajo',
        error: error.message
      });
    }
  }
}

export default new OTTecnicasController();
