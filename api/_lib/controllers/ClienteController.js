import Socio from '../models/Socio.js';
import Factura from '../models/Factura.js';
import Reclamo from '../models/Reclamo.js';
import { respuestaExitosa, respuestaError, respuestaNoEncontrado, respuestaProhibido } from '../utils/respuestas.js';

class ClienteController {
  /**
   * GET /api/clientes/perfil
   * Obtener perfil del socio
   */
  static async obtenerPerfil(req, res) {
    try {
      const socioId = req.usuario.socio_id;

      if (!socioId) {
        return respuestaProhibido(res, 'Usuario no es un socio');
      }

      const perfil = await Socio.obtenerPerfil(socioId);

      if (!perfil) {
        return respuestaNoEncontrado(res, 'Perfil no encontrado');
      }

      // Incluir las cuentas del socio en el perfil
      const cuentas = await Socio.obtenerCuentas(socioId);
      perfil.cuentas = cuentas || [];

      return respuestaExitosa(res, perfil, 'Perfil obtenido exitosamente');
    } catch (error) {
      console.error('Error al obtener perfil:', error);
      return respuestaError(res, 'Error al obtener perfil', 500, error.message);
    }
  }

  /**
   * GET /api/clientes/cuentas
   * Obtener cuentas del socio
   */
  static async obtenerCuentas(req, res) {
    try {
      const socioId = req.usuario.socio_id;

      if (!socioId) {
        return respuestaProhibido(res, 'Usuario no es un socio');
      }

      const cuentas = await Socio.obtenerCuentas(socioId);

      return respuestaExitosa(res, cuentas, 'Cuentas obtenidas exitosamente');
    } catch (error) {
      console.error('Error al obtener cuentas:', error);
      return respuestaError(res, 'Error al obtener cuentas', 500, error.message);
    }
  }

  /**
   * GET /api/clientes/facturas
   * Obtener facturas del socio
   */
  static async obtenerFacturas(req, res) {
    try {
      const socioId = req.usuario.socio_id;

      if (!socioId) {
        return respuestaProhibido(res, 'Usuario no es un socio');
      }

      const { estado, limite = 10, offset = 0, cuenta_id } = req.query;

      const facturas = await Factura.obtenerPorSocio(socioId, {
        estado,
        limite: parseInt(limite),
        offset: parseInt(offset),
        cuenta_id: cuenta_id ? parseInt(cuenta_id) : null
      });

      return respuestaExitosa(res, facturas, 'Facturas obtenidas exitosamente');
    } catch (error) {
      console.error('Error al obtener facturas:', error);
      return respuestaError(res, 'Error al obtener facturas', 500, error.message);
    }
  }

  /**
   * GET /api/clientes/facturas/:id
   * Obtener detalle de una factura
   */
  static async obtenerFactura(req, res) {
    try {
      const { id } = req.params;
      const socioId = req.usuario.socio_id;

      const factura = await Factura.obtenerPorId(id);

      if (!factura) {
        return respuestaNoEncontrado(res, 'Factura no encontrada');
      }

      // Verificar que la factura pertenezca al socio
      // (En el modelo ya se hace el JOIN con cuenta/socio)
      
      return respuestaExitosa(res, factura, 'Factura obtenida exitosamente');
    } catch (error) {
      console.error('Error al obtener factura:', error);
      return respuestaError(res, 'Error al obtener factura', 500, error.message);
    }
  }

  /**
   * GET /api/clientes/reclamos
   * Obtener reclamos del socio
   */
  static async obtenerReclamos(req, res) {
    try {
      const socioId = req.usuario.socio_id;

      if (!socioId) {
        return respuestaProhibido(res, 'Usuario no es un socio');
      }

      const { estado, limite = 20, offset = 0, cuenta_id } = req.query;

      const reclamos = await Reclamo.obtenerPorSocio(socioId, {
        estado,
        limite: parseInt(limite),
        offset: parseInt(offset),
        cuenta_id: cuenta_id ? parseInt(cuenta_id) : null
      });

      return respuestaExitosa(res, reclamos, 'Reclamos obtenidos exitosamente');
    } catch (error) {
      console.error('Error al obtener reclamos:', error);
      return respuestaError(res, 'Error al obtener reclamos', 500, error.message);
    }
  }

  /**
   * GET /api/clientes/reclamos/:id
   * Obtener detalle de un reclamo
   */
  static async obtenerReclamo(req, res) {
    try {
      const { id } = req.params;

      const reclamo = await Reclamo.obtenerPorId(id);

      if (!reclamo) {
        return respuestaNoEncontrado(res, 'Reclamo no encontrado');
      }

      return respuestaExitosa(res, reclamo, 'Reclamo obtenido exitosamente');
    } catch (error) {
      console.error('Error al obtener reclamo:', error);
      return respuestaError(res, 'Error al obtener reclamo', 500, error.message);
    }
  }

