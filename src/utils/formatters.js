/**
 * Utilidades para formateo de datos
 */

/**
 * Formatea una fecha en formato dd/mm/aaaa
 * @param {string|Date} fecha - Fecha a formatear
 * @returns {string} Fecha formateada en formato dd/mm/aaaa
 */
export const formatearFecha = (fecha) => {
  if (!fecha) return '';
  try {
    const date = new Date(fecha);
    const dia = date.getDate().toString().padStart(2, '0');
    const mes = (date.getMonth() + 1).toString().padStart(2, '0');
    const anio = date.getFullYear();
    return `${dia}/${mes}/${anio}`;
  } catch {
    return '';
  }
};

/**
 * Formatea una fecha con hora en formato dd/mm/aaaa HH:mm
 * @param {string|Date} fecha - Fecha a formatear
 * @returns {string} Fecha formateada en formato dd/mm/aaaa HH:mm
 */
export const formatearFechaHora = (fecha) => {
  if (!fecha) return '';
  try {
    const date = new Date(fecha);
    const dia = date.getDate().toString().padStart(2, '0');
    const mes = (date.getMonth() + 1).toString().padStart(2, '0');
    const anio = date.getFullYear();
    const horas = date.getHours().toString().padStart(2, '0');
    const minutos = date.getMinutes().toString().padStart(2, '0');
    return `${dia}/${mes}/${anio} ${horas}:${minutos}`;
  } catch {
    return '';
  }
};

/**
 * Formatea un monto en formato de moneda argentina
 * @param {number} monto - Monto a formatear
 * @returns {string} Monto formateado
 */
export const formatearMonto = (monto) => {
  if (monto === null || monto === undefined) return '$0,00';
  return `$${parseFloat(monto).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Obtiene el nombre del mes en español
 * @param {number} mes - Número del mes (0-11)
 * @returns {string} Nombre del mes
 */
export const obtenerNombreMes = (mes) => {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return meses[mes] || '';
};

/**
 * Formatea una fecha en formato "Mes Año"
 * @param {string|Date} fecha - Fecha a formatear
 * @returns {string} Fecha formateada como "Mes Año"
 */
export const formatearMesAnio = (fecha) => {
  if (!fecha) return '';
  try {
    const date = new Date(fecha);
    return `${obtenerNombreMes(date.getMonth())} ${date.getFullYear()}`;
  } catch {
    return '';
  }
};
