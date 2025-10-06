/**
 * Rutas de Administradores
 * Endpoints para administradores del sistema
 */

import express from 'express';
import AdministradorController from '../controllers/AdministradorController.js';
import { autenticar, esAdmin } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación y rol de administrador
router.use(autenticar);
router.use(esAdmin);

// Perfil del administrador
router.get('/perfil', AdministradorController.obtenerPerfil);

// Dashboard con estadísticas generales
router.get('/dashboard', AdministradorController.obtenerDashboard);

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

export default router;
