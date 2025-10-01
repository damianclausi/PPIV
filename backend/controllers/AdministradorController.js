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
      const { activo, pagina = 1, limite = 10, buscar } = req.query;
      
      const resultado = await Socio.listar({
        activo: activo !== undefined ? activo === 'true' : null,
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        buscar
      });
      
      return respuestaExitosa(res, resultado, 'Socios obtenidos exitosamente');
    } catch (error) {
      console.error('Error al listar socios:', error);
      return respuestaError(res, 'Error al listar socios');
    }
  }

  /**
   * Obtener perfil de un socio específico
   */
  static async obtenerSocio(req, res) {
    try {
      const { id } = req.params;
      
      const socio = await Socio.obtenerPerfil(id);
      
      if (!socio) {
        return respuestaNoEncontrado(res, 'Socio no encontrado');
      }
      
      return respuestaExitosa(res, socio, 'Socio obtenido exitosamente');
    } catch (error) {
      console.error('Error al obtener socio:', error);
      return respuestaError(res, 'Error al obtener socio');
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
   * Listar todos los reclamos del sistema
   */
  static async listarReclamos(req, res) {
    try {
      const { estado, pagina = 1, limite = 10 } = req.query;
      
      const resultado = await Reclamo.listarTodos({
        estado,
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
