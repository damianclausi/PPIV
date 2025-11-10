import express from 'express';
import DetalleTipoReclamoController from '../controllers/DetalleTipoReclamoController.js';
import { autenticar } from '../middleware/auth.js';

const router = express.Router();

// GET /api/detalles-tipo-reclamo - Obtener todos los detalles
router.get('/', autenticar, DetalleTipoReclamoController.obtenerTodos);

// GET /api/detalles-tipo-reclamo/tipo/:tipoId - Obtener detalles por tipo (TECNICO=1, ADMINISTRATIVO=2)
// IMPORTANTE: Esta ruta debe ir ANTES de /:detalleId para que no sea capturada por ella
router.get('/tipo/:tipoId', autenticar, DetalleTipoReclamoController.obtenerPorTipo);

// GET /api/detalles-tipo-reclamo/:detalleId - Obtener un detalle específico
router.get('/:detalleId', autenticar, DetalleTipoReclamoController.obtenerPorId);

export default router;
