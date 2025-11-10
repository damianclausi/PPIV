/**
 * Rutas de Administradores
 * Endpoints para administradores del sistema
 */

import express from 'express';
import AdministradorController from '../controllers/AdministradorController.js';
import OTAdministrativasController from '../controllers/OTAdministrativasController.js';
import { autenticar, esAdmin } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación y rol de administrador
router.use(autenticar);
router.use(esAdmin);

// Perfil del administrador
router.get('/perfil', AdministradorController.obtenerPerfil);

// Dashboard con estadísticas generales
router.get('/dashboard', AdministradorController.obtenerDashboard);

// Métricas avanzadas para reportes
router.get('/metricas-avanzadas', AdministradorController.obtenerMetricasAvanzadas);

// Estado de operarios con OTs
router.get('/operarios-estado', AdministradorController.obtenerEstadoOperarios);

// Gestión de socios
router.get('/socios', AdministradorController.listarSocios);
router.post('/socios', AdministradorController.crearSocio);
router.get('/socios/:id', AdministradorController.obtenerSocio);
router.put('/socios/:id', AdministradorController.actualizarSocio);
router.patch('/socios/:id/estado', AdministradorController.cambiarEstadoSocio);
router.delete('/socios/:id', AdministradorController.eliminarSocio);

// Gestión de reclamos
router.get('/reclamos', AdministradorController.listarReclamos);
router.get('/reclamos/:id', AdministradorController.obtenerReclamo);
router.patch('/reclamos/:id/asignar', AdministradorController.asignarOperarioReclamo);

// Gestión de empleados
router.get('/empleados', AdministradorController.listarEmpleados);

// Historial de cuentas
router.get('/cuentas/:id/facturas', AdministradorController.obtenerFacturasCuenta);
router.get('/cuentas/:id/reclamos', AdministradorController.obtenerReclamosCuenta);

// Gestión de cuentas
router.get('/cuentas', AdministradorController.listarCuentas);
router.post('/cuentas', AdministradorController.crearCuenta);
router.put('/cuentas/:id', AdministradorController.actualizarCuenta);

// Gestión de servicios
router.get('/servicios', AdministradorController.listarServicios);

// Gestión de OTs Administrativas (sin empleado asignado)
router.get('/ots/administrativas/resumen', OTAdministrativasController.obtenerResumen);
router.get('/ots/administrativas', OTAdministrativasController.listar);
router.get('/ots/administrativas/:id', OTAdministrativasController.obtenerDetalle);
router.patch('/ots/administrativas/:id/en-proceso', OTAdministrativasController.marcarEnProceso);
router.patch('/ots/administrativas/:id/cerrar', OTAdministrativasController.cerrar);

export default router;
