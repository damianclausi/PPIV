import express from 'express';
import OTTecnicasController from '../controllers/OTTecnicasController.js';
import { autenticar } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(autenticar);

// GET /api/ot-tecnicas - Listar OTs técnicas con filtros
router.get('/', OTTecnicasController.listar);

// GET /api/ot-tecnicas/mis-ots - OTs del operario autenticado
router.get('/mis-ots', OTTecnicasController.obtenerMisOts);

// GET /api/ot-tecnicas/operario/:empleadoId - OTs de un operario específico
router.get('/operario/:empleadoId', OTTecnicasController.obtenerPorOperario);

// GET /api/ot-tecnicas/:id - Detalle de una OT
router.get('/:id', OTTecnicasController.obtenerDetalle);

// PUT /api/ot-tecnicas/:id/asignar - Asignar operario (supervisor)
router.put('/:id/asignar', OTTecnicasController.asignarOperario);

// PUT /api/ot-tecnicas/:id/iniciar - Iniciar trabajo (operario)
router.put('/:id/iniciar', OTTecnicasController.iniciarTrabajo);

// PUT /api/ot-tecnicas/:id/completar - Completar trabajo (operario)
router.put('/:id/completar', OTTecnicasController.completarTrabajo);

// PUT /api/ot-tecnicas/:id/cancelar - Cancelar OT (supervisor)
router.put('/:id/cancelar', OTTecnicasController.cancelar);

export default router;
