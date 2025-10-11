/**
 * Respuesta exitosa estándar
 */
export const respuestaExitosa = (res, datos, mensaje = 'Operación exitosa', codigo = 200) => {
  return res.status(codigo).json({
    exito: true,
    mensaje,
    datos
  });
};

/**
 * Respuesta de error estándar
 */
export const respuestaError = (res, mensaje = 'Error en la operación', codigo = 500, detalles = null) => {
  const respuesta = {
    exito: false,
    mensaje
  };

  if (detalles && process.env.NODE_ENV === 'development') {
    respuesta.detalles = detalles;
  }

  return res.status(codigo).json(respuesta);
};

/**
 * Respuesta de validación fallida
 */
export const respuestaValidacion = (res, errores) => {
  return res.status(400).json({
    exito: false,
    mensaje: 'Error de validación',
    errores
  });
};

/**
 * Respuesta no autorizado
 */
export const respuestaNoAutorizado = (res, mensaje = 'No autorizado') => {
  return res.status(401).json({
    exito: false,
    mensaje
  });
};

/**
 * Respuesta prohibido
 */
export const respuestaProhibido = (res, mensaje = 'Acceso prohibido') => {
  return res.status(403).json({
    exito: false,
    mensaje
  });
};

/**
 * Respuesta no encontrado
 */
export const respuestaNoEncontrado = (res, mensaje = 'Recurso no encontrado') => {
  return res.status(404).json({
    exito: false,
    mensaje
  });
};
