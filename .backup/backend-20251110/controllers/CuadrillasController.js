import Cuadrilla from '../models/Cuadrilla.js';

class CuadrillasController {
  /**
   * GET /api/cuadrillas
   * Listar todas las cuadrillas activas
   */
  async listar(req, res) {
    try {
      const cuadrillas = await Cuadrilla.obtenerCuadrillasActivas();

      res.json({
        success: true,
        data: cuadrillas,
        total: cuadrillas.length
      });
    } catch (error) {
      console.error('Error al listar cuadrillas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al listar cuadrillas',
        error: error.message
      });
    }
  }

  /**
   * GET /api/cuadrillas/:id
   * Obtener detalle de una cuadrilla
   */
  async obtenerDetalle(req, res) {
    try {
      const { id } = req.params;
      const cuadrilla = await Cuadrilla.obtenerPorId(parseInt(id));

      if (!cuadrilla) {
        return res.status(404).json({
          success: false,
          message: 'Cuadrilla no encontrada'
        });
      }

      res.json({
        success: true,
        data: cuadrilla
      });
    } catch (error) {
      console.error('Error al obtener cuadrilla:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener cuadrilla',
        error: error.message
      });
    }
  }

  /**
   * GET /api/cuadrillas/:id/operarios
   * Obtener operarios de una cuadrilla
   */
  async obtenerOperarios(req, res) {
    try {
      const { id } = req.params;
      const operarios = await Cuadrilla.obtenerOperariosDeCuadrilla(parseInt(id));

      res.json({
        success: true,
        data: operarios,
        total: operarios.length
      });
    } catch (error) {
      console.error('Error al obtener operarios:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener operarios de la cuadrilla',
        error: error.message
      });
    }
  }

  /**
   * GET /api/cuadrillas/:id/estadisticas
   * Obtener estadísticas de una cuadrilla
   */
  async obtenerEstadisticas(req, res) {
    try {
      const { id } = req.params;
      const stats = await Cuadrilla.obtenerEstadisticas(parseInt(id));

      if (!stats) {
        return res.status(404).json({
          success: false,
          message: 'Cuadrilla no encontrada'
        });
      }

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas de la cuadrilla',
        error: error.message
      });
    }
  }

  /**
   * GET /api/cuadrillas/operarios/disponibles
   * Obtener todos los operarios técnicos disponibles
   */
  async obtenerOperariosDisponibles(req, res) {
    try {
      const operarios = await Cuadrilla.obtenerOperariosDisponibles();

      res.json({
        success: true,
        data: operarios,
        total: operarios.length
      });
    } catch (error) {
      console.error('Error al obtener operarios disponibles:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener operarios disponibles',
        error: error.message
      });
    }
  }

  /**
   * GET /api/cuadrillas/operario/:empleadoId/cuadrilla
   * Obtener cuadrilla activa de un operario
   */
  async obtenerCuadrillaDeOperario(req, res) {
    try {
      const { empleadoId } = req.params;
      const cuadrilla = await Cuadrilla.obtenerCuadrillaPorOperario(parseInt(empleadoId));

      if (!cuadrilla) {
        return res.status(404).json({
          success: false,
          message: 'El operario no tiene cuadrilla asignada'
        });
      }

      res.json({
        success: true,
        data: cuadrilla
      });
    } catch (error) {
      console.error('Error al obtener cuadrilla del operario:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener cuadrilla del operario',
        error: error.message
      });
    }
  }
}

export default new CuadrillasController();
