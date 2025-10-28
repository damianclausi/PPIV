import Valoracion from '../models/Valoracion.js';

/**
 * Crear nueva valoración
 */
export const crearValoracion = async (req, res) => {
  try {
    const { reclamoId, calificacion, comentario } = req.body;
    const socioId = req.usuario.socio_id; // Viene del middleware de autenticación

    // Validaciones básicas
    if (!reclamoId || !calificacion) {
      return res.status(400).json({
        success: false,
        message: 'Reclamo ID y calificación son requeridos'
      });
    }

    if (calificacion < 1 || calificacion > 5) {
      return res.status(400).json({
        success: false,
        message: 'La calificación debe estar entre 1 y 5'
      });
    }

    const valoracion = await Valoracion.crear({
      reclamoId,
      socioId,
      calificacion,
      comentario: comentario || null
    });

    res.status(201).json({
      success: true,
      message: 'Valoración creada exitosamente',
      data: valoracion
    });

  } catch (error) {
    console.error('Error al crear valoración:', error);
    
    // Errores específicos del modelo
    if (error.message === 'Reclamo no encontrado') {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message === 'Solo se pueden valorar reclamos resueltos o cerrados') {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.message === 'No tienes permiso para valorar este reclamo') {
      return res.status(403).json({ success: false, message: error.message });
    }
    if (error.message === 'Ya has valorado este reclamo') {
      return res.status(409).json({ success: false, message: error.message });
    }

    res.status(500).json({
      success: false,
      message: 'Error al crear valoración',
      error: error.message
    });
  }
};

/**
 * Obtener valoración de un reclamo específico
 */
export const obtenerValoracionPorReclamo = async (req, res) => {
  try {
    const { reclamoId } = req.params;

    const valoracion = await Valoracion.obtenerPorReclamo(reclamoId);

    if (!valoracion) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró valoración para este reclamo'
      });
    }

    res.status(200).json({
      success: true,
      data: valoracion
    });

  } catch (error) {
    console.error('Error al obtener valoración:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener valoración',
      error: error.message
    });
  }
};

/**
 * Obtener todas las valoraciones del socio autenticado
 */
export const obtenerMisValoraciones = async (req, res) => {
  try {
    const socioId = req.usuario.socio_id;

    const valoraciones = await Valoracion.obtenerPorSocio(socioId);

    res.status(200).json({
      success: true,
      data: valoraciones
    });

  } catch (error) {
    console.error('Error al obtener valoraciones del socio:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener valoraciones',
      error: error.message
    });
  }
};

/**
 * Actualizar valoración existente
 */
export const actualizarValoracion = async (req, res) => {
  try {
    const { valoracionId } = req.params;
    const { calificacion, comentario } = req.body;
    const socioId = req.usuario.socio_id;

    // Validaciones básicas
    if (!calificacion) {
      return res.status(400).json({
        success: false,
        message: 'Calificación es requerida'
      });
    }

    if (calificacion < 1 || calificacion > 5) {
      return res.status(400).json({
        success: false,
        message: 'La calificación debe estar entre 1 y 5'
      });
    }

    const valoracion = await Valoracion.actualizar(
      valoracionId,
      socioId,
      { calificacion, comentario: comentario || null }
    );

    res.status(200).json({
      success: true,
      message: 'Valoración actualizada exitosamente',
      data: valoracion
    });

  } catch (error) {
    console.error('Error al actualizar valoración:', error);
    
    if (error.message === 'Valoración no encontrada') {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message === 'No tienes permiso para modificar esta valoración') {
      return res.status(403).json({ success: false, message: error.message });
    }

    res.status(500).json({
      success: false,
      message: 'Error al actualizar valoración',
      error: error.message
    });
  }
};

/**
 * Eliminar valoración
 */
export const eliminarValoracion = async (req, res) => {
  try {
    const { valoracionId } = req.params;
    const socioId = req.usuario.socio_id;

    await Valoracion.eliminar(valoracionId, socioId);

    res.status(200).json({
      success: true,
      message: 'Valoración eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar valoración:', error);
    
    if (error.message === 'Valoración no encontrada') {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message === 'No tienes permiso para eliminar esta valoración') {
      return res.status(403).json({ success: false, message: error.message });
    }

    res.status(500).json({
      success: false,
      message: 'Error al eliminar valoración',
      error: error.message
    });
  }
};

/**
 * Obtener estadísticas generales de valoraciones (solo admin)
 */
export const obtenerEstadisticas = async (req, res) => {
  try {
    const estadisticas = await Valoracion.obtenerEstadisticas();

    res.status(200).json({
      success: true,
      data: estadisticas
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};

/**
 * Obtener valoraciones recientes (solo admin)
 */
export const obtenerValoracionesRecientes = async (req, res) => {
  try {
    const limite = parseInt(req.query.limite) || 10;

    const valoraciones = await Valoracion.obtenerRecientes(limite);

    res.status(200).json({
      success: true,
      data: valoraciones
    });

  } catch (error) {
    console.error('Error al obtener valoraciones recientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener valoraciones recientes',
      error: error.message
    });
  }
};
