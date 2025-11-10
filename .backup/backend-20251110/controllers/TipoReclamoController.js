import TipoReclamo from '../models/TipoReclamo.js';

class TipoReclamoController {
  /**
   * Obtener todos los tipos de reclamo
   */
  async obtenerTodos(req, res) {
    try {
      const tipos = await TipoReclamo.obtenerTodos();
      res.json(tipos);
    } catch (error) {
      console.error('Error en TipoReclamoController.obtenerTodos:', error);
      res.status(500).json({ 
        error: 'Error al obtener tipos de reclamo',
        detalles: error.message 
      });
    }
  }

  /**
   * Obtener un tipo de reclamo por ID
   */
  async obtenerPorId(req, res) {
    try {
      const { id } = req.params;
      const tipo = await TipoReclamo.obtenerPorId(parseInt(id));
      res.json(tipo);
    } catch (error) {
      console.error('Error en TipoReclamoController.obtenerPorId:', error);
      
      if (error.message === 'Tipo de reclamo no encontrado') {
        return res.status(404).json({ error: error.message });
      }
      
      res.status(500).json({ 
        error: 'Error al obtener tipo de reclamo',
        detalles: error.message 
      });
    }
  }
}

export default new TipoReclamoController();
