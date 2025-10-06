/**
 * Controlador de Administradores
 * Maneja la lógica de negocio para administradores del sistema
 */

import Empleado from '../models/Empleado.js';
import Socio from '../models/Socio.js';
import Reclamo from '../models/Reclamo.js';
import Factura from '../models/Factura.js';
import { respuestaExitosa, respuestaError, respuestaNoEncontrado } from '../utils/respuestas.js';

export default class AdministradorController {
  /**
   * Obtener perfil del administrador autenticado
   */
  static async obtenerPerfil(req, res) {
    try {
      const empleadoId = req.usuario.empleado_id;
      
      const perfil = await Empleado.obtenerPerfil(empleadoId);
      
      if (!perfil) {
        return respuestaNoEncontrado(res, 'Perfil de administrador no encontrado');
      }
      
      return respuestaExitosa(res, perfil, 'Perfil de administrador obtenido exitosamente');
    } catch (error) {
      console.error('Error al obtener perfil de administrador:', error);
      return respuestaError(res, 'Error al obtener perfil de administrador');
    }
  }

  /**
   * Obtener dashboard con estadísticas generales del sistema
   */
  static async obtenerDashboard(req, res) {
    try {
      // Obtener resumen general de reclamos
      const resumenReclamos = await Reclamo.obtenerResumenGeneral();
      
      // Obtener estadísticas de socios
      const estadisticasSocios = await Socio.obtenerEstadisticas();
      
      // Obtener estadísticas de facturación
      const estadisticasFacturacion = await Factura.obtenerEstadisticas();
      
      const dashboard = {
        socios: estadisticasSocios,
        reclamos: resumenReclamos,
        facturacion: estadisticasFacturacion,
        fecha_consulta: new Date()
      };
      
      return respuestaExitosa(res, dashboard, 'Dashboard de administrador obtenido exitosamente');
    } catch (error) {
      console.error('Error al obtener dashboard de administrador:', error);
      return respuestaError(res, 'Error al obtener dashboard de administrador');
    }
  }

  /**
   * Listar todos los socios con filtros
   */
  static async listarSocios(req, res) {
    try {
  const { activo, pagina = 1, limite = 10, busqueda, orden = 'socio_id', direccion = 'ASC' } = req.query;
      
      const paginaNum = parseInt(pagina);
      const limiteNum = parseInt(limite);
      const offset = (paginaNum - 1) * limiteNum;
      
      const resultado = await Socio.listar({
        activo: activo !== undefined ? activo === 'true' : null,
        offset,
        limite: limiteNum,
        busqueda,
        orden,
        direccion
      });
      
      return respuestaExitosa(res, resultado, 'Socios obtenidos exitosamente');
    } catch (error) {
      console.error('Error al listar socios:', error);
      return respuestaError(res, 'Error al listar socios');
    }
  }

  /**
   * Obtener perfil de un socio específico con sus cuentas
   */
  static async obtenerSocio(req, res) {
    try {
      const { id } = req.params;
      
      const socio = await Socio.obtenerPerfil(id);
      
      if (!socio) {
        return respuestaNoEncontrado(res, 'Socio no encontrado');
      }
      
      // Obtener también las cuentas del socio
      const cuentas = await Socio.obtenerCuentas(id);
      
      // Combinar datos
      const socioCompleto = {
        ...socio,
        cuentas: cuentas || []
      };
      
      return respuestaExitosa(res, socioCompleto, 'Socio obtenido exitosamente');
    } catch (error) {
      console.error('Error al obtener socio:', error);
      return respuestaError(res, 'Error al obtener socio');
    }
  }

  /**
   * Crear un nuevo socio
   */
  static async crearSocio(req, res) {
    try {
      const datosSocio = req.body;
      
      // Validaciones básicas
      if (!datosSocio.nombre || !datosSocio.apellido || !datosSocio.dni || !datosSocio.email) {
        return respuestaError(res, 'Faltan datos obligatorios: nombre, apellido, DNI, email', 400);
      }
      
      const nuevoSocio = await Socio.crear(datosSocio);
      
      return respuestaExitosa(res, nuevoSocio, 'Socio creado exitosamente', 201);
    } catch (error) {
      console.error('Error al crear socio:', error);
      
      // Manejo de errores específicos
      if (error.code === '23505') { // Código de PostgreSQL para violación de unique constraint
        return respuestaError(res, 'Ya existe un socio con ese DNI o email', 409);
      }
      
      return respuestaError(res, 'Error al crear socio');
    }
  }

