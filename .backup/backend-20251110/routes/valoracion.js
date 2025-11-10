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
import { autenticar, requiereRol } from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas (requieren autenticación)
router.post('/', autenticar, crearValoracion);
router.get('/reclamo/:reclamoId', autenticar, obtenerValoracionPorReclamo);
router.get('/mis-valoraciones', autenticar, obtenerMisValoraciones);
router.put('/:valoracionId', autenticar, actualizarValoracion);
router.delete('/:valoracionId', autenticar, eliminarValoracion);

// Rutas admin (requieren rol ADMIN o EMPLEADO)
router.get('/estadisticas', autenticar, requiereRol('ADMIN', 'EMPLEADO'), obtenerEstadisticas);
router.get('/recientes', autenticar, requiereRol('ADMIN', 'EMPLEADO'), obtenerValoracionesRecientes);

export default router;