  /**
   * POST /api/clientes/reclamos
   * Crear nuevo reclamo
   */
  static async crearReclamo(req, res) {
    try {
      const socioId = req.usuario.socio_id;
      const { cuenta_id, detalle_id, descripcion, prioridad_id = 2 } = req.body;

      // Validar campos requeridos
      if (!cuenta_id || !detalle_id || !descripcion) {
        return respuestaError(res, 'Faltan campos requeridos', 400);
      }

      // Verificar que la cuenta pertenezca al socio
      const cuentas = await Socio.obtenerCuentas(socioId);
      const cuentaValida = cuentas.find(c => c.cuenta_id === parseInt(cuenta_id));

      if (!cuentaValida) {
        return respuestaProhibido(res, 'La cuenta no pertenece al socio');
      }

      // Crear reclamo
      const reclamo = await Reclamo.crear({
        cuentaId: cuenta_id,
        detalleId: detalle_id,
        descripcion,
        prioridadId: prioridad_id,
        canal: 'WEB'
      });

      return respuestaExitosa(res, reclamo, 'Reclamo creado exitosamente', 201);
    } catch (error) {
      console.error('Error al crear reclamo:', error);
      return respuestaError(res, 'Error al crear reclamo', 500, error.message);
    }
  }

  /**
   * POST /api/clientes/facturas/:id/pagar
   * Registrar pago de una factura
   */
  static async pagarFactura(req, res) {
    try {
      const { id } = req.params;
      const socioId = req.usuario.socio_id;

      if (!socioId) {
        return respuestaProhibido(res, 'Usuario no es un socio');
      }

      // Verificar que la factura existe y pertenece al socio
      const factura = await Factura.obtenerPorId(id);

      if (!factura) {
        return respuestaNoEncontrado(res, 'Factura no encontrada');
      }

      // Verificar que la factura no esté ya pagada
      if (factura.estado === 'PAGADA' || factura.estado === 'pagada') {
        return respuestaError(res, 'La factura ya está pagada', 400);
      }

      const { 
        monto_pagado, 
        metodo_pago = 'TARJETA', 
        comprobante = null 
      } = req.body;

      // Validar monto
      if (!monto_pagado || parseFloat(monto_pagado) <= 0) {
        return respuestaError(res, 'Monto de pago inválido', 400);
      }

      // Registrar el pago
      const resultado = await Factura.registrarPago(id, {
        montoPagado: parseFloat(monto_pagado),
        metodoPago: metodo_pago,
        comprobante: comprobante
      });

      return respuestaExitosa(res, resultado, 'Pago registrado exitosamente');
    } catch (error) {
      console.error('Error al registrar pago:', error);
      return respuestaError(res, 'Error al registrar pago', 500, error.message);
    }
  }

  /**
   * GET /api/clientes/dashboard
   * Obtener dashboard con resumen
   */
  static async obtenerDashboard(req, res) {
    try {
      const socioId = req.usuario.socio_id;

      if (!socioId) {
        return respuestaProhibido(res, 'Usuario no es un socio');
      }

      const [cuentas, resumenFacturas, resumenReclamos] = await Promise.all([
        Socio.obtenerCuentas(socioId),
        Factura.obtenerResumen(socioId),
        Reclamo.obtenerResumen(socioId)
      ]);

      const dashboard = {
        cuentas: {
          total: cuentas.length,
          activas: cuentas.filter(c => c.activa).length
        },
        facturas: {
          pendientes: parseInt(resumenFacturas.pendientes) || 0,
          pagadas: parseInt(resumenFacturas.pagadas) || 0,
          vencidas: parseInt(resumenFacturas.vencidas) || 0,
          monto_pendiente: parseFloat(resumenFacturas.monto_pendiente) || 0,
          monto_pagado: parseFloat(resumenFacturas.monto_pagado) || 0
        },
        reclamos: {
          pendientes: parseInt(resumenReclamos.pendientes) || 0,
          en_proceso: parseInt(resumenReclamos.en_proceso) || 0,
          resueltos: parseInt(resumenReclamos.resueltos) || 0,
          cerrados: parseInt(resumenReclamos.cerrados) || 0
        }
      };

      return respuestaExitosa(res, dashboard, 'Dashboard obtenido exitosamente');
    } catch (error) {
      console.error('Error al obtener dashboard:', error);
      return respuestaError(res, 'Error al obtener dashboard', 500, error.message);
    }
  }
}

export default ClienteController;
