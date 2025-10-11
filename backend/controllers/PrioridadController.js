import Prioridad from '../models/Prioridad.js';

class PrioridadController {
  /**
   * Obtener todas las prioridades
   */
  async obtenerTodas(req, res) {
    try {
      const prioridades = await Prioridad.obtenerTodas();
      res.json(prioridades);
    } catch (error) {
      console.error('Error en PrioridadController.obtenerTodas:', error);
      res.status(500).json({ 
        error: 'Error al obtener prioridades',
        detalles: error.message 
      });
    }
  }

  /**
   * Obtener una prioridad por ID
   */
  async obtenerPorId(req, res) {
    try {
      const { id } = req.params;
      const prioridad = await Prioridad.obtenerPorId(parseInt(id));
      res.json(prioridad);
    } catch (error) {
      console.error('Error en PrioridadController.obtenerPorId:', error);
      
      if (error.message === 'Prioridad no encontrada') {
        return res.status(404).json({ error: error.message });
      }
      
      res.status(500).json({ 
        error: 'Error al obtener prioridad',
        detalles: error.message 
      });
    }
  }

  /**
   * Obtener prioridad por nombre
   */
  async obtenerPorNombre(req, res) {
    try {
      const { nombre } = req.params;
      const prioridad = await Prioridad.obtenerPorNombre(nombre);
      res.json(prioridad);
    } catch (error) {
      console.error('Error en PrioridadController.obtenerPorNombre:', error);
      
      if (error.message === 'Prioridad no encontrada') {
        return res.status(404).json({ error: error.message });
      }
      
      res.status(500).json({ 
        error: 'Error al obtener prioridad',
        detalles: error.message 
      });
    }
  }
}

export default new PrioridadController();
