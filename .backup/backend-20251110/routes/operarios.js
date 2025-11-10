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

// Materiales - Listar materiales disponibles
router.get('/materiales', OperarioController.listarMateriales);

// Materiales - Registrar uso de materiales en OT
router.post('/ot/:otId/materiales', OperarioController.registrarMateriales);

// Materiales - Obtener materiales usados en una OT
router.get('/ot/:otId/materiales', OperarioController.obtenerMaterialesOT);

// Materiales - Obtener materiales usados en un reclamo
router.get('/reclamos/:id/materiales', OperarioController.obtenerMaterialesReclamo);

// Materiales - Eliminar registro de uso de material
router.delete('/materiales/:id', OperarioController.eliminarUsoMaterial);

export default router;
