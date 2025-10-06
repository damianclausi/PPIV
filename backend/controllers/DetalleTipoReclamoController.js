import DetalleTipoReclamo from '../models/DetalleTipoReclamo.js';

class DetalleTipoReclamoController {
  /**
   * Obtener todos los detalles de tipos de reclamo
   */
  static async obtenerTodos(req, res) {
    try {
      const detalles = await DetalleTipoReclamo.obtenerTodos();
      res.json(detalles);
    } catch (error) {
      console.error('Error en controller al obtener detalles:', error);
      res.status(500).json({ 
        mensaje: 'Error al obtener detalles de tipos de reclamo',
        error: error.message 
      });
    }
  }

  /**
   * Obtener detalles por tipo de reclamo
   */
  static async obtenerPorTipo(req, res) {
    try {
      const { tipoId } = req.params;
      const detalles = await DetalleTipoReclamo.obtenerPorTipo(parseInt(tipoId));
      res.json(detalles);
    } catch (error) {
      console.error('Error en controller al obtener detalles por tipo:', error);
      res.status(500).json({ 
        mensaje: 'Error al obtener detalles por tipo',
        error: error.message 
      });
    }
  }

  /**
   * Obtener un detalle específico por ID
   */
  static async obtenerPorId(req, res) {
    try {
      const { detalleId } = req.params;
      const detalle = await DetalleTipoReclamo.obtenerPorId(parseInt(detalleId));
      
      if (!detalle) {
        return res.status(404).json({ mensaje: 'Detalle no encontrado' });
      }
      
      res.json(detalle);
    } catch (error) {
      console.error('Error en controller al obtener detalle:', error);
      res.status(500).json({ 
        mensaje: 'Error al obtener detalle',
        error: error.message 
      });
    }
  }
}

export default DetalleTipoReclamoController;
