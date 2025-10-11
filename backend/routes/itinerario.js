import express from 'express';
import ItinerarioController from '../controllers/ItinerarioController.js';
import { autenticar } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(autenticar);

// POST /api/itinerario/asignar-cuadrilla - Asignar OT a cuadrilla (admin)
router.post('/asignar-cuadrilla', ItinerarioController.asignarOTaCuadrilla);

// GET /api/itinerario/cuadrilla/:cuadrillaId - Obtener itinerario de cuadrilla (admin)
router.get('/cuadrilla/:cuadrillaId', ItinerarioController.obtenerItinerarioCuadrilla);

// GET /api/itinerario/mi-itinerario - Obtener mi itinerario (operario)
router.get('/mi-itinerario', ItinerarioController.obtenerMiItinerario);

// PUT /api/itinerario/tomar/:otId - Tomar OT del itinerario (operario)
router.put('/tomar/:otId', ItinerarioController.tomarOT);

// GET /api/itinerario/ots-pendientes - OTs pendientes sin asignar (admin)
router.get('/ots-pendientes', ItinerarioController.obtenerOTsPendientes);

// DELETE /api/itinerario/quitar/:otId - Quitar OT del itinerario (admin)
router.delete('/quitar/:otId', ItinerarioController.quitarDelItinerario);

export default router;