  /**
   * Actualizar datos de un socio
   */
  static async actualizarSocio(req, res) {
    try {
      const { id } = req.params;
      const datosSocio = req.body;
      
      const socio = await Socio.actualizar(id, datosSocio);
      
      if (!socio) {
        return respuestaNoEncontrado(res, 'Socio no encontrado');
      }
      
      return respuestaExitosa(res, socio, 'Socio actualizado exitosamente');
    } catch (error) {
      console.error('Error al actualizar socio:', error);
      return respuestaError(res, 'Error al actualizar socio');
    }
  }

  /**
   * Cambiar estado de un socio (activar/desactivar)
   */
  static async cambiarEstadoSocio(req, res) {
    try {
      const { id } = req.params;
      const { activo } = req.body;
      
      if (activo === undefined) {
        return respuestaError(res, 'El campo activo es requerido', 400);
      }
      
      const socioActualizado = await Socio.cambiarEstado(id, activo);
      
      if (!socioActualizado) {
        return respuestaNoEncontrado(res, 'Socio no encontrado');
      }
      
      const mensaje = activo ? 'Socio activado exitosamente' : 'Socio desactivado exitosamente';
      return respuestaExitosa(res, socioActualizado, mensaje);
    } catch (error) {
      console.error('Error al cambiar estado del socio:', error);
      return respuestaError(res, 'Error al cambiar estado del socio');
    }
  }

  /**
   * Eliminar un socio (DELETE físico)
   */
  static async eliminarSocio(req, res) {
    try {
      const { id } = req.params;
      
      const eliminado = await Socio.eliminar(id);
      
      if (!eliminado) {
        return respuestaNoEncontrado(res, 'Socio no encontrado');
      }
      
      return respuestaExitosa(res, { id }, 'Socio eliminado exitosamente');
    } catch (error) {
      console.error('Error al eliminar socio:', error);
      
      // Manejo de errores específicos
      if (error.code === '23503') { // Código de PostgreSQL para violación de foreign key
        return respuestaError(res, 'No se puede eliminar el socio porque tiene cuentas o reclamos asociados', 409);
      }
      
      return respuestaError(res, 'Error al eliminar socio');
    }
  }

  /**
   * Listar todos los reclamos del sistema
   */
  static async listarReclamos(req, res) {
    try {
  const { estado, tipo, pagina = 1, limite = 10 } = req.query;
      
      const resultado = await Reclamo.listarTodos({
        estado,
        tipo,
        pagina: parseInt(pagina),
        limite: parseInt(limite)
      });
      
      return respuestaExitosa(res, resultado, 'Reclamos obtenidos exitosamente');
    } catch (error) {
      console.error('Error al listar reclamos:', error);
      return respuestaError(res, 'Error al listar reclamos');
    }
  }

  /**
   * Obtener un reclamo específico
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
      return respuestaError(res, 'Error al obtener reclamo');
    }
  }

  /**
   * Asignar operario a un reclamo
   */
  static async asignarOperarioReclamo(req, res) {
    try {
      const { id } = req.params;
      const { operario_id } = req.body;
      
      if (!operario_id) {
        return respuestaError(res, 'El ID del operario es requerido', 400);
      }
      
      const reclamo = await Reclamo.asignarOperario(id, operario_id);
      
      if (!reclamo) {
        return respuestaNoEncontrado(res, 'Reclamo no encontrado');
      }
      
      return respuestaExitosa(res, reclamo, 'Operario asignado exitosamente');
    } catch (error) {
      console.error('Error al asignar operario:', error);
      return respuestaError(res, 'Error al asignar operario');
    }
  }

  /**
   * Listar todos los empleados
   */
  static async listarEmpleados(req, res) {
    try {
      const { activo, pagina = 1, limite = 10 } = req.query;
      
      const resultado = await Empleado.listar({
        activo: activo !== undefined ? activo === 'true' : null,
        pagina: parseInt(pagina),
        limite: parseInt(limite)
      });
      
      return respuestaExitosa(res, resultado, 'Empleados obtenidos exitosamente');
    } catch (error) {
      console.error('Error al listar empleados:', error);
      return respuestaError(res, 'Error al listar empleados');
    }
  }
}
