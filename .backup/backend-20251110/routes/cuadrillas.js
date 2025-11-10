import express from 'express';
import CuadrillasController from '../controllers/CuadrillasController.js';
import { autenticar } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(autenticar);

// GET /api/cuadrillas - Listar cuadrillas activas
router.get('/', CuadrillasController.listar);

// GET /api/cuadrillas/operarios/disponibles - Operarios disponibles
router.get('/operarios/disponibles', CuadrillasController.obtenerOperariosDisponibles);

// GET /api/cuadrillas/operario/:empleadoId/cuadrilla - Cuadrilla de operario
router.get('/operario/:empleadoId/cuadrilla', CuadrillasController.obtenerCuadrillaDeOperario);

// GET /api/cuadrillas/:id - Detalle de cuadrilla
router.get('/:id', CuadrillasController.obtenerDetalle);

// GET /api/cuadrillas/:id/operarios - Operarios de cuadrilla
router.get('/:id/operarios', CuadrillasController.obtenerOperarios);

// GET /api/cuadrillas/:id/estadisticas - Estadísticas de cuadrilla
router.get('/:id/estadisticas', CuadrillasController.obtenerEstadisticas);

export default router;
