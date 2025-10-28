import express from 'express';
import {
  crearValoracion,
  obtenerValoracionPorReclamo,
  obtenerMisValoraciones,
  actualizarValoracion,
  eliminarValoracion,
  obtenerEstadisticas,
  obtenerValoracionesRecientes
} from '../controllers/valoracionController.js';
import { verificarToken } from '../middleware/auth.js';
import { verificarRol } from '../middleware/roles.js';

const router = express.Router();

// Rutas públicas (requieren autenticación)
router.post('/', verificarToken, crearValoracion);
router.get('/reclamo/:reclamoId', verificarToken, obtenerValoracionPorReclamo);
router.get('/mis-valoraciones', verificarToken, obtenerMisValoraciones);
router.put('/:valoracionId', verificarToken, actualizarValoracion);
router.delete('/:valoracionId', verificarToken, eliminarValoracion);

// Rutas admin (requieren rol ADMIN o EMPLEADO)
router.get('/estadisticas', verificarToken, verificarRol(['ADMIN', 'EMPLEADO']), obtenerEstadisticas);
router.get('/recientes', verificarToken, verificarRol(['ADMIN', 'EMPLEADO']), obtenerValoracionesRecientes);

export default router;
