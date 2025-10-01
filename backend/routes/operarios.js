/**
 * Rutas de Operarios
 * Endpoints para operarios técnicos
 */

import express from 'express';
import OperarioController from '../controllers/OperarioController.js';
import { autenticar, esOperario } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación y rol de operario
router.use(autenticar);
router.use(esOperario);

// Perfil del operario
router.get('/perfil', OperarioController.obtenerPerfil);

// Dashboard con estadísticas
router.get('/dashboard', OperarioController.obtenerDashboard);

// Reclamos asignados
router.get('/reclamos', OperarioController.obtenerReclamos);
router.get('/reclamos/:id', OperarioController.obtenerReclamo);
router.patch('/reclamos/:id/estado', OperarioController.actualizarEstadoReclamo);

export default router;
